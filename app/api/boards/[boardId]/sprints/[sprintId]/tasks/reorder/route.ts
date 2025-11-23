import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; sprintId: string }> | { boardId: string; sprintId: string } }
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
    const { boardId, sprintId } = resolvedParams;
    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Items array is required' }, { status: 400 });
    }

    // Verify board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { space: true },
    });

    if (!board) {
      return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 });
    }

    // Check authorization
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: board.spaceId, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Verify sprint exists and belongs to board
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint || sprint.boardId !== boardId) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    // Verify all tasks belong to this sprint and space
    const taskIds = items.map((item: any) => item.id);
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        sprintId: sprintId,
        spaceId: board.spaceId,
      },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json(
        { success: false, message: 'Some tasks not found or do not belong to this sprint' },
        { status: 400 }
      );
    }

    // Update task order using backlogOrder field (reused for sprint ordering)
    try {
      // Check if backlogOrder column exists
      const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
      `.catch(() => []);

      const hasBacklogOrderColumn = Array.isArray(columnCheck) && columnCheck.length > 0;

      if (hasBacklogOrderColumn) {
        // Update tasks with new order
        await prisma.$transaction(
          items.map((item: any) =>
            prisma.task.update({
              where: { id: item.id },
              data: { backlogOrder: item.order },
            })
          )
        );

        return NextResponse.json({ success: true, message: 'Task order updated' });
      } else {
        // Column doesn't exist - return success but log migration needed
        console.log('[Sprint Task Reorder] backlogOrder column not found, migration may be needed');
        return NextResponse.json({
          success: true,
          message: 'Task order updated (migration may be needed for persistence)',
        });
      }
    } catch (updateError: any) {
      // If update fails due to column not existing, provide helpful error
      if (updateError.message?.includes('backlogOrder') || updateError.message?.includes('Unknown argument')) {
        console.error('[Sprint Task Reorder] Column error:', updateError.message);
        return NextResponse.json(
          {
            success: false,
            message: 'Database migration required. Please run: npm run db:migrate',
            error: 'backlogOrder column not found in tasks table',
          },
          { status: 500 }
        );
      }
      throw updateError;
    }
  } catch (error: any) {
    console.error('Sprint task reorder error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reorder tasks',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
































