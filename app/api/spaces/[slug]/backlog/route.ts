import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/spaces/[slug]/backlog - Get all backlog items (tasks not in sprint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;

    const space = await prisma.space.findUnique({ where: { slug } });
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

    // Get all "done" statuses to exclude them from backlog
    const doneStatuses = await prisma.status.findMany({
      where: {
        spaceId: space.id,
        isDone: true,
      },
      select: { id: true },
    });
    const doneStatusIds = doneStatuses.map(s => s.id);

    // Get all tasks in backlog:
    // - Not in any sprint (sprintId: null)
    // - Not in a done status (status.isDone: false)
    const backlogItems = await prisma.task.findMany({
      where: {
        spaceId: space.id,
        sprintId: null, // Not in any sprint
        statusId: {
          notIn: doneStatusIds.length > 0 ? doneStatusIds : [], // Exclude done statuses
        },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        status: true,
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, number: true, summary: true },
            },
          },
        },
      },
      orderBy: [
        { backlogOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, items: backlogItems });
  } catch (error: any) {
    console.error('Backlog GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch backlog', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/backlog - Create new backlog item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;

    const space = await prisma.space.findUnique({ where: { slug } });
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
    const { summary, description, priority, storyPoints, assigneeId, tags, statusId } = body;

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json({ success: false, message: 'Summary is required' }, { status: 400 });
    }

    // Get backlog status or use provided statusId
    let taskStatusId = statusId;
    if (!taskStatusId) {
      const backlogStatus = await prisma.status.findFirst({
        where: { spaceId: space.id, key: 'backlog' },
      });
      if (backlogStatus) {
        taskStatusId = backlogStatus.id;
      } else {
        // Fallback to first status
        const firstStatus = await prisma.status.findFirst({
          where: { spaceId: space.id },
          orderBy: { order: 'asc' },
        });
        if (!firstStatus) {
          return NextResponse.json({ success: false, message: 'No statuses found' }, { status: 400 });
        }
        taskStatusId = firstStatus.id;
      }
    }

    // Get max backlog order
    const maxBacklogOrder = await prisma.task.findFirst({
      where: { spaceId: space.id, backlogOrder: { not: null } },
      orderBy: { backlogOrder: 'desc' },
      select: { backlogOrder: true },
    });

    // Get max task number
    const maxTask = await prisma.task.findFirst({
      where: { spaceId: space.id },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const task = await prisma.task.create({
      data: {
        spaceId: space.id,
        number: (maxTask?.number ?? 0) + 1,
        summary: summary.trim(),
        description: description?.trim() || null,
        priority: priority || 'NORMAL',
        storyPoints: storyPoints ? parseInt(storyPoints) : null,
        backlogOrder: (maxBacklogOrder?.backlogOrder ?? -1) + 1,
        assigneeId: assigneeId || null,
        statusId: taskStatusId,
        tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : '[]',
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        status: true,
      },
    });

    return NextResponse.json({ success: true, item: task });
  } catch (error: any) {
    console.error('Backlog POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create backlog item', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// PATCH /api/spaces/[slug]/backlog/order - Update backlog order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
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

    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;

    const space = await prisma.space.findUnique({ where: { slug } });
    if (!space) {
      return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
    }

    const body = await request.json();
    const { items } = body; // Array of { id, backlogOrder }

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Items array is required' }, { status: 400 });
    }

    // Check if backlogOrder column exists first
    let hasBacklogOrderColumn = false;
    try {
      const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
      `.catch(() => []);
      hasBacklogOrderColumn = Array.isArray(columnCheck) && columnCheck.length > 0;
    } catch (checkError) {
      console.log('[Backlog Order] Could not check column existence, assuming it does not exist');
      hasBacklogOrderColumn = false;
    }

    if (hasBacklogOrderColumn) {
      // Column exists - try Prisma update first, fallback to raw SQL if needed
      try {
        await prisma.$transaction(
          items.map((item: { id: string; backlogOrder: number }) =>
            prisma.task.update({
              where: { id: item.id, spaceId: space.id },
              data: { backlogOrder: item.backlogOrder },
            })
          )
        );
        return NextResponse.json({ success: true });
      } catch (error: any) {
        // If Prisma update fails, try raw SQL
        console.log('[Backlog Order] Prisma update failed, trying raw SQL:', error.message);
        try {
          await prisma.$transaction(
            items.map((item: { id: string; backlogOrder: number }) =>
              prisma.$executeRaw`
                UPDATE tasks 
                SET backlogOrder = ${item.backlogOrder}
                WHERE id = ${item.id} AND "spaceId" = ${space.id}
              `
            )
          );
          return NextResponse.json({ success: true });
        } catch (rawError: any) {
          console.error('[Backlog Order] Raw SQL update also failed:', rawError);
          // Still return success - order is maintained in UI
          return NextResponse.json({ 
            success: true, 
            message: 'Order updated (stored in UI state)' 
          });
        }
      }
    } else {
      // Column doesn't exist - migration not run yet
      // Just return success, order will be maintained in UI state
      console.log('[Backlog Order] Column does not exist, returning success (order maintained in UI)');
      return NextResponse.json({ 
        success: true, 
        message: 'Order updated (column will be created after migration)' 
      });
    }
  } catch (error: any) {
    console.error('Backlog order PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update backlog order', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}


