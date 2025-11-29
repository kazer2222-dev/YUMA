import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; taskId: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { slug, taskId } = params;

    // Check if user is admin or member of space
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get task with all related data
    const task = await prisma.task.findFirst({
      where: isAdmin
        ? { id: taskId }
        : {
            id: taskId,
            space: { slug }
          },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
            ticker: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        status: true,
        sprint: {
          select: {
            id: true,
            name: true,
            state: true
          }
        },
        parent: {
          select: {
            id: true,
            summary: true
          }
        },
        subtasks: {
          include: {
            status: {
              select: {
                name: true,
                color: true
              }
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                summary: true,
                status: {
                  select: {
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        },
        dependents: {
          include: {
            task: {
              select: {
                id: true,
                summary: true,
                status: {
                  select: {
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        },
        attachments: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate required relations exist
    if (!task.status) {
      console.error(`Task ${taskId} has no status assigned`);
      return NextResponse.json(
        { success: false, message: 'Task status is missing' },
        { status: 500 }
      );
    }

    // Collect all sprints where this task was (from activities and current sprint)
    const sprintIds = new Set<string>();
    
    // Add current sprint if exists
    if (task.sprint?.id) {
      sprintIds.add(task.sprint.id);
    }
    if ((task as any).sprintId) {
      sprintIds.add((task as any).sprintId);
    }
    
    // Parse activities to find sprint changes - collect ALL sprint IDs from history
    if (task.activities) {
      for (const activity of task.activities) {
        try {
          const activityData = activity.data ? JSON.parse(activity.data) : {};
          
          // Check SPRINT_CHANGED activity type (most specific)
          if (activity.type === 'SPRINT_CHANGED') {
            if (activityData.sprintId) {
              sprintIds.add(activityData.sprintId);
            }
            if (activityData.oldSprintId) {
              sprintIds.add(activityData.oldSprintId);
            }
            if (activityData.from) {
              sprintIds.add(activityData.from);
            }
            if (activityData.to) {
              sprintIds.add(activityData.to);
            }
          }
          
          // Check UPDATED activity type for sprintChanged field
          if (activity.type === 'UPDATED' && activityData.sprintChanged) {
            if (activityData.sprintChanged.from) {
              sprintIds.add(activityData.sprintChanged.from);
            }
            if (activityData.sprintChanged.to) {
              sprintIds.add(activityData.sprintChanged.to);
            }
            if (activityData.sprintChanged.oldSprintId) {
              sprintIds.add(activityData.sprintChanged.oldSprintId);
            }
            if (activityData.sprintChanged.sprintId) {
              sprintIds.add(activityData.sprintChanged.sprintId);
            }
          }
          
          // Check for sprintId in any activity data (fallback)
          if (activityData.sprintId) {
            sprintIds.add(activityData.sprintId);
          }
          if (activityData.oldSprintId) {
            sprintIds.add(activityData.oldSprintId);
          }
          
          // Check CREATED activity - might have initial sprint
          if (activity.type === 'CREATED' && activityData.sprintId) {
            sprintIds.add(activityData.sprintId);
          }
        } catch (e) {
          // Ignore parsing errors but log them in development
          if (process.env.NODE_ENV === 'development') {
            console.error('[Get Task] Error parsing activity:', e, activity);
          }
        }
      }
    }
    
    console.log('[Get Task] Collected sprint IDs:', Array.from(sprintIds), 'for task', taskId);

    // Fetch all sprint details
    const allSprints = sprintIds.size > 0 ? await prisma.sprint.findMany({
      where: {
        id: { in: Array.from(sprintIds) }
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    }) : [];

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        number: task.number,
        summary: task.summary,
        description: task.description,
        priority: task.priority,
        tags: (() => {
          try {
            return task.tags ? JSON.parse(task.tags) : [];
          } catch (e) {
            console.error('Error parsing tags:', e, 'tags value:', task.tags);
            return [];
          }
        })(),
        dueDate: task.dueDate,
        startDate: task.startDate,
        estimate: task.estimate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assignee || null,
        status: task.status,
        sprint: task.sprint || null,
        sprints: allSprints, // All sprints where task was
        sprintId: (task as any).sprintId || null,
        parent: task.parent || null,
        space: task.space,
        subtasks: task.subtasks || [],
        dependencies: task.dependencies?.map(dep => dep.dependsOn) || [],
        dependents: task.dependents?.map(dep => dep.task) || [],
        attachments: task.attachments || [],
        comments: task.comments || [],
        activities: (task.activities || []).map(activity => {
          try {
            return {
              id: activity.id,
              type: activity.type,
              data: activity.data ? JSON.parse(activity.data) : {},
              createdAt: activity.createdAt,
              user: activity.user
            };
          } catch (e) {
            console.error('Error parsing activity data:', e);
            return {
              id: activity.id,
              type: activity.type,
              data: {},
              createdAt: activity.createdAt,
              user: activity.user
            };
          }
        }),
        customFieldValues: (task.customFieldValues || []).map(cfv => {
          try {
            return {
              id: cfv.id,
              value: cfv.value ? JSON.parse(cfv.value) : null,
              customField: cfv.customField
            };
          } catch (e) {
            console.error('Error parsing custom field value:', e);
            return {
              id: cfv.id,
              value: null,
              customField: cfv.customField
            };
          }
        })
      }
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const { taskId, slug } = resolvedParams;
    console.error('Error fetching task:', error);
    console.error('Error stack:', error?.stack);
    console.error('Task ID:', taskId, 'Space slug:', slug);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to fetch task: ${error?.message || 'Unknown error'}`,
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; taskId: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { slug, taskId } = params;
    const {
      summary,
      description,
      priority,
      tags,
      dueDate,
      startDate,
      estimate,
      assigneeId,
      statusId,
      parentId,
      releaseVersion,
      customFieldValues
    } = await request.json();

    // Check if user is admin or member of space
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get current task to track changes
    const currentTask = await prisma.task.findFirst({
      where: isAdmin
        ? { id: taskId }
        : {
            id: taskId,
            space: { slug }
          },
      include: {
        status: true,
        assignee: true
      }
    });

    if (!currentTask) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (summary !== undefined) updateData.summary = summary;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (estimate !== undefined) updateData.estimate = estimate;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (statusId !== undefined) updateData.statusId = statusId;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (releaseVersion !== undefined) {
      // If setting releaseVersion, validate it exists (or set to null)
      if (releaseVersion) {
        const space = await prisma.space.findUnique({ where: { slug } });
        if (space) {
          const release = await prisma.release.findFirst({
            where: {
              board: { spaceId: space.id },
              version: releaseVersion,
            },
          });
          if (!release) {
            return NextResponse.json(
              { success: false, message: 'Release version not found' },
              { status: 400 }
            );
          }
          // If task already has a different releaseVersion, the replacement is handled automatically
          // by setting the new releaseVersion (the old one is overwritten)
        }
        updateData.releaseVersion = releaseVersion;
      } else {
        // Setting to null - remove from release
        updateData.releaseVersion = null;
      }
    }
    
    // Validate date range
    if (updateData.startDate && updateData.dueDate && updateData.startDate > updateData.dueDate) {
      return NextResponse.json(
        { success: false, message: 'Start date must be before or equal to due date' },
        { status: 400 }
      );
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        status: true,
        parent: {
          select: {
            id: true,
            summary: true
          }
        },
        customFieldValues: {
          include: {
            customField: true
          }
        }
      }
    });

    // Update custom field values if provided
    if (customFieldValues) {
      // Delete existing custom field values
      await prisma.customFieldValue.deleteMany({
        where: { taskId }
      });

      // Create new custom field values
      if (customFieldValues.length > 0) {
        await prisma.customFieldValue.createMany({
          data: customFieldValues.map((cfv: any) => ({
            taskId,
            customFieldId: cfv.customFieldId,
            value: JSON.stringify(cfv.value)
          }))
        });
      }
    }

    // Create activity log for significant changes
    const changes: any = {};
    if (currentTask.statusId !== updatedTask.statusId) {
      changes.statusChanged = {
        from: currentTask.status?.name,
        to: updatedTask.status?.name
      };
    }
    if (currentTask.assigneeId !== updatedTask.assigneeId) {
      changes.assigneeChanged = {
        from: currentTask.assignee?.email,
        to: updatedTask.assignee?.email
      };
    }
    // Log sprint changes
    const currentSprintId = (currentTask as any).sprintId || null;
    const updatedSprintId = (updatedTask as any).sprintId || null;
    if (currentSprintId !== updatedSprintId) {
      changes.sprintChanged = {
        from: currentSprintId,
        to: updatedSprintId,
        oldSprintId: currentSprintId,
        sprintId: updatedSprintId
      };
      // Also log as separate activity type for easier tracking
      await prisma.activity.create({
        data: {
          taskId,
          userId: user.id,
          type: 'SPRINT_CHANGED',
          data: JSON.stringify({
            from: currentSprintId,
            to: updatedSprintId,
            oldSprintId: currentSprintId,
            sprintId: updatedSprintId
          })
        }
      });
    }

    if (Object.keys(changes).length > 0) {
      await prisma.activity.create({
        data: {
          taskId,
          userId: user.id,
          type: 'UPDATED',
          data: JSON.stringify(changes)
        }
      });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        summary: updatedTask.summary,
        description: updatedTask.description,
        priority: updatedTask.priority,
        tags: updatedTask.tags ? JSON.parse(updatedTask.tags) : [],
        dueDate: updatedTask.dueDate,
        estimate: updatedTask.estimate,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
        assignee: updatedTask.assignee,
        status: updatedTask.status,
        parent: updatedTask.parent,
        customFieldValues: updatedTask.customFieldValues.map(cfv => ({
          id: cfv.id,
          value: cfv.value ? JSON.parse(cfv.value) : null,
          customField: cfv.customField
        }))
      }
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, message: `Failed to update task: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; taskId: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { slug, taskId } = params;

    // Check if user is admin or member of space
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if task exists
    const task = await prisma.task.findFirst({
      where: isAdmin
        ? { id: taskId }
        : {
            id: taskId,
            space: { slug }
          }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete task (cascade will handle related records)
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

