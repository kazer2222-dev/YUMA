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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();

    if (!query || query.length === 0) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    const searchLower = query.toLowerCase();

    // Get user's accessible spaces
    const isAdmin = await AuthService.isAdmin(user.id);
    const userSpaces = await prisma.space.findMany({
      where: isAdmin ? {} : {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        ticker: true
      }
    });
    const spaceIds = userSpaces.map(s => s.id);

    // For SQLite, we need to fetch all tasks and filter in memory for case-insensitive search
    const allTasks = await prisma.task.findMany({
      where: {
        spaceId: {
          in: spaceIds
        }
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
        status: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Case-insensitive filtering in memory
    const filteredTasks = allTasks.filter(task => {
      // Case-insensitive search in summary
      if (task.summary && task.summary.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Case-insensitive search in description
      if (task.description && task.description.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in task key (TICKER-NUMBER)
      if (task.number !== null) {
        const taskKey = `${task.space.ticker}-${task.number}`;
        if (taskKey.toLowerCase().includes(searchLower)) {
          return true;
        }
      }
      
      return false;
    });

    // Remove duplicates and limit results
    const taskMap = new Map();
    filteredTasks.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      }
    });

    // Transform and limit results
    const results = Array.from(taskMap.values())
      .slice(0, 20)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(task => ({
        id: task.id,
        key: `${task.space.ticker}-${task.number}`,
        summary: task.summary,
        status: task.status,
        space: {
          name: task.space.name,
          slug: task.space.slug,
          ticker: task.space.ticker
        }
      }));

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


