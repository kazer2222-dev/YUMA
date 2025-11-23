import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
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

    const { boardId } = params;
    if (!boardId) {
      return NextResponse.json(
        { success: false, message: 'Missing boardId' },
        { status: 400 }
      );
    }

    // Validate board exists (simpler lookup; permission check follows)
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, spaceId: true }
    });
    if (!board) {
      return NextResponse.json(
        { success: false, message: 'Board not found' },
        { status: 404 }
      );
    }

    // Permission check: allow admins or members of the board's space
    const isAdmin = await AuthService.isAdmin(user.id);
    if (!isAdmin) {
      const membership = await prisma.spaceMember.findFirst({
        where: { spaceId: board.spaceId, userId: user.id }
      });
      if (!membership) {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get statuses for the space, with board visibility and order
    const spaceStatuses = await prisma.status.findMany({
      where: { spaceId: board.spaceId },
      orderBy: { order: 'asc' },
      include: {
        boardVisibilities: {
          where: { boardId },
          select: { visible: true, order: true }
        }
      }
    });

    // Bootstrap defaults if none exist for the space
    let statuses;
    if (spaceStatuses.length === 0) {
      const defaults = [
        { name: 'To Do', key: 'todo', isStart: true, isDone: false },
        { name: 'In Progress', key: 'in-progress', isStart: false, isDone: false },
        { name: 'Done', key: 'done', isStart: false, isDone: true }
      ];
      
      statuses = await Promise.all(
        defaults.map((s, idx) =>
          prisma.status.create({
            data: {
              spaceId: board.spaceId,
              name: s.name,
              key: s.key,
              order: idx + 1,
              isStart: s.isStart,
              isDone: s.isDone,
              boardVisibilities: {
                create: {
                  boardId,
                  visible: true,
                  order: idx + 1
                }
              }
            },
            include: {
              boardVisibilities: {
                where: { boardId },
                select: { visible: true, order: true }
              }
            }
          })
        )
      );
    } else {
      // Create visibility entries for any statuses that don't have them for this board
      // Also update existing entries that don't have order set
      await Promise.all(
        spaceStatuses.map(async (status, idx) => {
          const hasVisibility = status.boardVisibilities.length > 0;
          if (!hasVisibility) {
            await prisma.boardStatusVisibility.create({
              data: {
                boardId,
                statusId: status.id,
                visible: true,
                order: status.order || (idx + 1) // Use space-level order as default, fallback to index
              }
            });
          } else {
            // Update existing entry if it doesn't have an order
            const visibility = status.boardVisibilities[0];
            if (visibility && (visibility.order === null || visibility.order === undefined)) {
              await prisma.boardStatusVisibility.update({
                where: {
                  boardId_statusId: {
                    boardId,
                    statusId: status.id
                  }
                },
                data: {
                  order: status.order || (idx + 1)
                }
              });
            }
          }
        })
      );

      // Re-fetch to get all visibilities
      statuses = await prisma.status.findMany({
        where: { spaceId: board.spaceId },
        orderBy: { order: 'asc' },
        include: {
          boardVisibilities: {
            where: { boardId },
            select: { visible: true, order: true }
          }
        }
      });
    }

    // Map to include visibility and use board-level order if available, otherwise space-level order
    const mappedStatuses = statuses.map((status, idx) => {
      const boardOrder = status.boardVisibilities[0]?.order;
      const order = boardOrder !== null && boardOrder !== undefined ? boardOrder : (status.order || idx + 1);
      
      return {
        id: status.id,
        name: status.name,
        key: status.key,
        color: status.color,
        description: status.description,
        order: order, // Use board order if set, otherwise space order, fallback to index
        isStart: status.isStart,
        isDone: status.isDone,
        wipLimit: status.wipLimit,
        hidden: !status.boardVisibilities[0]?.visible,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt
      };
    });

    // Sort by computed order
    mappedStatuses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json({ success: true, statuses: mappedStatuses });
  } catch (error: any) {
    console.error('Error fetching board statuses:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch statuses';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
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

    const { boardId } = params;
    const { name, key, color, description, order, isStart, isDone, wipLimit } = await request.json();

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

    // Check if status with this key already exists in the space
    const existingStatus = await prisma.status.findFirst({
      where: {
        spaceId: board.spaceId,
        key
      }
    });

    if (existingStatus) {
      // Status already exists in space, just add visibility for this board
      await prisma.boardStatusVisibility.create({
        data: {
          boardId,
          statusId: existingStatus.id,
          visible: true
        }
      });

      return NextResponse.json({
        success: true,
        status: existingStatus
      });
    }

    // If this is being set as start status, unset other start statuses in the space
    if (isStart === true) {
      await prisma.status.updateMany({
        where: {
          spaceId: board.spaceId,
          isStart: true
        },
        data: {
          isStart: false
        }
      });
    }

    // If this is being set as done status, unset other done statuses in the space
    if (isDone === true) {
      await prisma.status.updateMany({
        where: {
          spaceId: board.spaceId,
          isDone: true
        },
        data: {
          isDone: false
        }
      });
    }

    // Create new status at space level
    const status = await prisma.status.create({
      data: {
        spaceId: board.spaceId,
        name,
        key,
        color,
        description,
        order: order || 0,
        isStart: isStart || false,
        isDone: isDone || false,
        wipLimit,
        boardVisibilities: {
          create: {
            boardId,
            visible: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error creating board status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create status' },
      { status: 500 }
    );
  }
}

