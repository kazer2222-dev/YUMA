import { prisma } from '@/lib/prisma';

export type TemplatePermission = 'CREATE' | 'EDIT' | 'VIEW';

export interface TemplateAccessCheck {
    hasAccess: boolean;
    reason?: string;
}

/**
 * Service for checking and enforcing template-level access controls
 */
export class TemplateAccessService {
    /**
     * Check if a user has a specific permission on a template
     * @param templateId - The template ID
     * @param userId - The user ID to check
     * @param permission - The permission to check ('CREATE', 'EDIT', 'VIEW')
     * @param context - Additional context like task assignee ID
     * @returns Access check result
     */
    static async checkTemplateAccess(
        templateId: string,
        userId: string,
        permission: TemplatePermission,
        context?: {
            taskCreatorId?: string;
            taskAssigneeId?: string;
        }
    ): Promise<TemplateAccessCheck> {
        try {
            // Fetch template with access rules
            const template = await (prisma as any).template.findUnique({
                where: { id: templateId },
                include: {
                    accessRules: true,
                    space: {
                        select: { id: true },
                    },
                },
            });

            if (!template) {
                return { hasAccess: false, reason: 'Template not found' };
            }

            // If access is not restricted, allow all space members
            if (!template.restrictAccess) {
                return { hasAccess: true };
            }

            // Get user's space membership with role
            const membership = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId: template.space.id,
                        userId,
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

            if (!membership) {
                return { hasAccess: false, reason: 'Not a member of this space' };
            }

            // Get user's group memberships
            const groupMemberships = await prisma.spaceGroupMember.findMany({
                where: {
                    userId,
                    group: {
                        spaceId: template.space.id,
                    },
                },
                select: {
                    groupId: true,
                },
            });

            const userGroupIds = groupMemberships.map(gm => gm.groupId);

            // Check access rules for this permission
            const relevantRules = template.accessRules.filter(
                (rule: any) => rule.permission === permission
            );

            if (relevantRules.length === 0) {
                // No rules defined for this permission - use default behavior
                // Default: VIEW allowed for all, CREATE/EDIT for admins
                if (permission === 'VIEW') {
                    return { hasAccess: true };
                }

                const isAdmin = membership.role?.name === 'Admin' || membership.role?.name === 'Owner';
                if (isAdmin) {
                    return { hasAccess: true };
                }

                return { hasAccess: false, reason: 'No permission rules defined' };
            }

            // Check each rule
            for (const rule of relevantRules) {
                // Direct user match
                if (rule.entityType === 'USER' && rule.entityId === userId) {
                    return { hasAccess: true };
                }

                // Role match
                if (rule.entityType === 'ROLE' && rule.entityId === membership.roleId) {
                    return { hasAccess: true };
                }

                // Group match
                if (rule.entityType === 'GROUP' && userGroupIds.includes(rule.entityId)) {
                    return { hasAccess: true };
                }

                // Special entities
                if (rule.entityType === 'SPECIAL') {
                    switch (rule.entityId) {
                        case 'ALL_MEMBERS':
                            return { hasAccess: true };

                        case 'SPACE_ADMINS':
                            const isSpaceAdmin = membership.role?.name === 'Admin' || membership.role?.name === 'Owner';
                            if (isSpaceAdmin) {
                                return { hasAccess: true };
                            }
                            break;

                        case 'CREATOR':
                            if (context?.taskCreatorId === userId) {
                                return { hasAccess: true };
                            }
                            break;

                        case 'ASSIGNEE':
                            if (context?.taskAssigneeId === userId) {
                                return { hasAccess: true };
                            }
                            break;
                    }
                }
            }

            return { hasAccess: false, reason: 'Access denied by template rules' };
        } catch (error) {
            console.error('Error checking template access:', error);
            // Fallback to space-level permissions on error
            return { hasAccess: true, reason: 'Fallback to space permissions due to error' };
        }
    }

    /**
     * Check if a user can create a task from a template
     */
    static async canCreateTaskFromTemplate(
        templateId: string,
        userId: string
    ): Promise<TemplateAccessCheck> {
        return this.checkTemplateAccess(templateId, userId, 'CREATE');
    }

    /**
     * Check if a user can edit a task created from a template
     */
    static async canEditTemplateTask(
        templateId: string,
        userId: string,
        taskCreatorId?: string,
        taskAssigneeId?: string
    ): Promise<TemplateAccessCheck> {
        return this.checkTemplateAccess(templateId, userId, 'EDIT', {
            taskCreatorId,
            taskAssigneeId,
        });
    }

    /**
     * Check if a user can view a task created from a template
     */
    static async canViewTemplateTask(
        templateId: string,
        userId: string,
        taskCreatorId?: string,
        taskAssigneeId?: string
    ): Promise<TemplateAccessCheck> {
        return this.checkTemplateAccess(templateId, userId, 'VIEW', {
            taskCreatorId,
            taskAssigneeId,
        });
    }

    /**
     * Get default access rules for a new restricted template
     * Ensures the creator and admins always have access
     */
    static getDefaultAccessRules(creatorId: string): Array<{
        permission: TemplatePermission;
        entityType: string;
        entityId: string | null;
    }> {
        const permissions: TemplatePermission[] = ['CREATE', 'EDIT', 'VIEW'];
        const rules: Array<{
            permission: TemplatePermission;
            entityType: string;
            entityId: string | null;
        }> = [];

        for (const permission of permissions) {
            // Always grant access to space admins
            rules.push({
                permission,
                entityType: 'SPECIAL',
                entityId: 'SPACE_ADMINS',
            });

            // Grant full access to the template creator
            rules.push({
                permission,
                entityType: 'USER',
                entityId: creatorId,
            });
        }

        // VIEW permission for all members by default
        rules.push({
            permission: 'VIEW',
            entityType: 'SPECIAL',
            entityId: 'ALL_MEMBERS',
        });

        return rules;
    }

    /**
     * Resolve all users that have a specific permission on a template
     * Useful for notifications and UI display
     */
    static async resolvePermittedUsers(
        templateId: string,
        permission: TemplatePermission
    ): Promise<string[]> {
        try {
            const template = await (prisma as any).template.findUnique({
                where: { id: templateId },
                include: {
                    accessRules: true,
                    space: {
                        select: { id: true },
                    },
                },
            });

            if (!template || !template.restrictAccess) {
                // Return all space members
                const members = await prisma.spaceMember.findMany({
                    where: { spaceId: template?.space?.id },
                    select: { userId: true },
                });
                return members.map(m => m.userId);
            }

            const relevantRules = template.accessRules.filter(
                (rule: any) => rule.permission === permission
            );

            const userIds = new Set<string>();

            for (const rule of relevantRules) {
                if (rule.entityType === 'USER' && rule.entityId) {
                    userIds.add(rule.entityId);
                } else if (rule.entityType === 'ROLE' && rule.entityId) {
                    const roleMembers = await prisma.spaceMember.findMany({
                        where: { roleId: rule.entityId },
                        select: { userId: true },
                    });
                    roleMembers.forEach(m => userIds.add(m.userId));
                } else if (rule.entityType === 'GROUP' && rule.entityId) {
                    const groupMembers = await prisma.spaceGroupMember.findMany({
                        where: { groupId: rule.entityId },
                        select: { userId: true },
                    });
                    groupMembers.forEach(m => userIds.add(m.userId));
                } else if (rule.entityType === 'SPECIAL') {
                    if (rule.entityId === 'ALL_MEMBERS') {
                        const allMembers = await prisma.spaceMember.findMany({
                            where: { spaceId: template.space.id },
                            select: { userId: true },
                        });
                        allMembers.forEach(m => userIds.add(m.userId));
                    } else if (rule.entityId === 'SPACE_ADMINS') {
                        const adminRoles = await prisma.spaceRole.findMany({
                            where: {
                                spaceId: template.space.id,
                                name: { in: ['Admin', 'Owner'] },
                            },
                            include: {
                                members: { select: { userId: true } },
                            },
                        });
                        adminRoles.forEach(r => r.members.forEach((m: any) => userIds.add(m.userId)));
                    }
                }
            }

            return Array.from(userIds);
        } catch (error) {
            console.error('Error resolving permitted users:', error);
            return [];
        }
    }
}
