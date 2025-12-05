
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Constants ---
const PERMISSIONS = {
    // Space Management
    MANAGE_SPACE: 'manage_space',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_ROLES: 'manage_roles',
    VIEW_SPACE: 'view_space',

    // Tasks
    CREATE_TASKS: 'create_tasks',
    EDIT_TASKS: 'edit_tasks',
    DELETE_TASKS: 'delete_tasks',
    VIEW_TASKS: 'view_tasks',
    ASSIGN_TASKS: 'assign_tasks',

    // Boards
    CREATE_BOARDS: 'create_boards',
    EDIT_BOARDS: 'edit_boards',
    DELETE_BOARDS: 'delete_boards',

    // Documents
    CREATE_DOCUMENTS: 'create_documents',
    EDIT_DOCUMENTS: 'edit_documents',
    DELETE_DOCUMENTS: 'delete_documents',
    VIEW_DOCUMENTS: 'view_documents',

    // Test Management (Regress Tab)
    VIEW_REGRESS: 'view_regress',
    CREATE_TEST_CASES: 'create_test_cases',
    EDIT_TEST_CASES: 'edit_test_cases',
    DELETE_TEST_CASES: 'delete_test_cases',
    EXECUTE_TESTS: 'execute_tests',
    OVERRIDE_PRIORITY: 'override_priority',
    RUN_REGRESSION_SUITE: 'run_regression_suite',
    DELETE_TEST_RESULTS: 'delete_test_results',

    // Reports & Analytics
    VIEW_REPORTS: 'view_reports',
    CREATE_REPORTS: 'create_reports',
    EXPORT_DATA: 'export_data',

    // Integrations
    MANAGE_INTEGRATIONS: 'manage_integrations',
    VIEW_INTEGRATIONS: 'view_integrations',

    // Workflows
    CREATE_WORKFLOWS: 'create_workflows',
    EDIT_WORKFLOWS: 'edit_workflows',
    DELETE_WORKFLOWS: 'delete_workflows',

    // Sprints & Releases
    MANAGE_SPRINTS: 'manage_sprints',
    MANAGE_RELEASES: 'manage_releases',

    // Comments
    CREATE_COMMENTS: 'create_comments',
    DELETE_COMMENTS: 'delete_comments',
} as const;

const DEFAULT_ROLES = {
    ADMIN: {
        name: 'Space Admin',
        description: 'Full access to all space features and settings',
        permissions: Object.values(PERMISSIONS),
        isDefault: true,
        isSystem: true,
    },
    MEMBER: {
        name: 'Member',
        description: 'Can create and edit content, but cannot manage settings or members',
        permissions: [
            PERMISSIONS.VIEW_SPACE,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.ASSIGN_TASKS,
            PERMISSIONS.CREATE_DOCUMENTS,
            PERMISSIONS.EDIT_DOCUMENTS,
            PERMISSIONS.VIEW_DOCUMENTS,
            PERMISSIONS.VIEW_REGRESS,
            PERMISSIONS.CREATE_TEST_CASES,
            PERMISSIONS.EDIT_TEST_CASES,
            PERMISSIONS.EXECUTE_TESTS,
            PERMISSIONS.VIEW_REPORTS,
            PERMISSIONS.CREATE_COMMENTS,
            PERMISSIONS.VIEW_INTEGRATIONS,
            PERMISSIONS.MANAGE_SPRINTS,
        ],
        isDefault: true,
        isSystem: true,
    },
    VIEWER: {
        name: 'Viewer',
        description: 'Read-only access to space content',
        permissions: [
            PERMISSIONS.VIEW_SPACE,
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_DOCUMENTS,
            PERMISSIONS.VIEW_REGRESS,
            PERMISSIONS.VIEW_REPORTS,
            PERMISSIONS.VIEW_INTEGRATIONS,
        ],
        isDefault: true,
        isSystem: true,
    },
};

// --- Helper Functions ---

async function initializeDefaultRoles(spaceId: string) {
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
        console.log(`[FixScript] Initialized default roles for space ${spaceId}`);
    } catch (error) {
        console.error('[FixScript] Error initializing default roles:', error);
        throw error;
    }
}

async function getAdminRole(spaceId: string) {
    return await prisma.spaceRole.findFirst({
        where: {
            spaceId,
            name: DEFAULT_ROLES.ADMIN.name,
            isDefault: true,
        },
    });
}

async function getMemberRole(spaceId: string) {
    return await prisma.spaceRole.findFirst({
        where: {
            spaceId,
            name: DEFAULT_ROLES.MEMBER.name,
            isDefault: true,
        },
    });
}

// --- Main Script ---

async function main() {
    console.log('Starting role fix script...');

    try {
        // Get all spaces
        const spaces = await prisma.space.findMany({
            include: {
                roles: true,
                members: true
            }
        });

        console.log(`Found ${spaces.length} spaces.`);

        for (const space of spaces) {
            console.log(`Checking space: ${space.name} (${space.slug})`);

            // Check if roles exist
            if (space.roles.length === 0) {
                console.log(`  - No roles found. Initializing default roles...`);
                await initializeDefaultRoles(space.id);
                console.log(`  - Roles initialized.`);
            } else {
                console.log(`  - Roles already exist (${space.roles.length} roles).`);
            }

            // Check members for missing roleId
            const members = await prisma.spaceMember.findMany({
                where: { spaceId: space.id }
            });

            for (const member of members) {
                if (!member.roleId) {
                    console.log(`  - Member ${member.userId} has no roleId.`);

                    if (member.role === 'OWNER') {
                        console.log(`    - Member is OWNER. Assigning Admin role...`);
                        const adminRole = await getAdminRole(space.id);
                        if (adminRole) {
                            await prisma.spaceMember.update({
                                where: { id: member.id },
                                data: { roleId: adminRole.id }
                            });
                            console.log(`    - Assigned Admin role.`);
                        } else {
                            console.error(`    - Failed to find Admin role!`);
                        }
                    } else {
                        console.log(`    - Member is ${member.role}. Assigning Member role...`);
                        const memberRole = await getMemberRole(space.id);
                        if (memberRole) {
                            await prisma.spaceMember.update({
                                where: { id: member.id },
                                data: { roleId: memberRole.id }
                            });
                            console.log(`    - Assigned Member role.`);
                        }
                    }
                }
            }
        }

        console.log('Fix script completed successfully.');
    } catch (error) {
        console.error('Error running fix script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
