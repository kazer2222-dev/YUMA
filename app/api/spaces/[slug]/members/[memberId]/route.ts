import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';

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
    const { roleId } = await request.json();

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Check if user has admin/owner role in space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      include: {
        roleRelation: true
      }
    });

    // Also check if user has MANAGE_MEMBERS permission via role
    const hasPermission = await PermissionService.hasPermission(user.id, membership?.spaceId || '', 'manage_members');
    const isOwner = membership?.role === 'OWNER';

    if (!membership || (!isOwner && !hasPermission)) {
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
      },
      include: {
        roleRelation: true
      }
    });

    if (!targetMember) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent non-owners from changing owner roles
    if (!isOwner && targetMember.role === 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'Only owners can modify owner roles' },
        { status: 403 }
      );
    }

    // Verify the new role exists in this space
    const newRole = await prisma.spaceRole.findFirst({
      where: {
        id: roleId,
        space: { slug }
      }
    });

    if (!newRole) {
      return NextResponse.json(
        { success: false, message: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if we are removing the last admin
    const adminRole = await PermissionService.getAdminRole(membership.spaceId);
    const isTargetAdmin = targetMember.role === 'OWNER' || (adminRole && targetMember.roleId === adminRole.id);
    const isNewRoleAdmin = adminRole && newRole.id === adminRole.id;

    if (isTargetAdmin && !isNewRoleAdmin) {
      // Count total admins
      const adminCount = await prisma.spaceMember.count({
        where: {
          spaceId: membership.spaceId,
          OR: [
            { role: 'OWNER' },
            { roleId: adminRole?.id }
          ]
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot remove the last admin from the space' },
          { status: 400 }
        );
      }
    }

    // Update member role
    const updatedMember = await prisma.spaceMember.update({
      where: { id: memberId },
      data: {
        roleId: roleId,
        role: targetMember.role === 'OWNER' ? 'MEMBER' : targetMember.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        roleRelation: true
      }
    });

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        role: updatedMember.roleRelation ? {
          id: updatedMember.roleRelation.id,
          name: updatedMember.roleRelation.name,
          description: updatedMember.roleRelation.description,
          isDefault: updatedMember.roleRelation.isDefault,
          isSystem: updatedMember.roleRelation.isSystem
        } : {
          id: 'unknown',
          name: updatedMember.role,
          isDefault: false,
          isSystem: false
        },
        addedAt: updatedMember.addedAt,
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

    const hasPermission = await PermissionService.hasPermission(user.id, membership?.spaceId || '', 'manage_members');
    const isOwner = membership?.role === 'OWNER';

    if (!membership || (!isOwner && !hasPermission)) {
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

    // Check if we are removing the last admin
    const adminRole = await PermissionService.getAdminRole(membership.spaceId);
    const isTargetAdmin = targetMember.role === 'OWNER' || (adminRole && targetMember.roleId === adminRole.id);

    if (isTargetAdmin) {
      const adminCount = await prisma.spaceMember.count({
        where: {
          spaceId: membership.spaceId,
          OR: [
            { role: 'OWNER' },
            { roleId: adminRole?.id }
          ]
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: 'Cannot remove the last admin from the space' },
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
