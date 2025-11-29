import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: space.id, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Get all boards for this space
    const boards = await prisma.board.findMany({
      where: { spaceId: space.id },
      select: { id: true },
    });

    const boardIds = boards.map(b => b.id);

    if (boardIds.length === 0) {
      return NextResponse.json({ success: true, sprints: [] });
    }

    // Fetch all sprints from all boards in this space
    const sprints = await prisma.sprint.findMany({
      where: { boardId: { in: boardIds } },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            status: { select: { id: true, name: true, key: true, isDone: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Sort tasks within each sprint by backlogOrder
    const sprintsWithSortedTasks = sprints.map((sprint) => {
      const tasks = (sprint.tasks || []).sort((a: any, b: any) => {
        const aOrder = (a as any).backlogOrder ?? null;
        const bOrder = (b as any).backlogOrder ?? null;
        if (aOrder !== null && bOrder !== null) {
          return aOrder - bOrder;
        }
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return { ...sprint, tasks };
    });

    return NextResponse.json({ success: true, sprints: sprintsWithSortedTasks });
  } catch (error: any) {
    console.error('Sprints GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sprints', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: space.id, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, goal, startDate, endDate, boardId } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    // If boardId is provided, use it. Otherwise, get the first board for this space
    let targetBoardId = boardId;
    if (!targetBoardId) {
      const firstBoard = await prisma.board.findFirst({
        where: { spaceId: space.id },
        select: { id: true },
      });
      if (!firstBoard) {
        return NextResponse.json({ success: false, message: 'No board found in this space. Please create a board first.' }, { status: 400 });
      }
      targetBoardId = firstBoard.id;
    }

    // Verify the board belongs to this space
    const board = await prisma.board.findUnique({
      where: { id: targetBoardId },
      select: { id: true, spaceId: true },
    });

    if (!board || board.spaceId !== space.id) {
      return NextResponse.json({ success: false, message: 'Board not found or does not belong to this space' }, { status: 404 });
    }

    // Get the max order for sprints in this board
    const maxOrder = await prisma.sprint.findFirst({
      where: { boardId: targetBoardId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const sprint = await prisma.sprint.create({
      data: {
        boardId: targetBoardId,
        name,
        goal: goal || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        state: 'PLANNED',
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            status: { select: { id: true, name: true, key: true, isDone: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, sprint });
  } catch (error: any) {
    console.error('Sprints POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}





























