import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { boardId: string; statusId: string } }
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

    const { boardId, statusId } = params;
    let updateData = await request.json();

    // Check if user is admin or has admin/owner role in the space that contains this board
    const isAdmin = await AuthService.isAdmin(user.id);
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ...(isAdmin ? {} : {
          space: {
            members: {
              some: {
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          }
        })
      },
      select: { spaceId: true }
    });

    if (!board) {
      return NextResponse.json(
        { success: false, message: 'Board not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Verify status exists and belongs to the board's space
    const status = await prisma.status.findFirst({
      where: {
        id: statusId,
        spaceId: board.spaceId
      }
    });

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status not found' },
        { status: 404 }
      );
    }

    // Handle board-specific fields (visibility and order) separately
    if ('hidden' in updateData || 'order' in updateData) {
      const visible = 'hidden' in updateData ? !updateData.hidden : true;
      const order = 'order' in updateData ? updateData.order : undefined;
      
      await prisma.boardStatusVisibility.upsert({
        where: {
          boardId_statusId: {
            boardId,
            statusId
          }
        },
        create: {
          boardId,
          statusId,
          visible,
          order
        },
        update: {
          ...(visible !== undefined && { visible }),
          ...(order !== undefined && { order })
        }
      });
      
      // Remove hidden and order from updateData as they're not columns on Status
      const { hidden, order: _order, ...statusUpdateData } = updateData;
      updateData = statusUpdateData;
    }

    // If this is being set as start status, unset other start statuses in the space
    if (updateData.isStart === true) {
      await prisma.status.updateMany({
        where: {
          spaceId: board.spaceId,
          isStart: true,
          id: { not: statusId }
        },
        data: {
          isStart: false
        }
      });
    }

    // If this is being set as done status, unset other done statuses in the space
    if (updateData.isDone === true) {
      await prisma.status.updateMany({
        where: {
          spaceId: board.spaceId,
          isDone: true,
          id: { not: statusId }
        },
        data: {
          isDone: false
        }
      });
    }

    // Update status if there's anything to update
    const updatedStatus = Object.keys(updateData).length > 0
      ? await prisma.status.update({
          where: { id: statusId },
          data: updateData
        })
      : status;

    return NextResponse.json({
      success: true,
      status: updatedStatus
    });
  } catch (error) {
    console.error('Error updating board status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { boardId: string; statusId: string } }
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

    const { boardId, statusId } = params;

    // Check if user is admin or has admin/owner role in the space that contains this board
    const isAdmin = await AuthService.isAdmin(user.id);
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ...(isAdmin ? {} : {
          space: {
            members: {
              some: {
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          }
        })
      }
    });

    if (!board) {
      return NextResponse.json(
        { success: false, message: 'Board not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Delete status
    await prisma.status.delete({
      where: {
        id: statusId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting board status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete status' },
      { status: 500 }
    );
  }
}








