import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const { slug } = params;
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({ where: { space: { slug }, userId: user.id } });
    if (!isAdmin && !membership) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const tasks = await prisma.task.findMany({
      where: { space: { slug } },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        status: true,
        space: { select: { id: true, name: true, slug: true, ticker: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items = tasks.map((t) => {
      const hasDue = !!t.dueDate;
      const start = hasDue ? new Date(Math.min(new Date(t.createdAt).getTime(), new Date(t.dueDate as Date).getTime())) : t.createdAt;
      const end = hasDue ? t.dueDate as Date : t.createdAt;
      return ({
      id: t.id,
      number: t.number,
      title: t.summary,
      summary: t.summary,
      description: t.description || undefined,
      startDate: t.startDate || start,
      dueDate: t.dueDate || end,
      endDate: t.dueDate || end,
      progress: 0,
      priority: t.priority,
      status: t.status ? {
        id: t.status.id,
        name: t.status.name,
        color: t.status.color || undefined
      } : undefined,
      assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name || undefined, email: t.assignee.email, avatar: t.assignee.avatar || undefined } : undefined,
      parentId: t.parentId || undefined,
      children: [],
      space: t.space
    });
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Roadmap GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch roadmap' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

    const { slug } = params;
    const { title, description, startDate, endDate, priority = 'NORMAL', assigneeId } = await request.json();
    if (!title || typeof title !== 'string') return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({ where: { space: { slug }, userId: user.id } });
    if (!isAdmin && !membership) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

    const space = await prisma.space.findFirst({ where: { slug } });
    if (!space) return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });

    // Find a board and a start status to attach task
    let board = await prisma.board.findFirst({ where: { spaceId: space.id }, orderBy: { order: 'asc' } });
    if (!board) {
      board = await prisma.board.create({ data: { spaceId: space.id, name: 'Board', order: 1 } });
    }
    let startStatus = await prisma.status.findFirst({ where: { spaceId: space.id, isStart: true }, orderBy: { order: 'asc' } });
    if (!startStatus) {
      const created = await prisma.status.create({ data: { spaceId: space.id, name: 'To Do', key: 'todo', order: 1, isStart: true, isDone: false } });
      startStatus = created;
    }

    const task = await prisma.task.create({
      data: {
        spaceId: space.id,
        summary: title,
        description: description || null,
        priority,
        tags: '[]',
        dueDate: endDate ? new Date(endDate) : (startDate ? new Date(startDate) : null),
        assigneeId: assigneeId || null,
        statusId: startStatus.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        status: true,
        space: { select: { id: true, name: true, slug: true } }
      }
    });

    return NextResponse.json({ success: true, item: {
      id: task.id,
      title: task.summary,
      description: task.description || undefined,
      startDate: startDate ? new Date(startDate) : task.createdAt,
      endDate: endDate ? new Date(endDate) : (task.dueDate || task.createdAt),
      progress: 0,
      priority: task.priority,
      status: task.status?.isDone ? 'COMPLETED' : 'PLANNED',
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name || undefined, email: task.assignee.email, avatar: task.assignee.avatar || undefined } : undefined,
      parentId: undefined,
      children: [],
      space: task.space
    }});
  } catch (error) {
    console.error('Roadmap POST error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create roadmap item' }, { status: 500 });
  }
}
