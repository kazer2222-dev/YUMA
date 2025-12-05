import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission-middleware';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { PermissionService } from '@/lib/services/permission-service';

/**
 * GET /api/spaces/[slug]/roles
 * List all roles in a space
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
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

        // Check permission
        const authCheck = await requirePermission(request, space.id, PERMISSIONS.VIEW_SPACE);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        const roles = await prisma.spaceRole.findMany({
            where: { spaceId: space.id },
            include: {
                _count: {
                    select: {
                        members: true,
                        permissions: true,
                    },
                },
            },
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' },
            ],
        });

        return NextResponse.json({
            success: true,
            roles,
        });
    } catch (error) {
        console.error('[API] Error fetching roles:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/spaces/[slug]/roles
 * Create a new custom role
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { name, description, copyPermissionsFromRoleId } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Role name is required' },
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

        // Check permission - must be able to manage roles
        const authCheck = await requirePermission(request, space.id, PERMISSIONS.MANAGE_ROLES);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        // Check if role name already exists
        const existingRole = await prisma.spaceRole.findFirst({
            where: {
                spaceId: space.id,
                name,
            },
        });

        if (existingRole) {
            return NextResponse.json(
                { success: false, message: 'Role name already exists' },
                { status: 400 }
            );
        }

        // Create the role
        const role = await prisma.spaceRole.create({
            data: {
                spaceId: space.id,
                name,
                description,
                isDefault: false,
                isSystem: false,
            },
        });

        // Copy permissions from another role if specified
        if (copyPermissionsFromRoleId) {
            const sourcePermissions = await prisma.spacePermission.findMany({
                where: { roleId: copyPermissionsFromRoleId },
            });

            for (const perm of sourcePermissions) {
                await prisma.spacePermission.create({
                    data: {
                        roleId: role.id,
                        permissionKey: perm.permissionKey,
                        granted: perm.granted,
                    },
                });
            }
        }

        // Log action
        await PermissionService.logAction(
            space.id,
            authCheck.user.id,
            'ROLE_CREATED',
            role.id,
            { name, description }
        );

        return NextResponse.json({
            success: true,
            role,
        });
    } catch (error) {
        console.error('[API] Error creating role:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
