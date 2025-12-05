import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission-middleware';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { PermissionService } from '@/lib/services/permission-service';

/**
 * GET /api/spaces/[slug]/roles/[roleId]
 * Get role details with permissions
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string; roleId: string } }
) {
    try {
        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        const authCheck = await requirePermission(request, space.id, PERMISSIONS.VIEW_SPACE);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        const role = await prisma.spaceRole.findFirst({
            where: {
                id: params.roleId,
                spaceId: space.id,
            },
            include: {
                permissions: true,
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!role) {
            return NextResponse.json(
                { success: false, message: 'Role not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            role,
        });
    } catch (error) {
        console.error('[API] Error fetching role:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/spaces/[slug]/roles/[roleId]
 * Update role name and description
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { slug: string; roleId: string } }
) {
    try {
        const body = await request.json();
        const { name, description } = body;

        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        const authCheck = await requirePermission(request, space.id, PERMISSIONS.MANAGE_ROLES);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        // Get existing role
        const existingRole = await prisma.spaceRole.findFirst({
            where: {
                id: params.roleId,
                spaceId: space.id,
            },
        });

        if (!existingRole) {
            return NextResponse.json(
                { success: false, message: 'Role not found' },
                { status: 404 }
            );
        }

        // Check if name already exists (if changing name)
        if (name && name !== existingRole.name) {
            const duplicate = await prisma.spaceRole.findFirst({
                where: {
                    spaceId: space.id,
                    name,
                    id: { not: params.roleId },
                },
            });

            if (duplicate) {
                return NextResponse.json(
                    { success: false, message: 'Role name already exists' },
                    { status: 400 }
                );
            }
        }

        // Update role
        const updatedRole = await prisma.spaceRole.update({
            where: { id: params.roleId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
            },
        });

        // Log action
        await PermissionService.logAction(
            space.id,
            authCheck.user.id,
            'ROLE_UPDATED',
            updatedRole.id,
            { name, description }
        );

        return NextResponse.json({
            success: true,
            role: updatedRole,
        });
    } catch (error) {
        console.error('[API] Error updating role:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/spaces/[slug]/roles/[roleId]
 * Delete a custom role
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { slug: string; roleId: string } }
) {
    try {
        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        const authCheck = await requirePermission(request, space.id, PERMISSIONS.MANAGE_ROLES);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        const role = await prisma.spaceRole.findFirst({
            where: {
                id: params.roleId,
                spaceId: space.id,
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!role) {
            return NextResponse.json(
                { success: false, message: 'Role not found' },
                { status: 404 }
            );
        }

        // Cannot delete system roles
        if (role.isSystem) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete system role' },
                { status: 400 }
            );
        }

        // Check if role has members
        if (role._count.members > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Cannot delete role with ${role._count.members} member(s). Reassign members first.`,
                },
                { status: 400 }
            );
        }

        // Delete role (permissions will cascade delete)
        await prisma.spaceRole.delete({
            where: { id: params.roleId },
        });

        // Log action
        await PermissionService.logAction(
            space.id,
            authCheck.user.id,
            'ROLE_DELETED',
            params.roleId,
            { name: role.name }
        );

        return NextResponse.json({
            success: true,
            message: 'Role deleted successfully',
        });
    } catch (error) {
        console.error('[API] Error deleting role:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
