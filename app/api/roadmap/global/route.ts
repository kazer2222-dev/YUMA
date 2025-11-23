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

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    const whereClause: any = {
      space: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    };

    if (spaceId) {
      whereClause.spaceId = spaceId;
    }

    // Get tasks that are marked as roadmap items
    const tasks = await prisma.task.findMany({
      where: {
        ...whereClause,
        // Add a field to mark tasks as roadmap items
        // For now, we'll use tasks with due dates as roadmap items
        dueDate: { not: null }
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
            color: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Transform tasks into roadmap items
    const roadmapItems = tasks.map(task => ({
      id: task.id,
      title: task.summary,
      description: task.description,
      startDate: task.createdAt.toISOString(),
      endDate: task.dueDate?.toISOString() || task.createdAt.toISOString(),
      progress: task.status.key === 'DONE' ? 100 : 
                task.status.key === 'IN_PROGRESS' ? 50 : 0,
      priority: task.priority,
      status: task.status.key === 'DONE' ? 'COMPLETED' :
              task.status.key === 'IN_PROGRESS' ? 'IN_PROGRESS' :
              task.status.key === 'BLOCKED' ? 'BLOCKED' : 'PLANNED',
      assignee: task.assignee,
      parentId: null, // For now, no parent-child relationships
      children: [],
      space: task.space
    }));

    return NextResponse.json({
      success: true,
      items: roadmapItems
    });

  } catch (error) {
    console.error('Roadmap fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
