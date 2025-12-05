import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permission constants (subset for initial migration)
const PERMISSIONS = {
    // Space Management
    MANAGE_SPACE: 'manage_space',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_ROLES: 'manage_roles',

    // Content  
    CREATE_TASKS: 'create_tasks',
    EDIT_TASKS: 'edit_tasks',
    DELETE_TASKS: 'delete_tasks',
    VIEW_SPACE: 'view_space',

    // Regress Tab
    VIEW_REGRESS: 'view_regress',
    CREATE_TEST_CASES: 'create_test_cases',
    EDIT_TEST_CASES: 'edit_test_cases',
    EXECUTE_TESTS: 'execute_tests',
    OVERRIDE_PRIORITY: 'override_priority',
    RUN_REGRESSION_SUITE: 'run_regression_suite',
    DELETE_TEST_RESULTS: 'delete_test_results',

    // Analytics
    VIEW_REPORTS: 'view_reports',
    EXPORT_DATA: 'export_data',
};

const DEFAULT_ROLE_CONFIGS = {
    ADMIN: {
        name: 'Space Admin',
        description: 'Full access to all space features and settings',
        permissions: Object.values(PERMISSIONS),
    },
    MEMBER: {
        name: 'Member',
        description: 'Can create and edit content, but cannot manage settings',
        permissions: [
            PERMISSIONS.VIEW_SPACE,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.VIEW_REGRESS,
            PERMISSIONS.CREATE_TEST_CASES,
            PERMISSIONS.EDIT_TEST_CASES,
            PERMISSIONS.EXECUTE_TESTS,
            PERMISSIONS.VIEW_REPORTS,
        ],
    },
    VIEWER: {
        name: 'Viewer',
        description: 'Read-only access to space content',
        permissions: [
            PERMISSIONS.VIEW_SPACE,
            PERMISSIONS.VIEW_REGRESS,
            PERMISSIONS.VIEW_REPORTS,
        ],
    },
};

async function migrateSpaceMembers() {
    console.log('Starting space user management migration...');

    // Get all spaces
    const spaces = await prisma.space.findMany({
        include: { members: true },
    });

    console.log(`Found ${spaces.length} spaces to migrate`);

    for (const space of spaces) {
        console.log(`\nMigrating space: ${space.name} (${space.id})`);

        // Create default roles for this space
        const adminRole = await prisma.spaceRole.create({
            data: {
                spaceId: space.id,
                name: DEFAULT_ROLE_CONFIGS.ADMIN.name,
                description: DEFAULT_ROLE_CONFIGS.ADMIN.description,
                isDefault: true,
                isSystem: true,
            },
        });

        const memberRole = await prisma.spaceRole.create({
            data: {
                spaceId: space.id,
                name: DEFAULT_ROLE_CONFIGS.MEMBER.name,
                description: DEFAULT_ROLE_CONFIGS.MEMBER.description,
                isDefault: true,
                isSystem: true,
            },
        });

        const viewerRole = await prisma.spaceRole.create({
            data: {
                spaceId: space.id,
                name: DEFAULT_ROLE_CONFIGS.VIEWER.name,
                description: DEFAULT_ROLE_CONFIGS.VIEWER.description,
                isDefault: true,
                isSystem: true,
            },
        });

        console.log(`  Created 3 default roles`);

        // Create permissions for each role
        for (const permission of DEFAULT_ROLE_CONFIGS.ADMIN.permissions) {
            await prisma.spacePermission.create({
                data: {
                    roleId: adminRole.id,
                    permissionKey: permission,
                    granted: true,
                },
            });
        }

        for (const permission of DEFAULT_ROLE_CONFIGS.MEMBER.permissions) {
            await prisma.spacePermission.create({
                data: {
                    roleId: memberRole.id,
                    permissionKey: permission,
                    granted: true,
                },
            });
        }

        for (const permission of DEFAULT_ROLE_CONFIGS.VIEWER.permissions) {
            await prisma.spacePermission.create({
                data: {
                    roleId: viewerRole.id,
                    permissionKey: permission,
                    granted: true,
                },
            });
        }

        console.log(`  Created permissions for all roles`);

        // Migrate existing members
        const roleMap: Record<string, string> = {
            OWNER: adminRole.id,
            ADMIN: adminRole.id,
            MEMBER: memberRole.id,
            VIEWER: viewerRole.id,
        };

        for (const member of space.members) {
            const oldRole = (member as any).role as string;
            const newRoleId = roleMap[oldRole] || memberRole.id;

            await prisma.$executeRaw`
        UPDATE space_members 
        SET roleId = ${newRoleId}
        WHERE id = ${member.id}
      `;
        }

        console.log(`  Migrated ${space.members.length} members`);
    }

    console.log('\n✅ Migration completed successfully!');
}

migrateSpaceMembers()
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
