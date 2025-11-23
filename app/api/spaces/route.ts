import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    console.log(`[API /spaces] Received cookies:`, {
      hasAccessToken: !!accessToken,
      cookieNames: Array.from(request.cookies.getAll().map(c => c.name)),
      allCookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value ? 'SET' : 'NOT SET' }))
    });
    
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

    // Check if user is admin - admins can see all spaces
    const isAdmin = await AuthService.isAdmin(user.id);

    // Get spaces - admins see all, members see only their spaces
    const spaces = await prisma.space.findMany({
      where: isAdmin
        ? {}
        : {
            members: {
              some: {
                userId: user.id
              }
            }
          },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        boards: {
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[API /spaces] Found ${spaces.length} spaces for user ${user.id}`);

    const mappedSpaces = spaces.map(space => ({
      id: space.id,
      name: space.name,
      description: space.description,
      slug: space.slug,
      ticker: space.ticker,
      timezone: space.timezone,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      memberCount: space._count.members,
      taskCount: space._count.tasks,
      boards: space.boards.map(board => ({
        id: board.id,
        name: board.name,
        description: board.description,
        order: board.order
      })),
      members: space.members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user
      }))
    }));

    console.log(`[API /spaces] Returning ${mappedSpaces.length} spaces`);

    return NextResponse.json({
      success: true,
      spaces: mappedSpaces
    });
  } catch (error: any) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch spaces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { name, description, ticker } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Space name is required' },
        { status: 400 }
      );
    }

    // Validate ticker
    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Ticker is required' },
        { status: 400 }
      );
    }

    // Validate ticker format: only English uppercase letters, 1-10 characters
    if (!/^[A-Z]{1,10}$/.test(ticker)) {
      return NextResponse.json(
        { success: false, message: 'Ticker must contain only English uppercase letters (A-Z), 1-10 characters' },
        { status: 400 }
      );
    }

    // Check if ticker already exists
    const existingSpace = await prisma.space.findUnique({ where: { ticker } });
    if (existingSpace) {
      return NextResponse.json(
        { success: false, message: 'Ticker already in use' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.space.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create space with owner membership and settings
    const space = await prisma.space.create({
      data: {
        name,
        description,
        ticker,
        slug,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        },
        settings: {
          create: {
            allowCustomFields: true,
            allowIntegrations: true,
            aiAutomationsEnabled: true
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        settings: true
      }
    });

    // Create default statuses at the space level
    const defaultStatuses = await Promise.all([
      prisma.status.create({
        data: {
          spaceId: space.id,
          name: 'To Do',
          key: 'todo',
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
          order: 3,
          isStart: false,
          isDone: true
        }
      })
    ]);

    // Create default board
    const defaultBoard = await prisma.board.create({
      data: {
        spaceId: space.id,
        name: 'Board',
        description: 'Default board',
        order: 1
      }
    });

    // Make all default statuses visible for the default board
    await Promise.all(
      defaultStatuses.map(status =>
        prisma.boardStatusVisibility.create({
          data: {
            boardId: defaultBoard.id,
            statusId: status.id,
            visible: true
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      space: {
        id: space.id,
        name: space.name,
        description: space.description,
        slug: space.slug,
        ticker: space.ticker,
        timezone: space.timezone,
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        defaultBoardId: defaultBoard.id,
        members: space.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        settings: space.settings
      }
    });
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create space' },
      { status: 500 }
    );
  }
}

