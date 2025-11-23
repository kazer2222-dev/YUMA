import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/boards/[boardId]/sprints/[sprintId] - Get single sprint with tasks
export async function GET(
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

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId, boardId },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            status: true,
          },
          orderBy: [{ status: { order: 'asc' } }, { createdAt: 'desc' }],
        },
      },
    });

    if (!sprint) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    // Calculate metrics - convert BigInt to Number if needed
    const totalStoryPoints = sprint.tasks.reduce((sum, task) => {
      const points = task.storyPoints ? Number(task.storyPoints) : 0;
      return sum + points;
    }, 0);
    const completedStoryPoints = sprint.tasks
      .filter((task) => task.status?.isDone)
      .reduce((sum, task) => {
        const points = task.storyPoints ? Number(task.storyPoints) : 0;
        return sum + points;
      }, 0);
    const completedTasks = sprint.tasks.filter((task) => task.status?.isDone).length;

    // Serialize sprint data, converting BigInt values to strings/numbers
    const serializedSprint = {
      ...sprint,
      id: String(sprint.id),
      boardId: sprint.boardId ? String(sprint.boardId) : null,
      tasks: sprint.tasks.map(task => ({
        ...task,
        id: String(task.id),
        storyPoints: task.storyPoints ? Number(task.storyPoints) : null,
        assignee: task.assignee ? {
          ...task.assignee,
          id: String(task.assignee.id),
        } : null,
        status: task.status ? {
          ...task.status,
          id: String(task.status.id),
        } : null,
      })),
      metrics: {
        totalTasks: sprint.tasks.length,
        completedTasks,
        totalStoryPoints,
        completedStoryPoints,
        completionPercentage: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
      },
    };

    return NextResponse.json({
      success: true,
      sprint: serializedSprint,
    });
  } catch (error: any) {
    console.error('Sprint GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// PATCH /api/boards/[boardId]/sprints/[sprintId] - Update sprint (start, end, edit)
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
    const { name, goal, startDate, endDate, state, action } = body;

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId, boardId } });
    if (!sprint) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    // Handle actions (start, end, reopen)
    let newState = state || sprint.state;
    let updateData: any = {};

    if (action === 'start') {
      if (sprint.state !== 'PLANNED') {
        return NextResponse.json({ success: false, message: 'Only planned sprints can be started' }, { status: 400 });
      }
      
      // Check if there's already an active sprint in this board
      const activeSprint = await prisma.sprint.findFirst({
        where: {
          boardId: boardId,
          state: 'ACTIVE',
          id: { not: sprintId }, // Exclude the current sprint
        },
      });
      
      if (activeSprint) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Another sprint "${activeSprint.name}" is already active. Please complete or close it before starting a new sprint.` 
          }, 
          { status: 400 }
        );
      }
      
      newState = 'ACTIVE';
      updateData.startDate = new Date();
    } else if (action === 'end' || action === 'complete') {
      if (sprint.state !== 'ACTIVE') {
        return NextResponse.json({ success: false, message: 'Only active sprints can be completed' }, { status: 400 });
      }
      
      // Handle task movement before completing
      const { moveTasks, taskIds, targetSprintId } = body;
      console.log('[Complete Sprint] Task movement params:', { moveTasks, taskIdsLength: taskIds?.length, targetSprintId });
      
      // Only move tasks if there are unfinished tasks to move
      if (moveTasks && taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        console.log('[Complete Sprint] Moving tasks:', taskIds.length, 'tasks');
        
        try {
          // Check if sprintId column exists
          const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
            SELECT name FROM pragma_table_info('tasks') WHERE name = 'sprintId'
          `.catch((err) => {
            console.error('[Complete Sprint] Error checking sprintId column:', err);
            return [];
          });
          console.log('[Complete Sprint] sprintId column exists:', Array.isArray(columnCheck) && columnCheck.length > 0);

          const hasSprintIdColumn = Array.isArray(columnCheck) && columnCheck.length > 0;

          if (hasSprintIdColumn) {
            if (moveTasks === 'next-sprint') {
              // Use provided targetSprintId if available, otherwise find the oldest pending sprint
              let targetSprint;
              if (targetSprintId && targetSprintId !== sprintId) {
                targetSprint = await prisma.sprint.findFirst({
                  where: {
                    id: targetSprintId,
                    boardId: boardId,
                    state: 'PLANNED',
                  },
                });
              } else {
                // Fallback: Find the oldest pending sprint (PLANNED state, ordered by order field)
                targetSprint = await prisma.sprint.findFirst({
                  where: {
                    boardId: boardId,
                    state: 'PLANNED',
                    id: { not: sprintId }, // Exclude current sprint
                  },
                  orderBy: { order: 'asc' },
                });
              }

              if (targetSprint) {
                console.log('[Complete Sprint] Moving tasks to target sprint:', targetSprint.id);
                // Move tasks to the target sprint and log activities
                for (const taskId of taskIds) {
                  await prisma.task.update({
                    where: { id: taskId, sprintId: sprintId },
                    data: { sprintId: targetSprint.id },
                  });
                  
                  // Log sprint change activity
                  await prisma.activity.create({
                    data: {
                      taskId,
                      userId: user.id,
                      type: 'SPRINT_CHANGED',
                      data: JSON.stringify({
                        from: sprintId,
                        to: targetSprint.id,
                        oldSprintId: sprintId,
                        sprintId: targetSprint.id,
                      }),
                    },
                  }).catch(err => {
                    console.error('[Complete Sprint] Failed to create activity:', err);
                  });
                }
                console.log('[Complete Sprint] Successfully moved tasks to target sprint');
              } else {
                console.log('[Complete Sprint] No target sprint found, moving to backlog');
                // No pending sprint found, move to backlog instead
                const backlogOrderCheck = await prisma.$queryRaw<Array<{name: string}>>`
                  SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
                `.catch(() => []);

                const hasBacklogOrderColumn = Array.isArray(backlogOrderCheck) && backlogOrderCheck.length > 0;

                if (hasBacklogOrderColumn) {
                  // Get max backlogOrder to append at the end
                  const maxOrderResult = await prisma.$queryRaw<Array<{max: number | null}>>`
                    SELECT MAX(backlogOrder) as max FROM tasks WHERE spaceId = ${board.spaceId} AND (sprintId IS NULL OR sprintId = '')
                  `.catch((err) => {
                    console.error('[Complete Sprint] Error getting max backlogOrder:', err);
                    return [{ max: null }];
                  });

                  const maxOrder = maxOrderResult[0]?.max != null ? Number(maxOrderResult[0].max) : -1;
                  
                  // Update tasks: remove from sprint and set backlogOrder, logging activities
                  console.log('[Complete Sprint] Moving tasks to backlog with backlogOrder');
                  for (let index = 0; index < taskIds.length; index++) {
                    const taskId = taskIds[index];
                    await prisma.task.update({
                      where: { id: taskId },
                      data: {
                        sprintId: null,
                        backlogOrder: maxOrder + index + 1,
                      },
                    });
                    
                    // Log sprint change activity
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
                      console.error('[Complete Sprint] Failed to create activity:', err);
                    });
                  }
                  console.log('[Complete Sprint] Successfully moved tasks to backlog');
                } else {
                  console.log('[Complete Sprint] backlogOrder column not found, removing from sprint only');
                  // backlogOrder column doesn't exist, just remove from sprint and log activities
                  for (const taskId of taskIds) {
                    await prisma.task.update({
                      where: { id: taskId, sprintId: sprintId },
                      data: { sprintId: null },
                    });
                    
                    // Log sprint change activity
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
                      console.error('[Complete Sprint] Failed to create activity:', err);
                    });
                  }
                  console.log('[Complete Sprint] Successfully removed tasks from sprint');
                }
              }
            } else if (moveTasks === 'backlog') {
              console.log('[Complete Sprint] Moving tasks directly to backlog');
              // Move tasks back to backlog
              const backlogOrderCheck = await prisma.$queryRaw<Array<{name: string}>>`
                SELECT name FROM pragma_table_info('tasks') WHERE name = 'backlogOrder'
              `.catch(() => []);

              const hasBacklogOrderColumn = Array.isArray(backlogOrderCheck) && backlogOrderCheck.length > 0;

              if (hasBacklogOrderColumn) {
                // Get max backlogOrder to append at the end
                const maxOrderResult = await prisma.$queryRaw<Array<{max: number | null}>>`
                  SELECT MAX(backlogOrder) as max FROM tasks WHERE spaceId = ${board.spaceId} AND (sprintId IS NULL OR sprintId = '')
                `.catch((err) => {
                  console.error('[Complete Sprint] Error getting max backlogOrder:', err);
                  return [{ max: null }];
                });

                const maxOrder = maxOrderResult[0]?.max != null ? Number(maxOrderResult[0].max) : -1;
                
                // Update tasks: remove from sprint and set backlogOrder, logging activities
                console.log('[Complete Sprint] Moving tasks to backlog with backlogOrder');
                for (let index = 0; index < taskIds.length; index++) {
                  const taskId = taskIds[index];
                  await prisma.task.update({
                    where: { id: taskId },
                    data: {
                      sprintId: null,
                      backlogOrder: maxOrder + index + 1,
                    },
                  });
                  
                  // Log sprint change activity
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
                    console.error('[Complete Sprint] Failed to create activity:', err);
                  });
                }
                console.log('[Complete Sprint] Successfully moved tasks to backlog');
              } else {
                console.log('[Complete Sprint] backlogOrder column not found, removing from sprint only');
                // backlogOrder column doesn't exist, just remove from sprint and log activities
                for (const taskId of taskIds) {
                  await prisma.task.update({
                    where: { id: taskId, sprintId: sprintId },
                    data: { sprintId: null },
                  });
                  
                  // Log sprint change activity
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
                    console.error('[Complete Sprint] Failed to create activity:', err);
                  });
                }
                console.log('[Complete Sprint] Successfully removed tasks from sprint');
              }
            }
          }
        } catch (taskMovementError: any) {
          console.error('[Complete Sprint] Error during task movement:', taskMovementError);
          throw taskMovementError; // Re-throw to be caught by outer catch
        }
      } else {
        console.log('[Complete Sprint] No tasks to move (taskIds is empty or not provided)');
      }

      // Use COMPLETED for backward compatibility (CLOSED may not be supported in all databases)
      newState = 'COMPLETED';
      updateData.endDate = new Date();
      console.log('[Complete Sprint] Setting sprint state to COMPLETED');
      
      // Calculate velocity (only count completed tasks that are still in the sprint)
      // Skip velocity calculation for now - it's optional and may cause issues if column doesn't exist
      // Velocity can be calculated later if needed
      console.log('[Complete Sprint] Skipping velocity calculation (optional field)');
    } else if (action === 'reopen') {
      if (sprint.state !== 'COMPLETED' && sprint.state !== 'CLOSED') {
        return NextResponse.json({ success: false, message: 'Only closed/completed sprints can be reopened' }, { status: 400 });
      }
      newState = 'ACTIVE';
    }

    // Update sprint fields
    if (name !== undefined) updateData.name = name.trim();
    if (goal !== undefined) updateData.goal = goal?.trim() || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    updateData.state = newState;
    
    // Make sure endDate is a valid Date object if it's set
    if (updateData.endDate && !(updateData.endDate instanceof Date)) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Clean up updateData - only include defined fields and remove undefined values
    // Only include essential fields to avoid database constraint issues
    const cleanUpdateData: any = {};
    if (updateData.state) cleanUpdateData.state = updateData.state;
    if (updateData.endDate) cleanUpdateData.endDate = updateData.endDate;
    if (updateData.startDate !== undefined) cleanUpdateData.startDate = updateData.startDate;
    if (updateData.name !== undefined) cleanUpdateData.name = updateData.name;
    if (updateData.goal !== undefined) cleanUpdateData.goal = updateData.goal;
    // Skip velocity - it's optional and may not exist in all database schemas

    console.log('[Complete Sprint] Updating sprint with data:', {
      sprintId,
      newState,
      updateDataKeys: Object.keys(cleanUpdateData),
      endDate: cleanUpdateData.endDate,
      velocity: cleanUpdateData.velocity,
    });

    try {
      const updated = await prisma.sprint.update({
        where: { id: sprintId },
        data: cleanUpdateData,
        include: {
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              status: true,
            },
          },
        },
      });

      // Serialize sprint data, converting BigInt values to strings/numbers
      const serializedSprint = {
        ...updated,
        id: String(updated.id),
        boardId: updated.boardId ? String(updated.boardId) : null,
        tasks: updated.tasks.map(task => ({
          ...task,
          id: String(task.id),
          storyPoints: task.storyPoints ? Number(task.storyPoints) : null,
          assignee: task.assignee ? {
            ...task.assignee,
            id: String(task.assignee.id),
          } : null,
          status: task.status ? {
            ...task.status,
            id: String(task.status.id),
          } : null,
        })),
      };

      console.log('[Complete Sprint] Sprint updated successfully');
      return NextResponse.json({ success: true, sprint: serializedSprint });
    } catch (updateError: any) {
      console.error('[Complete Sprint] Error updating sprint:', updateError);
      console.error('[Complete Sprint] Error details:', {
        message: updateError.message,
        code: updateError.code,
        meta: updateError.meta,
        newState,
        cleanUpdateData,
        fullError: JSON.stringify(updateError, Object.getOwnPropertyNames(updateError)),
      });
      
      // Return a more detailed error message
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update sprint',
          error: process.env.NODE_ENV === 'development' ? updateError.message : undefined,
          errorCode: updateError.code,
          errorMeta: process.env.NODE_ENV === 'development' ? updateError.meta : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Sprint PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/sprints/[sprintId]
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

    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId, boardId } });
    if (!sprint) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    // Only allow deletion of planned/pending sprints (not active or completed)
    if (sprint.state === 'ACTIVE') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete an active sprint. Please complete the sprint before deleting it.' 
      }, { status: 400 });
    }
    
    if (sprint.state !== 'PLANNED') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only pending sprints can be deleted. Please complete or close the sprint first.' 
      }, { status: 400 });
    }

    await prisma.sprint.delete({ where: { id: sprintId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sprint DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
