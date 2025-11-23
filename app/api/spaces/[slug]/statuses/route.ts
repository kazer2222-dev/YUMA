import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;

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

    // Get the space first
    const space = await prisma.space.findUnique({
      where: { slug }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Get statuses for the space
    let statuses = await prisma.status.findMany({
      where: {
        spaceId: space.id
      },
      orderBy: {
        order: 'asc'
      }
    });

    // If no statuses exist, create default ones
    if (statuses.length === 0) {
      statuses = await Promise.all([
        prisma.status.create({
          data: {
            spaceId: space.id,
            name: 'To Do',
            key: 'todo',
            color: '#808080',
            order: 1,
            isStart: true,
            isDone: false
          }
        }),
        prisma.status.create({
          data: {
            spaceId: space.id,
            name: 'In Progress',
            key: 'in-progress',
            color: '#2563eb',
            order: 2,
            isStart: false,
            isDone: false
          }
        }),
        prisma.status.create({
          data: {
            spaceId: space.id,
            name: 'Done',
            key: 'done',
            color: '#16a34a',
            order: 3,
            isStart: false,
            isDone: true
          }
        })
      ]);
    }

    return NextResponse.json({
      success: true,
      statuses: statuses.map(status => ({
        id: status.id,
        name: status.name,
        key: status.key,
        color: status.color,
        description: status.description,
        order: status.order,
        isStart: status.isStart,
        isDone: status.isDone,
        wipLimit: status.wipLimit,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch statuses' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;
    const {
      name,
      key,
      color,
      description,
      isStart = false,
      isDone = false,
      wipLimit
    } = await request.json();

    if (!name || !key) {
      return NextResponse.json(
        { success: false, message: 'Name and key are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or has admin/owner role in space
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if key already exists in space
    const existingStatus = await prisma.status.findFirst({
      where: {
        space: { slug },
        key
      }
    });

    if (existingStatus) {
      return NextResponse.json(
        { success: false, message: 'Status key already exists' },
        { status: 400 }
      );
    }

    // If this is the start status, unset other start statuses
    if (isStart) {
      await prisma.status.updateMany({
        where: {
          space: { slug },
          isStart: true
        },
        data: {
          isStart: false
        }
      });
    }

    // If this is the done status, unset other done statuses
    if (isDone) {
      await prisma.status.updateMany({
        where: {
          space: { slug },
          isDone: true
        },
        data: {
          isDone: false
        }
      });
    }

    // Get the next order number
    const lastStatus = await prisma.status.findFirst({
      where: {
        space: { slug }
      },
      orderBy: {
        order: 'desc'
      }
    });

    const order = lastStatus ? lastStatus.order + 1 : 1;

    // Get the space to get its ID
    const space = await prisma.space.findUnique({
      where: { slug }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Create status
    const status = await prisma.status.create({
      data: {
        spaceId: space.id,
        name,
        key,
        color,
        description,
        order,
        isStart,
        isDone,
        wipLimit
      }
    });

    return NextResponse.json({
      success: true,
      status: {
        id: status.id,
        name: status.name,
        key: status.key,
        color: status.color,
        description: status.description,
        order: status.order,
        isStart: status.isStart,
        isDone: status.isDone,
        wipLimit: status.wipLimit,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create status' },
      { status: 500 }
    );
  }
}

