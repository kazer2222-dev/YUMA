import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// POST /api/boards/[boardId]/sprints/[sprintId]/tasks - Add tasks to sprint
export async function POST(
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

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } });
    if (!board) {
      return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: board.spaceId, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Task IDs array is required' }, { status: 400 });
    }

    // Verify all tasks belong to the same space
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds }, spaceId: board.spaceId },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json({ success: false, message: 'Some tasks not found or access denied' }, { status: 400 });
    }

    // Update tasks to assign to sprint and clear backlog order
    try {
      // First, check if sprintId column exists
      const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('tasks') WHERE name = 'sprintId'
      `.catch(() => []);

      const hasSprintIdColumn = Array.isArray(columnCheck) && columnCheck.length > 0;

      if (hasSprintIdColumn) {
        // Check if backlogOrder column exists
        const backlogOrderCheck = await prisma.$queryRaw<Array<{name: string}>>`
          SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
        `.catch(() => []);

        const hasBacklogOrderColumn = Array.isArray(backlogOrderCheck) && backlogOrderCheck.length > 0;

        if (hasBacklogOrderColumn) {
          // Both columns exist - use Prisma
          // Update tasks individually to log activities
          for (const taskId of taskIds) {
            const currentTask = await prisma.task.findUnique({
              where: { id: taskId },
              select: { sprintId: true },
            });
            
            const oldSprintId = (currentTask as any)?.sprintId || null;
            
            await prisma.task.update({
              where: { id: taskId },
              data: {
                sprintId,
                backlogOrder: null, // Remove from backlog when added to sprint
              },
            });
            
            // Log sprint change activity if sprint actually changed
            if (oldSprintId !== sprintId) {
              await prisma.activity.create({
                data: {
                  taskId,
                  userId: user.id,
                  type: 'SPRINT_CHANGED',
                  data: JSON.stringify({
                    from: oldSprintId,
                    to: sprintId,
                    oldSprintId,
                    sprintId,
                  }),
                },
              }).catch(err => {
                console.error('[Add Tasks to Sprint] Failed to create activity:', err);
              });
            }
          }
        } else {
          // Only sprintId exists
          // Update tasks individually to log activities
          for (const taskId of taskIds) {
            const currentTask = await prisma.task.findUnique({
              where: { id: taskId },
              select: { sprintId: true },
            });
            
            const oldSprintId = (currentTask as any)?.sprintId || null;
            
            await prisma.task.update({
              where: { id: taskId },
              data: {
                sprintId,
              },
            });
            
            // Log sprint change activity if sprint actually changed
            if (oldSprintId !== sprintId) {
              await prisma.activity.create({
                data: {
                  taskId,
                  userId: user.id,
                  type: 'SPRINT_CHANGED',
                  data: JSON.stringify({
                    from: oldSprintId,
                    to: sprintId,
                    oldSprintId,
                    sprintId,
                  }),
                },
              }).catch(err => {
                console.error('[Add Tasks to Sprint] Failed to create activity:', err);
              });
            }
          }
        }
      } else {
        // sprintId column doesn't exist - use raw SQL
        console.log('[Add Tasks to Sprint] sprintId column not found, migration may be needed');
        return NextResponse.json(
          { success: false, message: 'Database migration required. Please run: npm run db:migrate', error: 'sprintId column not found in tasks table' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: `${tasks.length} task(s) added to sprint` });
    } catch (updateError: any) {
      // If update fails due to column not existing, provide helpful error
      if (updateError.message?.includes('sprintId') || updateError.message?.includes('Unknown argument')) {
        console.error('[Add Tasks to Sprint] Prisma update failed - sprintId column may not exist:', updateError.message);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Database migration required. The sprintId column does not exist in the tasks table. Please run: npm run db:migrate', 
            error: process.env.NODE_ENV === 'development' ? updateError.message : undefined 
          },
          { status: 500 }
        );
      } else {
        throw updateError; // Re-throw if it's a different error
      }
    }
  } catch (error: any) {
    console.error('Add tasks to sprint error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add tasks to sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/sprints/[sprintId]/tasks - Remove tasks from sprint
export async function DELETE(
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

    // Verify board exists and user has access
    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } });
    if (!board) {
      return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: board.spaceId, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Task IDs array is required' }, { status: 400 });
    }

    // Verify all tasks belong to the sprint and space
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds }, sprintId, spaceId: board.spaceId },
    });

    if (tasks.length !== taskIds.length) {
      return NextResponse.json({ success: false, message: 'Some tasks not found or not in this sprint' }, { status: 400 });
    }

    try {
      // Check if sprintId and backlogOrder columns exist
      const sprintIdCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('tasks') WHERE name = 'sprintId'
      `.catch(() => []);

      const backlogOrderCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
      `.catch(() => []);

      const hasSprintIdColumn = Array.isArray(sprintIdCheck) && sprintIdCheck.length > 0;
      const hasBacklogOrderColumn = Array.isArray(backlogOrderCheck) && backlogOrderCheck.length > 0;

      if (!hasSprintIdColumn) {
        console.log('[Remove Tasks from Sprint] sprintId column not found, migration may be needed');
        return NextResponse.json(
          { success: false, message: 'Database migration required. Please run: npm run db:migrate', error: 'sprintId column not found in tasks table' },
          { status: 500 }
        );
      }

      if (hasBacklogOrderColumn) {
        // Get max backlog order to append removed tasks
        const maxBacklogOrder = await prisma.task.findFirst({
          where: { sprintId: null, backlogOrder: { not: null } },
          orderBy: { backlogOrder: 'desc' },
          select: { backlogOrder: true },
        }).catch(() => null);

        let backlogOrder = (maxBacklogOrder?.backlogOrder ?? -1) + 1;

        // Remove tasks from sprint and add back to backlog, logging activities
        for (const taskId of taskIds) {
          await prisma.task.update({
            where: { id: taskId, sprintId },
            data: {
              sprintId: null,
              backlogOrder: backlogOrder++,
            },
          });
          
          // Log sprint change activity (moving from sprint to backlog)
          await prisma.activity.create({
            data: {
              taskId,
              userId: user.id,
              type: 'SPRINT_CHANGED',
              data: JSON.stringify({
                from: sprintId,
                to: null,
                oldSprintId: sprintId,
                sprintId: null,
              }),
            },
          }).catch(err => {
            console.error('[Remove Tasks from Sprint] Failed to create activity:', err);
          });
        }
      } else {
        // Only sprintId exists, no backlogOrder
        // Remove tasks from sprint and log activities
        for (const taskId of taskIds) {
          await prisma.task.update({
            where: { id: taskId, sprintId },
            data: {
              sprintId: null,
            },
          });
          
          // Log sprint change activity (moving from sprint to backlog)
          await prisma.activity.create({
            data: {
              taskId,
              userId: user.id,
              type: 'SPRINT_CHANGED',
              data: JSON.stringify({
                from: sprintId,
                to: null,
                oldSprintId: sprintId,
                sprintId: null,
              }),
            },
          }).catch(err => {
            console.error('[Remove Tasks from Sprint] Failed to create activity:', err);
          });
        }
      }

      return NextResponse.json({ success: true, message: `${taskIds.length} task(s) removed from sprint` });
    } catch (updateError: any) {
      // If update fails due to column not existing, provide helpful error
      if (updateError.message?.includes('sprintId') || updateError.message?.includes('Unknown argument')) {
        console.error('[Remove Tasks from Sprint] Prisma update failed - sprintId column may not exist:', updateError.message);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Database migration required. The sprintId column does not exist in the tasks table. Please run: npm run db:migrate', 
            error: process.env.NODE_ENV === 'development' ? updateError.message : undefined 
          },
          { status: 500 }
        );
      } else {
        throw updateError; // Re-throw if it's a different error
      }
    }
  } catch (error: any) {
    console.error('Remove tasks from sprint error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove tasks from sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}


