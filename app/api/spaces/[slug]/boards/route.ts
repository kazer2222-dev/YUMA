import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
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

    // Fetch boards - type field may not exist if migration hasn't run
    // Try to fetch boards - handle type field gracefully
    let boards;
    try {
      // First try to check if type column exists
      const columnCheck = await prisma.$queryRaw<Array<{name: string}>>`
        SELECT name FROM pragma_table_info('boards') WHERE name = 'type'
      `.catch(() => []);
      
      const hasTypeColumn = Array.isArray(columnCheck) && columnCheck.length > 0;
      
      if (hasTypeColumn) {
        // Type column exists - use standard Prisma query
        boards = await prisma.board.findMany({
          where: { spaceId: space.id },
          orderBy: { order: 'asc' },
        });
      } else {
        // Type column doesn't exist - use raw SQL without type
        console.log('[Boards API] Type column not found, using raw query');
        const rawBoards = await prisma.$queryRaw<Array<{
          id: string;
          name: string;
          description: string | null;
          order: number;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          SELECT id, name, description, "order", "createdAt", "updatedAt"
          FROM boards
          WHERE "spaceId" = ${space.id}
          ORDER BY "order" ASC
        `;
        // Add type as 'KANBAN' by default for boards without type
        // We'll check for backlog status separately to determine if it's SCRUM
        boards = rawBoards.map(board => ({ ...board, type: 'KANBAN' as any }));
      }
    } catch (error: any) {
      console.error('[Boards API] Error fetching boards:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      boards,
    });
  } catch (error: any) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch boards',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

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

    // Check permissions - only OWNER, ADMIN can create boards
    if (!isAdmin && member && !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, methodology } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Board name is required' },
        { status: 400 }
      );
    }

    // Get current max order
    const maxOrder = await prisma.board.findFirst({
      where: { spaceId: space.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const method = (String(methodology || 'KANBAN').toUpperCase());
    const boardType = method === 'SCRUM' ? 'SCRUM' : 'KANBAN';
    
    // Build base board data
    const baseBoardData = {
      spaceId: space.id,
      name: name.trim(),
      description: description?.trim() || null,
      order: (maxOrder?.order ?? -1) + 1,
    };
    
    // Try to create with type field first, fallback to without if migration hasn't run
    let board;
    try {
      board = await prisma.board.create({
        data: {
          ...baseBoardData,
          type: boardType,
        },
      });
    } catch (error: any) {
      // If type field doesn't exist yet (migration not run), create without it
      if (error.message?.includes('Unknown argument `type`') || error.message?.includes('type')) {
        console.log('Type field not available yet, creating board without type (migration may not have run)');
        board = await prisma.board.create({
          data: baseBoardData,
        });
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    // Seed default statuses based on methodology (fallback to Kanban)
    try {
      // Check if statuses already exist for this space
      const existingStatuses = await prisma.status.findMany({
        where: { spaceId: space.id },
        select: { key: true },
      });
      
      const existingKeys = new Set(existingStatuses.map(s => s.key));
      
      if (method === 'SCRUM') {
        const scrumStatuses = [
          { spaceId: space.id, name: 'Backlog', key: 'backlog', order: 1, isStart: true, isDone: false },
          { spaceId: space.id, name: 'Selected for Development', key: 'selected', order: 2, isStart: false, isDone: false },
          { spaceId: space.id, name: 'In Progress', key: 'inprogress', order: 3, isStart: false, isDone: false },
          { spaceId: space.id, name: 'Review', key: 'review', order: 4, isStart: false, isDone: false },
          { spaceId: space.id, name: 'Done', key: 'done', order: 5, isStart: false, isDone: true },
        ];
        
        // IMPORTANT: For SCRUM boards, ALWAYS ensure backlog status exists
        // This is the key indicator for SCRUM detection
        const backlogStatus = scrumStatuses.find(s => s.key === 'backlog');
        if (backlogStatus && !existingKeys.has('backlog')) {
          await prisma.status.create({ data: backlogStatus });
          console.log(`[Board Creation] Created backlog status for SCRUM board in space ${space.slug}`);
        }
        
        // Only create other statuses that don't exist
        const statusesToCreate = scrumStatuses.filter(s => s.key !== 'backlog' && !existingKeys.has(s.key));
        
        if (statusesToCreate.length > 0) {
          // Create statuses individually to handle duplicates gracefully
          let createdCount = 0;
          for (const statusData of statusesToCreate) {
            try {
              await prisma.status.create({
                data: statusData,
              });
              createdCount++;
            } catch (error: any) {
              // Ignore duplicate entry errors
              if (error.code !== 'P2002') {
                throw error;
              }
            }
          }
          console.log(`[Board Creation] Created ${createdCount} additional SCRUM statuses for space ${space.slug}`);
        }
        
        console.log(`[Board Creation] SCRUM board setup complete - backlog status exists: ${existingKeys.has('backlog') || true}`);
      } else {
        const kanbanStatuses = [
          { spaceId: space.id, name: 'To Do', key: 'todo', order: 1, isStart: true, isDone: false },
          { spaceId: space.id, name: 'In Progress', key: 'inprogress', order: 2, isStart: false, isDone: false },
          { spaceId: space.id, name: 'Done', key: 'done', order: 3, isStart: false, isDone: true },
        ];
        
        // Only create statuses that don't exist
        const statusesToCreate = kanbanStatuses.filter(s => !existingKeys.has(s.key));
        
        if (statusesToCreate.length > 0) {
          // Create statuses individually to handle duplicates gracefully
          let createdCount = 0;
          for (const statusData of statusesToCreate) {
            try {
              await prisma.status.create({
                data: statusData,
              });
              createdCount++;
            } catch (error: any) {
              // Ignore duplicate entry errors
              if (error.code !== 'P2002') {
                throw error;
              }
            }
          }
          console.log(`[Board Creation] Created ${createdCount} Kanban statuses for space ${space.slug}`);
        }
      }
    } catch (e: any) {
      // Log the error but don't fail board creation
      console.error('[Board Creation] Error seeding statuses:', e);
      console.error('[Board Creation] Error details:', e.message, e.stack);
    }

    return NextResponse.json({
      success: true,
      board,
    });
  } catch (error: any) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create board',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

