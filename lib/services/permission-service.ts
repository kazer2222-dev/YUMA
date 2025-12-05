import { prisma } from '@/lib/prisma';
import { DEFAULT_ROLES, type PermissionKey, type RoleConfig } from '@/lib/constants/permissions';

export class PermissionService {
    /**
     * Check if a user has a specific permission in a space
     */
    static async hasPermission(
        userId: string,
        spaceId: string,
        permission: PermissionKey
    ): Promise<boolean> {
        try {
            // Get user's role in the space
            const member = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId,
                        userId,
                    },
                },
                include: {
                    roleRelation: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });

            if (!member) {
                return false;
            }

            // Owner has all permissions
            if (member.role === 'OWNER') {
                return true;
            }

            // Check direct role permission first
            if (member.roleRelation) {
                const hasDirectPermission = member.roleRelation.permissions.some(
                    (p) => p.permissionKey === permission && p.granted
                );
                if (hasDirectPermission) {
                    return true;
                }
            }

            // Check group permissions (surplus logic - if ANY group grants it, user has it)
            const groupMemberships = await prisma.spaceGroupMember.findMany({
                where: {
                    userId,
                    group: {
                        spaceId,
                    },
                },
                include: {
                    group: {
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            });

            for (const gm of groupMemberships) {
                if (gm.group.role) {
                    const hasGroupPermission = gm.group.role.permissions.some(
                        (p) => p.permissionKey === permission && p.granted
                    );
                    if (hasGroupPermission) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('[PermissionService] Error checking permission:', error);
            return false;
        }
    }

    /**
     * Check if a user has ANY of the specified permissions
     */
    static async hasAnyPermission(
        userId: string,
        spaceId: string,
        permissions: PermissionKey[]
    ): Promise<boolean> {
        for (const permission of permissions) {
            if (await this.hasPermission(userId, spaceId, permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a user has ALL of the specified permissions
     */
    static async hasAllPermissions(
        userId: string,
        spaceId: string,
        permissions: PermissionKey[]
    ): Promise<boolean> {
        for (const permission of permissions) {
            if (!(await this.hasPermission(userId, spaceId, permission))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get user's role in a space
     */
    static async getUserRole(userId: string, spaceId: string) {
        try {
            const member = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId,
                        userId,
                    },
                },
                include: {
                    roleRelation: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });

            return member?.roleRelation || null;
        } catch (error) {
            console.error('[PermissionService] Error getting user role:', error);
            return null;
        }
    }

    /**
     * Get all permissions for a user in a space
     */
    static async getUserPermissions(
        userId: string,
        spaceId: string
    ): Promise<PermissionKey[]> {
        try {
            const permissionSet = new Set<PermissionKey>();

            const member = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId,
                        userId,
                    },
                },
                include: {
                    roleRelation: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });

            if (!member) {
                return [];
            }

            // Owner has all permissions
            if (member.role === 'OWNER') {
                const adminRole = await this.getAdminRole(spaceId);
                if (adminRole) {
                    const permissions = await prisma.spacePermission.findMany({
                        where: { roleId: adminRole.id }
                    });
                    return permissions.map((p: any) => p.permissionKey as PermissionKey);
                }
            }

            // Add direct role permissions
            if (member.roleRelation) {
                member.roleRelation.permissions
                    .filter((p) => p.granted)
                    .forEach((p) => permissionSet.add(p.permissionKey as PermissionKey));
            }

            // Add group permissions (surplus logic - merge all)
            const groupMemberships = await prisma.spaceGroupMember.findMany({
                where: {
                    userId,
                    group: {
                        spaceId,
                    },
                },
                include: {
                    group: {
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            });

            for (const gm of groupMemberships) {
                if (gm.group.role) {
                    gm.group.role.permissions
                        .filter((p: any) => p.granted)
                        .forEach((p: any) => permissionSet.add(p.permissionKey as PermissionKey));
                }
            }

            return Array.from(permissionSet);
        } catch (error) {
            console.error('[PermissionService] Error getting user permissions:', error);
            return [];
        }
    }

    /**
     * Initialize default roles and permissions for a space
     * This should be called when a space is created
     */
    static async initializeDefaultRoles(spaceId: string): Promise<void> {
        try {
            for (const [roleKey, config] of Object.entries(DEFAULT_ROLES)) {
                // Create the role
                const role = await prisma.spaceRole.create({
                    data: {
                        spaceId,
                        name: config.name,
                        description: config.description,
                        isDefault: config.isDefault,
                        isSystem: config.isSystem,
                    },
                });

                // Create permissions for the role
                for (const permission of config.permissions) {
                    await prisma.spacePermission.create({
                        data: {
                            roleId: role.id,
                            permissionKey: permission,
                            granted: true,
                        },
                    });
                }
            }

            console.log(`[PermissionService] Initialized default roles for space ${spaceId}`);
        } catch (error) {
            console.error('[PermissionService] Error initializing default roles:', error);
            throw error;
        }
    }

    /**
     * Get the default admin role for a space
     */
    static async getAdminRole(spaceId: string) {
        return await prisma.spaceRole.findFirst({
            where: {
                spaceId,
                name: DEFAULT_ROLES.ADMIN.name,
                isDefault: true,
            },
        });
    }

    /**
     * Get the default member role for a space
     */
    static async getMemberRole(spaceId: string) {
        return await prisma.spaceRole.findFirst({
            where: {
                spaceId,
                name: DEFAULT_ROLES.MEMBER.name,
                isDefault: true,
            },
        });
    }

    /**
     * Get the default viewer role for a space
     */
    static async getViewerRole(spaceId: string) {
        return await prisma.spaceRole.findFirst({
            where: {
                spaceId,
                name: DEFAULT_ROLES.VIEWER.name,
                isDefault: true,
            },
        });
    }

    /**
     * Check if a user is a space admin
     */
    static async isSpaceAdmin(userId: string, spaceId: string): Promise<boolean> {
        try {
            const member = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId,
                        userId,
                    },
                },
                include: {
                    roleRelation: true,
                },
            });

            if (!member) return false;

            if (member.role === 'OWNER') return true;

            return member.roleRelation?.name === DEFAULT_ROLES.ADMIN.name;
        } catch (error) {
            console.error('[PermissionService] Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Audit log a permission-related action
     */
    static async logAction(
        spaceId: string,
        userId: string,
        action: string,
        targetId?: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            await prisma.spaceAuditLog.create({
                data: {
                    spaceId,
                    userId,
                    action,
                    targetId,
                    metadata: metadata ? JSON.stringify(metadata) : undefined,
                },
            });
        } catch (error) {
            console.error('[PermissionService] Error logging action:', error);
            // Don't throw - audit log failure shouldn't break functionality
        }
    }
}
