import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';

export async function GET(
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

        const group = await prisma.spaceGroup.findUnique({
            where: {
                id: groupId
            },
            include: {
                role: true,
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
                }
            }
        });

        if (!group) {
            return NextResponse.json(
                { success: false, message: 'Group not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            group
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch group' },
            { status: 500 }
        );
    }
}

export async function PATCH(
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
        const { name, description, roleId } = await request.json();

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

        // Get current group for audit log comparison
        const oldGroup = await prisma.spaceGroup.findUnique({
            where: { id: groupId },
            include: { role: { select: { name: true } } }
        });

        // Update group
        const group = await prisma.spaceGroup.update({
            where: { id: groupId },
            data: {
                name,
                description,
                role: roleId ? { connect: { id: roleId } } : roleId === null ? { disconnect: true } : undefined
            },
            include: {
                role: { select: { name: true } }
            }
        });

        // Audit log
        await prisma.spaceAuditLog.create({
            data: {
                spaceId: membership.spaceId,
                userId: user.id,
                action: 'GROUP_UPDATED',
                targetId: group.id,
                metadata: JSON.stringify({
                    groupName: group.name,
                    changes: {
                        name: oldGroup?.name !== name ? { from: oldGroup?.name, to: name } : undefined,
                        role: oldGroup?.role?.name !== group.role?.name ? { from: oldGroup?.role?.name || null, to: group.role?.name || null } : undefined
                    }
                })
            }
        });

        return NextResponse.json({
            success: true,
            group
        });
    } catch (error) {
        console.error('Error updating group:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update group' },
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

        // Get group info for audit log
        const group = await prisma.spaceGroup.findUnique({
            where: { id: groupId },
            select: { name: true }
        });

        // Delete group
        await prisma.spaceGroup.delete({
            where: { id: groupId }
        });

        // Audit log
        await prisma.spaceAuditLog.create({
            data: {
                spaceId: membership.spaceId,
                userId: user.id,
                action: 'GROUP_DELETED',
                targetId: groupId,
                metadata: JSON.stringify({
                    groupName: group?.name
                })
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete group' },
            { status: 500 }
        );
    }
}
