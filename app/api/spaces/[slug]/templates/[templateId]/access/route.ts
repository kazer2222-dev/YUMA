import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET - Fetch access rules for a template
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string; templateId: string } }
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

        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        // Check if user is member or admin
        const member = await prisma.spaceMember.findUnique({
            where: {
                spaceId_userId: {
                    spaceId: space.id,
                    userId: user.id,
                },
            },
            include: {
                role: true,
            },
        });

        const isAdmin = await AuthService.isAdmin(user.id);

        if (!member && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Not a member of this space' },
                { status: 403 }
            );
        }

        // Fetch template with access rules
        const template = await (prisma as any).template.findFirst({
            where: {
                id: params.templateId,
                spaceId: space.id,
            },
            include: {
                accessRules: true,
            },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, message: 'Template not found' },
                { status: 404 }
            );
        }

        // Enrich access rules with entity details
        const enrichedRules = await Promise.all(
            (template.accessRules || []).map(async (rule: any) => {
                let entityName = '';
                let entityEmail = '';
                let entityColor = '';

                if (rule.entityType === 'USER' && rule.entityId) {
                    const user = await prisma.user.findUnique({
                        where: { id: rule.entityId },
                        select: { id: true, name: true, email: true },
                    });
                    if (user) {
                        entityName = user.name || user.email;
                        entityEmail = user.email;
                    }
                } else if (rule.entityType === 'ROLE' && rule.entityId) {
                    const role = await prisma.spaceRole.findUnique({
                        where: { id: rule.entityId },
                        select: { id: true, name: true },
                    });
                    if (role) {
                        entityName = role.name;
                    }
                } else if (rule.entityType === 'GROUP' && rule.entityId) {
                    const group = await prisma.spaceGroup.findUnique({
                        where: { id: rule.entityId },
                        select: { id: true, name: true },
                    });
                    if (group) {
                        entityName = group.name;
                    }
                } else if (rule.entityType === 'SPECIAL') {
                    // Special entities like ALL_MEMBERS, CREATOR, etc.
                    const specialNames: Record<string, string> = {
                        ALL_MEMBERS: 'All Space Members',
                        CREATOR: 'Task Creator',
                        ASSIGNEE: 'Task Assignee',
                        SPACE_ADMINS: 'Space Administrators',
                    };
                    entityName = specialNames[rule.entityId] || rule.entityId;
                }

                return {
                    id: rule.id,
                    permission: rule.permission,
                    entityType: rule.entityType,
                    entityId: rule.entityId,
                    entityName,
                    entityEmail,
                    entityColor,
                };
            })
        );

        return NextResponse.json({
            success: true,
            restrictAccess: template.restrictAccess || false,
            accessRules: enrichedRules,
        });
    } catch (error: any) {
        console.error('Error fetching template access rules:', error);
        return NextResponse.json(
            { success: false, message: `Failed to fetch access rules: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}

// PUT - Update access rules for a template (bulk replace)
export async function PUT(
    request: NextRequest,
    { params }: { params: { slug: string; templateId: string } }
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

        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        // Check if user is admin of this space
        const member = await prisma.spaceMember.findUnique({
            where: {
                spaceId_userId: {
                    spaceId: space.id,
                    userId: user.id,
                },
            },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });

        const isAdmin = await AuthService.isAdmin(user.id);
        const isSpaceAdmin = member?.role?.permissions?.some(
            (p: any) => p.permissionKey === 'MANAGE_TEMPLATES' && p.granted
        ) || member?.role?.name === 'Admin' || member?.role?.name === 'Owner';

        if (!isAdmin && !isSpaceAdmin) {
            return NextResponse.json(
                { success: false, message: 'Only space administrators can modify template access' },
                { status: 403 }
            );
        }

        // Verify template exists in this space
        const template = await (prisma as any).template.findFirst({
            where: {
                id: params.templateId,
                spaceId: space.id,
            },
        });

        if (!template) {
            return NextResponse.json(
                { success: false, message: 'Template not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { restrictAccess, accessRules } = body;

        // Validate accessRules structure
        if (restrictAccess && (!Array.isArray(accessRules) || accessRules.length === 0)) {
            return NextResponse.json(
                { success: false, message: 'Access rules are required when restricting access' },
                { status: 400 }
            );
        }

        // Validate that creator always has full access (prevent self-locking)
        if (restrictAccess) {
            const permissions = ['CREATE', 'EDIT', 'VIEW'];
            for (const permission of permissions) {
                const hasCreatorAccess = accessRules.some(
                    (rule: any) =>
                        rule.permission === permission &&
                        (rule.entityType === 'SPECIAL' && rule.entityId === 'CREATOR')
                );
                const hasCurrentUserAccess = accessRules.some(
                    (rule: any) =>
                        rule.permission === permission &&
                        rule.entityType === 'USER' &&
                        rule.entityId === user.id
                );
                const hasAdminAccess = accessRules.some(
                    (rule: any) =>
                        rule.permission === permission &&
                        rule.entityType === 'SPECIAL' &&
                        rule.entityId === 'SPACE_ADMINS'
                );

                if (!hasCreatorAccess && !hasCurrentUserAccess && !hasAdminAccess) {
                    // Auto-add SPACE_ADMINS if no admin access is defined
                    accessRules.push({
                        permission,
                        entityType: 'SPECIAL',
                        entityId: 'SPACE_ADMINS',
                    });
                }
            }
        }

        // Transaction: Update template and replace access rules
        await prisma.$transaction(async (tx: any) => {
            // Update template restrictAccess flag
            await tx.template.update({
                where: { id: params.templateId },
                data: { restrictAccess: !!restrictAccess },
            });

            // Delete existing access rules
            await tx.templateAccessRule.deleteMany({
                where: { templateId: params.templateId },
            });

            // Create new access rules if restricting access
            if (restrictAccess && accessRules.length > 0) {
                await tx.templateAccessRule.createMany({
                    data: accessRules.map((rule: any) => ({
                        templateId: params.templateId,
                        permission: rule.permission,
                        entityType: rule.entityType,
                        entityId: rule.entityId || null,
                    })),
                });
            }

            // Create audit log entry
            await tx.spaceAuditLog.create({
                data: {
                    spaceId: space.id,
                    userId: user.id,
                    action: 'TEMPLATE_ACCESS_UPDATED',
                    targetId: params.templateId,
                    metadata: JSON.stringify({
                        templateTitle: template.title,
                        restrictAccess,
                        ruleCount: accessRules?.length || 0,
                    }),
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: restrictAccess
                ? 'Template access rules updated successfully'
                : 'Template access restrictions removed',
        });
    } catch (error: any) {
        console.error('Error updating template access rules:', error);
        return NextResponse.json(
            { success: false, message: `Failed to update access rules: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
