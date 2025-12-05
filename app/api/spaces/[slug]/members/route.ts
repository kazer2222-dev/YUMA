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

    // Check if user is member of space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all members of the space with their group memberships
    const space = await prisma.space.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    const members = await prisma.spaceMember.findMany({
      where: {
        space: { slug }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        },
        roleRelation: true,
        adder: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    });

    // Fetch group memberships for all users in this space
    const userIds = members.map(m => m.userId);
    const groupMemberships = await prisma.spaceGroupMember.findMany({
      where: {
        userId: { in: userIds },
        group: { spaceId: space.id }
      },
      include: {
        group: {
          include: {
            role: true
          }
        }
      }
    });

    // Build a map of userId -> group roles
    const userGroupRoles: Record<string, Array<{ groupName: string; roleName: string; roleId: string }>> = {};
    for (const gm of groupMemberships) {
      if (!userGroupRoles[gm.userId]) {
        userGroupRoles[gm.userId] = [];
      }
      if (gm.group.role) {
        userGroupRoles[gm.userId].push({
          groupName: gm.group.name,
          roleName: gm.group.role.name,
          roleId: gm.group.role.id
        });
      }
    }

    return NextResponse.json({
      success: true,
      members: members.map(member => {
        // Handle role object construction
        let roleObj;
        if (member.roleRelation) {
          roleObj = {
            id: member.roleRelation.id,
            name: member.roleRelation.name,
            description: member.roleRelation.description,
            isDefault: member.roleRelation.isDefault,
            isSystem: member.roleRelation.isSystem
          };
        } else if (member.role === 'OWNER') {
          // Display Owner as Space Admin to the user
          roleObj = {
            id: 'owner', // Keep internal ID as owner for now, or map to admin ID if we can fetch it
            name: 'Space Admin', // Display name requested by user
            description: 'Full access to all space features and settings',
            isDefault: true,
            isSystem: true
          };
        } else {
          // Fallback for legacy data without roleRelation
          roleObj = {
            id: 'unknown',
            name: member.role || 'Unknown',
            description: null,
            isDefault: false,
            isSystem: false
          };
        }

        return {
          id: member.id,
          userId: member.userId,
          role: roleObj,
          groupRoles: userGroupRoles[member.userId] || [],
          addedAt: member.addedAt,
          user: member.user,
          adder: member.adder
        };
      })
    });
  } catch (error) {
    console.error('Error fetching space members:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { email, role = 'MEMBER' } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
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

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: targetUser.id
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { success: false, message: 'User is already a member' },
        { status: 400 }
      );
    }

    // Add user to space
    const newMembership = await prisma.spaceMember.create({
      data: {
        space: { connect: { slug } },
        user: { connect: { id: targetUser.id } },
        role,
        addedBy: user.id
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

    // Construct role object for response
    let roleObj;
    if (newMembership.roleRelation) {
      roleObj = {
        id: newMembership.roleRelation.id,
        name: newMembership.roleRelation.name,
        description: newMembership.roleRelation.description,
        isDefault: newMembership.roleRelation.isDefault,
        isSystem: newMembership.roleRelation.isSystem
      };
    } else if (newMembership.role === 'OWNER') {
      roleObj = {
        id: 'owner',
        name: 'Space Admin',
        description: 'Full access to all space features and settings',
        isDefault: true,
        isSystem: true
      };
    } else {
      roleObj = {
        id: 'unknown',
        name: newMembership.role || 'Unknown',
        description: null,
        isDefault: false,
        isSystem: false
      };
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newMembership.id,
        role: roleObj,
        addedAt: newMembership.addedAt,
        user: newMembership.user
      }
    });
  } catch (error) {
    console.error('Error adding space member:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add member' },
      { status: 500 }
    );
  }
}
