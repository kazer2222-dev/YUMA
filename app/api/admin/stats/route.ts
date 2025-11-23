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

    // Check if user is admin
    const adminCheck = await AuthService.requireAdmin(user.id);
    if (!adminCheck.success) {
      return NextResponse.json(
        { success: false, message: adminCheck.message },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalSpaces,
      totalTasks,
      activeUsers,
      storageUsed,
      apiCalls
    ] = await Promise.all([
      prisma.user.count(),
      prisma.space.count(),
      prisma.task.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      // Mock storage calculation
      Promise.resolve(1024), // 1GB
      // Mock API calls
      Promise.resolve(1500)
    ]);

    const stats = {
      totalUsers,
      totalSpaces,
      totalTasks,
      activeUsers,
      systemHealth: 'healthy' as const,
      storageUsed,
      apiCalls
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
