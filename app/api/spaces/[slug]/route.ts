import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;

    // Check if user is admin
    const isAdmin = await AuthService.isAdmin(user.id);

    // Get space - admins can access any space, members only their spaces
    const space = await prisma.space.findFirst({
      where: isAdmin
        ? { slug }
        : {
            slug,
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
        customFields: {
          orderBy: {
            order: 'asc'
          }
        },
        settings: true,
        _count: {
          select: {
            tasks: true,
            members: true
          }
        }
      }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found or access denied' },
        { status: 404 }
      );
    }

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
        memberCount: space._count.members,
        taskCount: space._count.tasks,
        members: space.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        customFields: space.customFields,
        settings: space.settings
      }
    });
  } catch (error) {
    console.error('Error fetching space:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch space' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;
    const { name, description, timezone } = await request.json();

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

    // Update space
    const updatedSpace = await prisma.space.update({
      where: { slug },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(timezone && { timezone })
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

    return NextResponse.json({
      success: true,
      space: {
        id: updatedSpace.id,
        name: updatedSpace.name,
        description: updatedSpace.description,
        slug: updatedSpace.slug,
        timezone: updatedSpace.timezone,
        createdAt: updatedSpace.createdAt,
        updatedAt: updatedSpace.updatedAt,
        members: updatedSpace.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        settings: updatedSpace.settings
      }
    });
  } catch (error) {
    console.error('Error updating space:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update space' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const { slug } = params;

    // Check if user is admin or owner of space
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: 'OWNER'
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Only admins or space owners can delete spaces' },
        { status: 403 }
      );
    }

    // Delete space (cascade will handle related records)
    await prisma.space.delete({
      where: { slug }
    });

    return NextResponse.json({
      success: true,
      message: 'Space deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete space' },
      { status: 500 }
    );
  }
}

