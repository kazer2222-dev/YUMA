import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission-middleware';
import { PERMISSIONS, type PermissionKey } from '@/lib/constants/permissions';
import { PermissionService } from '@/lib/services/permission-service';

/**
 * GET /api/spaces/[slug]/roles/[roleId]/permissions
 * Get all permissions for a role
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

        const permissions = await prisma.spacePermission.findMany({
            where: {
                roleId: params.roleId,
                role: {
                    spaceId: space.id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            permissions,
        });
    } catch (error) {
        console.error('[API] Error fetching permissions:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/spaces/[slug]/roles/[roleId]/permissions
 * Update all permissions for a role (bulk update)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { slug: string; roleId: string } }
) {
    try {
        const body = await request.json();
        const { permissions } = body;

        if (!Array.isArray(permissions)) {
            return NextResponse.json(
                { success: false, message: 'permissions array is required' },
                { status: 400 }
            );
        }

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

        // Verify role exists and belongs to this space
        const role = await prisma.spaceRole.findFirst({
            where: {
                id: params.roleId,
                spaceId: space.id,
            },
        });

        if (!role) {
            return NextResponse.json(
                { success: false, message: 'Role not found' },
                { status: 404 }
            );
        }

        // Delete existing permissions
        await prisma.spacePermission.deleteMany({
            where: { roleId: params.roleId },
        });

        // Create new permissions
        const newPermissions = await Promise.all(
            permissions.map((perm: { permissionKey: PermissionKey; granted: boolean }) =>
                prisma.spacePermission.create({
                    data: {
                        roleId: params.roleId,
                        permissionKey: perm.permissionKey,
                        granted: perm.granted,
                    },
                })
            )
        );

        // Log action
        await PermissionService.logAction(
            space.id,
            authCheck.user.id,
            'PERMISSIONS_UPDATED',
            params.roleId,
            { roleName: role.name, permissionCount: newPermissions.length }
        );

        return NextResponse.json({
            success: true,
            permissions: newPermissions,
        });
    } catch (error) {
        console.error('[API] Error updating permissions:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
