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

    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        members: {
          select: {
            user: {
              select: {
                email: true,
                name: true
              }
            },
            role: true
          },
          where: {
            role: 'OWNER'
          },
          take: 1
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const transformedSpaces = spaces.map(space => ({
      id: space.id,
      name: space.name,
      slug: space.slug,
      memberCount: space._count.members,
      taskCount: space._count.tasks,
      createdAt: space.createdAt.toISOString(),
      owner: space.members[0]?.user || { email: 'Unknown', name: 'Unknown' }
    }));

    return NextResponse.json({
      success: true,
      spaces: transformedSpaces
    });

  } catch (error) {
    console.error('Admin spaces error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
