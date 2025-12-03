import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// PATCH /api/spaces/[slug]/sprints/[sprintId] - Update sprint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; sprintId: string } }
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: space.id, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Find the sprint and verify it belongs to a board in this space
    const sprint = await prisma.sprint.findUnique({
      where: { id: params.sprintId },
      include: {
        board: {
          select: { id: true, spaceId: true },
        },
      },
    });

    if (!sprint) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    if (sprint.board.spaceId !== space.id) {
      return NextResponse.json({ success: false, message: 'Sprint does not belong to this space' }, { status: 403 });
    }

    const body = await request.json();
    const { name, goal, startDate, endDate, state, action } = body;

    // Handle actions (start, end, reopen)
    let newState = state || sprint.state;
    let updateData: any = {};

    if (action === 'start') {
      if (sprint.state !== 'PLANNED') {
        return NextResponse.json({ success: false, message: 'Only planned sprints can be started' }, { status: 400 });
      }
      
      // Check if there's already an active sprint in this board
      const activeSprint = await prisma.sprint.findFirst({
        where: {
          boardId: sprint.boardId,
          state: 'ACTIVE',
          id: { not: params.sprintId },
        },
      });
      
      if (activeSprint) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Another sprint "${activeSprint.name}" is already active. Please complete or close it before starting a new sprint.` 
          }, 
          { status: 400 }
        );
      }
      
      newState = 'ACTIVE';
      updateData.startDate = new Date();
    } else if (action === 'end' || action === 'complete') {
      if (sprint.state !== 'ACTIVE') {
        return NextResponse.json({ success: false, message: 'Only active sprints can be completed' }, { status: 400 });
      }
      newState = 'COMPLETED';
      updateData.endDate = new Date();
    } else if (action === 'reopen') {
      if (sprint.state !== 'COMPLETED' && sprint.state !== 'CLOSED') {
        return NextResponse.json({ success: false, message: 'Only closed/completed sprints can be reopened' }, { status: 400 });
      }
      newState = 'ACTIVE';
    }

    // Update sprint fields
    if (name !== undefined) updateData.name = name.trim();
    if (goal !== undefined) updateData.goal = goal?.trim() || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    updateData.state = newState;

    const updated = await prisma.sprint.update({
      where: { id: params.sprintId },
      data: updateData,
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
            status: { select: { id: true, name: true, key: true, isDone: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, sprint: updated });
  } catch (error: any) {
    console.error('Sprint PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/spaces/[slug]/sprints/[sprintId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; sprintId: string } }
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId: space.id, userId: user.id },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Find the sprint and verify it belongs to a board in this space
    const sprint = await prisma.sprint.findUnique({
      where: { id: params.sprintId },
      include: {
        board: {
          select: { id: true, spaceId: true },
        },
      },
    });

    if (!sprint) {
      return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 });
    }

    if (sprint.board.spaceId !== space.id) {
      return NextResponse.json({ success: false, message: 'Sprint does not belong to this space' }, { status: 403 });
    }

    // Only allow deletion of planned/pending sprints (not active or completed)
    if (sprint.state === 'ACTIVE') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete an active sprint. Please complete the sprint before deleting it.' 
      }, { status: 400 });
    }
    
    if (sprint.state !== 'PLANNED') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only pending sprints can be deleted. Please complete or close the sprint first.' 
      }, { status: 400 });
    }

    await prisma.sprint.delete({ where: { id: params.sprintId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sprint DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete sprint', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}













