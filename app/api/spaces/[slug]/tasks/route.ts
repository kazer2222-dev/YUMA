import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;
    
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    const priority = searchParams.get('priority');
    const tags = searchParams.get('tags');
    const parentId = searchParams.get('parentId');

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

    // Build where clause
    const where: any = {
      space: { slug }
    };

    if (status) where.statusId = status;
    if (assignee) where.assigneeId = assignee;
    if (priority) where.priority = priority;
    if (parentId) where.parentId = parentId;
    if (tags) {
      // For SQLite, we'll search in the tags string
      where.tags = { contains: tags };
    }

    // Get tasks with related data
    const tasks = await prisma.task.findMany({
      where,
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
        workflowStatus: {
          select: {
            id: true,
            key: true,
            name: true,
            category: true,
            color: true,
            statusRefId: true,
          }
        },
        parent: {
          select: {
            id: true,
            summary: true
          }
        },
        subtasks: {
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
        customFieldValues: {
          include: {
            customField: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      tasks: tasks.map(task => ({
        id: task.id,
        number: task.number,
        summary: task.summary,
        description: task.description,
        priority: task.priority,
        tags: task.tags ? JSON.parse(task.tags) : [],
        startDate: task.startDate,
        dueDate: task.dueDate,
        estimate: task.estimate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assignee,
        status: task.status,
        workflowId: task.workflowId,
        workflowStatusId: task.workflowStatusId,
        workflowStatus: task.workflowStatus
          ? {
              id: task.workflowStatus.id,
              key: task.workflowStatus.key,
              name: task.workflowStatus.name,
              category: task.workflowStatus.category,
              color: task.workflowStatus.color,
              statusRefId: task.workflowStatus.statusRefId,
            }
          : null,
        sprintId: (task as any).sprintId || null,
        releaseVersion: (task as any).releaseVersion || null,
        parent: task.parent,
        subtasks: task.subtasks,
        dependencies: task.dependencies.map(dep => dep.dependsOn),
        customFieldValues: task.customFieldValues.map(cfv => {
          let parsed: any;
          try {
            parsed = JSON.parse(cfv.value);
          } catch (e) {
            parsed = cfv.value;
          }
          return {
            id: cfv.id,
            value: parsed,
            customField: cfv.customField
          };
        }),
        commentCount: task._count.comments,
        attachmentCount: task._count.attachments
      }))
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tasks', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const { slug } = resolvedParams;
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

    const {
      summary,
      description,
      priority = 'NORMAL',
      tags = [],
      startDate,
      dueDate,
      estimate,
      assigneeId,
      statusId,
      parentId,
      customFieldValues = []
    } = await request.json();

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Task summary is required' },
        { status: 400 }
      );
    }

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

    // Get space (validate existence and permissions)
    const space = await prisma.space.findFirst({
      where: { slug }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    if (!statusId) {
      return NextResponse.json(
        { success: false, message: 'statusId is required for task creation' },
        { status: 400 }
      );
    }

    // Get the highest task number for this space
    const maxTask = await prisma.task.findFirst({
      where: { spaceId: space.id },
      orderBy: { number: 'desc' },
      select: { number: true }
    });

    const nextNumber = maxTask ? maxTask.number + 1 : 1;

    // Prepare task data
    const taskData: any = {
      spaceId: space.id,
      number: nextNumber,
      summary,
      description,
      priority,
      tags: JSON.stringify(tags),
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimate,
      assigneeId: assigneeId || null,
      statusId,
      ...(parentId && { parentId })
    };

    // Only include customFieldValues if there are any
    if (customFieldValues && customFieldValues.length > 0) {
      taskData.customFieldValues = {
        create: customFieldValues.map((cfv: any) => ({
          customField: { connect: { id: cfv.customFieldId } },
          value: JSON.stringify(cfv.value)
        }))
      };
    }

    // Create task
    const task = await prisma.task.create({
      data: taskData,
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

    // Create activity log
    await prisma.activity.create({
      data: {
        taskId: task.id,
        userId: user.id,
        type: 'CREATED',
        data: JSON.stringify({
          summary: task.summary,
          status: task.status.name
        })
      }
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        number: task.number,
        summary: task.summary,
        description: task.description,
        priority: task.priority,
        tags: JSON.parse(task.tags),
        dueDate: task.dueDate,
        estimate: task.estimate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assignee,
        status: task.status,
        parent: task.parent,
        customFieldValues: task.customFieldValues.map(cfv => ({
          id: cfv.id,
          value: JSON.parse(cfv.value),
          customField: cfv.customField
        }))
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create task' },
      { status: 500 }
    );
  }
}

