import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; statusId: string } }
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

    const { slug, statusId } = params;
    const body = await request.json();

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

    // Verify status exists and belongs to space
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        space: { slug }
      }
    });

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status not found' },
        { status: 404 }
      );
    }

    // If key is being changed, check if new key already exists
    if (body.key && body.key !== status.key) {
      const existingStatus = await prisma.status.findFirst({
        where: {
          space: { slug },
          key: body.key,
          id: { not: statusId }
        }
      });

      if (existingStatus) {
        return NextResponse.json(
          { success: false, message: 'Status key already exists' },
          { status: 400 }
        );
      }
    }

    // If this is being set as start status, unset other start statuses
    if (body.isStart === true) {
      await prisma.status.updateMany({
        where: {
          space: { slug },
          isStart: true,
          id: { not: statusId }
        },
        data: {
          isStart: false
        }
      });
    }

    // If this is being set as done status, unset other done statuses
    if (body.isDone === true) {
      await prisma.status.updateMany({
        where: {
          space: { slug },
          isDone: true,
          id: { not: statusId }
        },
        data: {
          isDone: false
        }
      });
    }

    // Update status
    const updatedStatus = await prisma.status.update({
      where: { id: statusId },
      data: {
        name: body.name,
        key: body.key,
        color: body.color,
        description: body.description,
        order: body.order,
        isStart: body.isStart,
        isDone: body.isDone,
        wipLimit: body.wipLimit
      }
    });

    return NextResponse.json({
      success: true,
      status: {
        id: updatedStatus.id,
        name: updatedStatus.name,
        key: updatedStatus.key,
        color: updatedStatus.color,
        description: updatedStatus.description,
        order: updatedStatus.order,
        isStart: updatedStatus.isStart,
        isDone: updatedStatus.isDone,
        wipLimit: updatedStatus.wipLimit,
        createdAt: updatedStatus.createdAt,
        updatedAt: updatedStatus.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; statusId: string } }
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

    const { slug, statusId } = params;

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

    // Verify status exists and belongs to space
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        space: { slug }
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status not found' },
        { status: 404 }
      );
    }

    // Check if status has tasks
    if (status._count.tasks > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete status with assigned tasks' },
        { status: 400 }
      );
    }

    // Delete status
    await prisma.status.delete({
      where: { id: statusId }
    });

    return NextResponse.json({
      success: true,
      message: 'Status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete status' },
      { status: 500 }
    );
  }
}
















