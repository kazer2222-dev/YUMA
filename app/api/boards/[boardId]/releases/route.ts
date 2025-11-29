import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/boards/[boardId]/releases
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> | { boardId: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const boardId = resolvedParams.boardId;

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } });
    if (!board) {
      return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: board.spaceId, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const releases = await prisma.release.findMany({
      where: { boardId },
      include: {
        sprints: {
          include: {
            sprint: {
              include: {
                tasks: {
                  select: {
                    id: true,
                    storyPoints: true,
                    statusId: true,
                    status: { select: { isDone: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics for each release
    const releasesWithMetrics = releases.map((release) => {
      let totalTasks = 0;
      let totalStoryPoints = 0;
      let bugsFixed = 0;
      let newFeatures = 0;

      release.sprints.forEach((rs) => {
        const tasks = rs.sprint.tasks || [];
        totalTasks += tasks.length;
        tasks.forEach((task) => {
          if (task.storyPoints) {
            totalStoryPoints += task.storyPoints;
          }
          if (task.status?.isDone) {
            // Count done tasks as completed features
            // In production, you might want a more sophisticated approach
            newFeatures++;
          }
        });
      });

      const metrics = {
        totalTasks,
        totalStoryPoints,
        bugsFixed,
        newFeatures,
      };

      return {
        ...release,
        metrics,
      };
    });

    return NextResponse.json({ success: true, releases: releasesWithMetrics });
  } catch (error: any) {
    console.error('Releases GET error:', error);
    
    // Check for Prisma client missing Release model error
    if (error.message?.includes('Cannot read properties of undefined') || error.message?.includes('release')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database schema error. Please stop the development server, run "npx prisma generate", and restart the server.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch releases', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/releases
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> | { boardId: string } }
) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const boardId = resolvedParams.boardId;

    const board = await prisma.board.findUnique({ where: { id: boardId }, include: { space: true } });
    if (!board) {
      return NextResponse.json({ success: false, message: 'Board not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: board.spaceId, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, version, releaseDate, description, sprintIds, status } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    if (!version || typeof version !== 'string') {
      return NextResponse.json({ success: false, message: 'Version is required' }, { status: 400 });
    }

    // Only allow linking completed sprints
    if (Array.isArray(sprintIds) && sprintIds.length > 0) {
      const sprints = await prisma.sprint.findMany({
        where: { id: { in: sprintIds }, boardId, state: 'COMPLETED' },
      });

      if (sprints.length !== sprintIds.length) {
        return NextResponse.json({ success: false, message: 'All sprints must be completed' }, { status: 400 });
      }
    }

    const release = await prisma.release.create({
      data: {
        boardId,
        name: name.trim(),
        version: version.trim(),
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        description: description?.trim() || null,
        status: status || 'PENDING', // Default to PENDING
      },
    });

    // Link sprints if provided
    if (Array.isArray(sprintIds) && sprintIds.length > 0) {
      // Use individual creates to handle duplicates gracefully
      for (const sprintId of sprintIds) {
        try {
          await prisma.releaseSprint.create({
            data: {
              releaseId: release.id,
              sprintId,
            },
          });
        } catch (error: any) {
          // Ignore duplicate entry errors
          if (error.code !== 'P2002') {
            throw error;
          }
        }
      }
    }

    const releaseWithSprints = await prisma.release.findUnique({
      where: { id: release.id },
      include: {
        sprints: {
          include: {
            sprint: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, release: releaseWithSprints });
  } catch (error: any) {
    console.error('Release POST error:', error);
    
    // Check for Prisma client missing Release model error
    if (error.message?.includes('Cannot read properties of undefined') || error.message?.includes('release')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database schema error. Please stop the development server, run "npx prisma generate", and restart the server.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to create release', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}




