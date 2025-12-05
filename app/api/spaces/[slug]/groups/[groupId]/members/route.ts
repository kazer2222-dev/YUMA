import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';

export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string; groupId: string } }
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

        const { slug, groupId } = params;
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check permissions
        const membership = await prisma.spaceMember.findFirst({
            where: {
                space: { slug },
                userId: user.id
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

        // Check if user is already in group
        const existingMember = await prisma.spaceGroupMember.findFirst({
            where: {
                groupId,
                userId
            }
        });

        if (existingMember) {
            return NextResponse.json(
                { success: false, message: 'User is already in this group' },
                { status: 400 }
            );
        }

        // Get group info for audit log
        const group = await prisma.spaceGroup.findUnique({
            where: { id: groupId },
            select: { name: true }
        });

        // Add member to group
        const groupMember = await prisma.spaceGroupMember.create({
            data: {
                group: { connect: { id: groupId } },
                user: { connect: { id: userId } },
                adder: { connect: { id: user.id } }
            },
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

        // Audit log
        await prisma.spaceAuditLog.create({
            data: {
                spaceId: membership.spaceId,
                userId: user.id,
                action: 'GROUP_MEMBER_ADDED',
                targetId: groupId,
                metadata: JSON.stringify({
                    groupName: group?.name,
                    memberName: groupMember.user.name || groupMember.user.email,
                    memberEmail: groupMember.user.email
                })
            }
        });

        return NextResponse.json({
            success: true,
            member: groupMember
        });
    } catch (error) {
        console.error('Error adding group member:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to add group member' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { slug: string; groupId: string } }
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

        const { slug, groupId } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check permissions
        const membership = await prisma.spaceMember.findFirst({
            where: {
                space: { slug },
                userId: user.id
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

        // Get group and member info for audit log
        const [group, memberToRemove] = await Promise.all([
            prisma.spaceGroup.findUnique({
                where: { id: groupId },
                select: { name: true }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true }
            })
        ]);

        // Remove member from group
        await prisma.spaceGroupMember.deleteMany({
            where: {
                groupId,
                userId
            }
        });

        // Audit log
        await prisma.spaceAuditLog.create({
            data: {
                spaceId: membership.spaceId,
                userId: user.id,
                action: 'GROUP_MEMBER_REMOVED',
                targetId: groupId,
                metadata: JSON.stringify({
                    groupName: group?.name,
                    memberName: memberToRemove?.name || memberToRemove?.email,
                    memberEmail: memberToRemove?.email
                })
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Member removed from group'
        });
    } catch (error) {
        console.error('Error removing group member:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to remove group member' },
            { status: 500 }
        );
    }
}
