import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Get all tasks from spaces where user is a member
    const tasks = await prisma.task.findMany({
      where: {
        space: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
            isDone: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
            ticker: true
          }
        },
        customFieldValues: {
          include: {
            customField: {
              select: {
                id: true,
                name: true,
                key: true,
                type: true
              }
            }
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
        dueDate: 'asc'
      }
    });

    // Transform tasks to include comment and attachment counts
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      number: task.number,
      summary: task.summary,
      description: task.description,
      priority: task.priority,
      tags: task.tags ? task.tags.split(',').map(tag => tag.trim()) : [],
      dueDate: task.dueDate,
      estimate: task.estimate,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: task.assignee,
      status: task.status,
      space: task.space,
      customFieldValues: task.customFieldValues,
      commentCount: task._count.comments,
      attachmentCount: task._count.attachments
    }));

    return NextResponse.json({
      success: true,
      tasks: transformedTasks
    });

  } catch (error) {
    console.error('Global tasks fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
