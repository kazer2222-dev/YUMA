import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

/**
 * Fix/Repair endpoint for SCRUM boards
 * Creates backlog status if missing and attempts to set board type
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const body = await request.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { success: false, message: 'boardId is required' },
        { status: 400 }
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board || board.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if backlog status exists
    const existingStatuses = await prisma.status.findMany({
      where: { spaceId: space.id },
      select: { key: true },
    });

    const existingKeys = new Set(existingStatuses.map(s => s.key));
    let backlogCreated = false;

    // Create backlog status if it doesn't exist
    if (!existingKeys.has('backlog')) {
      try {
        await prisma.status.create({
          data: {
            spaceId: space.id,
            name: 'Backlog',
            key: 'backlog',
            order: 1,
            isStart: true,
            isDone: false,
          },
        });
        backlogCreated = true;
        console.log(`[Fix SCRUM Board] Created backlog status for board ${boardId}`);
      } catch (e: any) {
        console.error('[Fix SCRUM Board] Failed to create backlog status:', e);
      }
    }

    // Try to update board type to SCRUM
    let typeUpdated = false;
    try {
      // Check if type column exists
      const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('boards') WHERE name = 'type'
      `.catch(() => []);
      
      const hasTypeColumn = Array.isArray(columnCheck) && columnCheck.length > 0;
      
      if (hasTypeColumn) {
        await prisma.board.update({
          where: { id: boardId },
          data: { type: 'SCRUM' },
        });
        typeUpdated = true;
        console.log(`[Fix SCRUM Board] Updated board ${boardId} type to SCRUM`);
      } else {
        console.log('[Fix SCRUM Board] Type column does not exist, skipping type update');
      }
    } catch (e: any) {
      console.error('[Fix SCRUM Board] Failed to update board type:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'SCRUM board fixed',
      backlogCreated,
      typeUpdated,
    });
  } catch (error: any) {
    console.error('Error fixing SCRUM board:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fix SCRUM board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

































