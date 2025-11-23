import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; memberId: string } }
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

    const { slug, memberId } = params;
    const { role } = await request.json();

    if (!role || !['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user has admin/owner role in space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the target member
    const targetMember = await prisma.spaceMember.findFirst({
      where: {
        id: memberId,
        space: { slug }
      }
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent non-owners from changing owner roles
    if (membership.role !== 'OWNER' && targetMember.role === 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'Only owners can modify owner roles' },
        { status: 403 }
      );
    }

    // Update member role
    const updatedMember = await prisma.spaceMember.update({
      where: { id: memberId },
      data: { role },
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
    });

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt,
        user: updatedMember.user
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; memberId: string } }
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

    const { slug, memberId } = params;

    // Check if user has admin/owner role in space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the target member
    const targetMember = await prisma.spaceMember.findFirst({
      where: {
        id: memberId,
        space: { slug }
      }
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing the last owner
    if (targetMember.role === 'OWNER') {
      const ownerCount = await prisma.spaceMember.count({
        where: {
          space: { slug },
          role: 'OWNER'
        }
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot remove the last owner' },
          { status: 400 }
        );
      }
    }

    // Remove member
    await prisma.spaceMember.delete({
      where: { id: memberId }
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove member' },
      { status: 500 }
    );
  }
}


