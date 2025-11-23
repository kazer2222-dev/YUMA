import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// PATCH /api/boards/[boardId]/releases/[releaseId] - Update release status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; releaseId: string }> | { boardId: string; releaseId: string } }
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
    const { boardId, releaseId } = resolvedParams;

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
    const { name, version, releaseDate, description, status } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (version !== undefined) updateData.version = version.trim();
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate ? new Date(releaseDate) : null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;

    const release = await prisma.release.update({
      where: { id: releaseId, boardId },
      data: updateData,
      include: {
        sprints: {
          include: {
            sprint: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, release });
  } catch (error: any) {
    console.error('Release PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update release', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId]/releases/[releaseId] - Delete release
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; releaseId: string }> | { boardId: string; releaseId: string } }
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
    const { boardId, releaseId } = resolvedParams;

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

    // Get release to find version before deleting
    const release = await prisma.release.findUnique({
      where: { id: releaseId, boardId },
    });

    if (!release) {
      return NextResponse.json({ success: false, message: 'Release not found' }, { status: 404 });
    }

    // Remove release version from all tasks before deleting
    await prisma.task.updateMany({
      where: {
        spaceId: board.spaceId,
        releaseVersion: release.version,
      },
      data: {
        releaseVersion: null,
      },
    });

    // Delete the release (cascade will handle ReleaseSprint)
    await prisma.release.delete({
      where: { id: releaseId, boardId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Release DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete release', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}




