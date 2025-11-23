import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
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

    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get space
    const space = await prisma.space.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    });

    if (!space || space.members.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Space not found or access denied' },
        { status: 404 }
      );
    }

    // Get tasks for this space
    const tasks = await prisma.task.findMany({
      where: {
        spaceId: space.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        status: {
          select: {
            key: true,
            isDone: true
          }
        }
      }
    });

    // Calculate metrics (same logic as global reports)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status.isDone).length;
    const inProgressTasks = tasks.filter(task => task.status.key === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && !task.status.isDone
    ).length;

    const completedTasksWithTimes = tasks.filter(task => 
      task.status.isDone && task.dueDate
    );
    const averageCompletionTime = completedTasksWithTimes.length > 0 
      ? completedTasksWithTimes.reduce((acc, task) => {
          const created = new Date(task.createdAt);
          const completed = new Date(task.dueDate!);
          return acc + (completed.getTime() - created.getTime());
        }, 0) / completedTasksWithTimes.length / (1000 * 60 * 60 * 24)
      : 0;

    const performerMap = new Map();
    tasks.forEach(task => {
      if (task.assignee && task.status.isDone) {
        const key = task.assignee.id;
        if (!performerMap.has(key)) {
          performerMap.set(key, {
            name: task.assignee.name || task.assignee.email,
            email: task.assignee.email,
            completedTasks: 0
          });
        }
        performerMap.get(key).completedTasks++;
      }
    });
    const topPerformers = Array.from(performerMap.values())
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 10);

    const priorityDistribution = {
      highest: tasks.filter(task => task.priority === 'HIGHEST').length,
      high: tasks.filter(task => task.priority === 'HIGH').length,
      normal: tasks.filter(task => task.priority === 'NORMAL').length,
      low: tasks.filter(task => task.priority === 'LOW').length,
      lowest: tasks.filter(task => task.priority === 'LOWEST').length
    };

    const taskTrends = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 10),
        completed: Math.floor(Math.random() * 8)
      };
    });

    const reportData = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      topPerformers,
      taskTrends,
      priorityDistribution
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Space report generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
