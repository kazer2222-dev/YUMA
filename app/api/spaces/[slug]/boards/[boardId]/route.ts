import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; boardId: string } }
) {
  try {
    const cookies = request.cookies;
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Try to fetch board with type field, fallback if type doesn't exist
    let board;
    try {
      board = await prisma.board.findUnique({
        where: { id: params.boardId },
        include: { space: true },
      });
    } catch (error: any) {
      // If query fails due to type field, try raw SQL
      if (error.message?.includes('type') || error.message?.includes('column')) {
        const rawBoard = await prisma.$queryRaw<Array<{
          id: string;
          spaceId: string;
          name: string;
          description: string | null;
          order: number;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          SELECT id, "spaceId", name, description, "order", "createdAt", "updatedAt"
          FROM boards
          WHERE id = ${params.boardId}
        `;
        
        if (rawBoard.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Board not found' },
            { status: 404 }
          );
        }
        
        // Get space info separately
        const spaceInfo = await prisma.space.findUnique({
          where: { id: rawBoard[0].spaceId },
        });
        
        board = {
          ...rawBoard[0],
          type: 'KANBAN' as any, // Default for boards without type
          space: spaceInfo,
        };
      } else {
        throw error;
      }
    }

    if (!board || board.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      board,
    });
  } catch (error: any) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; boardId: string } }
) {
  try {
    const cookies = request.cookies;
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
    });

    if (!board || board.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    // Check permissions - only OWNER, ADMIN can update boards
    if (!isAdmin && member && !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, order, type } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (order !== undefined) updateData.order = order;
    if (type !== undefined) {
      // Try to update type field - may fail if column doesn't exist
      try {
        updateData.type = type;
      } catch (e) {
        // Type column doesn't exist - skip it
        console.log('[Board Update] Type field not available, skipping type update');
      }
    }

    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      board: updatedBoard,
    });
  } catch (error: any) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; boardId: string } }
) {
  try {
    const cookies = request.cookies;
    const accessToken = cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
    });

    if (!board || board.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    // Check permissions - only OWNER, ADMIN can delete boards
    if (!isAdmin && member && !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete the board (statuses are at space level, not board level)
    // The delete will cascade to BoardStatusVisibility, sprints, etc.
    await prisma.board.delete({
      where: { id: params.boardId },
    });

    return NextResponse.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

