import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ boardId: string }> | { boardId: string } }) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    const user = await AuthService.getUserFromToken(accessToken)
    if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const boardId = resolvedParams.boardId

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } })
    if (!board) return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 })

    const isAdmin = await AuthService.isAdmin(user.id)
    const membership = await prisma.spaceMember.findFirst({ where: { spaceId: board.spaceId, userId: user.id } })
    if (!isAdmin && !membership) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })

    // Fetch all sprints including CLOSED ones (filtering will be done on frontend if needed)
    const sprints = await prisma.sprint.findMany({
      where: { boardId: boardId },
      include: {
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

    // Sort tasks within each sprint by backlogOrder (reused for sprint ordering)
    const sprintsWithSortedTasks = sprints.map((sprint) => {
      const tasks = (sprint.tasks || []).sort((a: any, b: any) => {
        // Sort by backlogOrder if available (used for sprint ordering)
        const aOrder = (a as any).backlogOrder ?? null;
        const bOrder = (b as any).backlogOrder ?? null;
        if (aOrder !== null && bOrder !== null) {
          return aOrder - bOrder;
        }
        if (aOrder !== null) return -1;
        if (bOrder !== null) return 1;
        // Fallback to createdAt for tasks without order
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return { ...sprint, tasks };
    });

    // Calculate metrics for each sprint
    const sprintsWithMetrics = sprintsWithSortedTasks.map((sprint) => {
      const tasks = sprint.tasks || [];
      const totalStoryPoints = tasks.reduce((sum: number, task: any) => sum + (task.storyPoints || 0), 0);
      const completedStoryPoints = tasks
        .filter((task: any) => task.status?.isDone)
        .reduce((sum: number, task: any) => sum + (task.storyPoints || 0), 0);
      const completedTasks = tasks.filter((task: any) => task.status?.isDone).length;

      return {
        ...sprint,
        metrics: {
          totalTasks: tasks.length,
          completedTasks,
          totalStoryPoints,
          completedStoryPoints,
          completionPercentage: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
        },
      };
    });

    return NextResponse.json({ success: true, sprints: sprintsWithMetrics })
  } catch (e: any) {
    console.error('Sprints GET error:', e)
    return NextResponse.json({ success: false, message: 'Failed to fetch sprints', error: process.env.NODE_ENV === 'development' ? e.message : undefined }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ boardId: string }> | { boardId: string } }) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    const user = await AuthService.getUserFromToken(accessToken)
    if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })

    const resolvedParams = await Promise.resolve(params)
    const boardId = resolvedParams.boardId

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } })
    if (!board) return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 })
    const isAdmin = await AuthService.isAdmin(user.id)
    const membership = await prisma.spaceMember.findFirst({ where: { spaceId: board.spaceId, userId: user.id } })
    if (!isAdmin && !membership) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })

    const { name, goal, startDate, endDate } = await request.json()
    if (!name || typeof name !== 'string') return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })
    const maxOrder = await prisma.sprint.findFirst({ where: { boardId: boardId }, orderBy: { order: 'desc' }, select: { order: true } })
    const sprint = await prisma.sprint.create({
      data: {
        boardId: boardId,
        name,
        goal: goal || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        state: 'PLANNED', // Default to PLANNED (pending)
        order: (maxOrder?.order ?? -1) + 1,
      }
    })
    return NextResponse.json({ success: true, sprint })
  } catch (e: any) {
    console.error('Sprints POST error:', e)
    return NextResponse.json({ success: false, message: 'Failed to create sprint', error: process.env.NODE_ENV === 'development' ? e.message : undefined }, { status: 500 })
  }
}




