/**
 * Permission keys for Space-level access control
 * Each permission represents a specific action that can be granted or denied to a role
 */
export const PERMISSIONS = {
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

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Permission metadata for UI display
 */
export const PERMISSION_METADATA: Record<PermissionKey, { label: string; description: string; category: string }> = {
    [PERMISSIONS.MANAGE_SPACE]: {
        label: 'Manage Space Settings',
        description: 'Edit space name, description, and general settings',
        category: 'Space Management',
    },
    [PERMISSIONS.MANAGE_MEMBERS]: {
        label: 'Manage Members',
        description: 'Add, remove, and modify space members',
        category: 'Space Management',
    },
    [PERMISSIONS.MANAGE_ROLES]: {
        label: 'Manage Roles',
        description: 'Create, edit, and delete custom roles',
        category: 'Space Management',
    },
    [PERMISSIONS.VIEW_SPACE]: {
        label: 'View Space',
        description: 'Access and view space content',
        category: 'Space Management',
    },

    // Tasks
    [PERMISSIONS.CREATE_TASKS]: {
        label: 'Create Tasks',
        description: 'Create new tasks',
        category: 'Task Management',
    },
    [PERMISSIONS.EDIT_TASKS]: {
        label: 'Edit Tasks',
        description: 'Modify existing tasks',
        category: 'Task Management',
    },
    [PERMISSIONS.DELETE_TASKS]: {
        label: 'Delete Tasks',
        description: 'Permanently delete tasks',
        category: 'Task Management',
    },
    [PERMISSIONS.VIEW_TASKS]: {
        label: 'View Tasks',
        description: 'View task details',
        category: 'Task Management',
    },
    [PERMISSIONS.ASSIGN_TASKS]: {
        label: 'Assign Tasks',
        description: 'Assign tasks to team members',
        category: 'Task Management',
    },

    // Boards
    [PERMISSIONS.CREATE_BOARDS]: {
        label: 'Create Boards',
        description: 'Create new boards',
        category: 'Board Management',
    },
    [PERMISSIONS.EDIT_BOARDS]: {
        label: 'Edit Boards',
        description: 'Modify board settings and columns',
        category: 'Board Management',
    },
    [PERMISSIONS.DELETE_BOARDS]: {
        label: 'Delete Boards',
        description: 'Delete boards',
        category: 'Board Management',
    },

    // Documents
    [PERMISSIONS.CREATE_DOCUMENTS]: {
        label: 'Create Documents',
        description: 'Create new documents',
        category: 'Document Management',
    },
    [PERMISSIONS.EDIT_DOCUMENTS]: {
        label: 'Edit Documents',
        description: 'Modify documents',
        category: 'Document Management',
    },
    [PERMISSIONS.DELETE_DOCUMENTS]: {
        label: 'Delete Documents',
        description: 'Delete documents',
        category: 'Document Management',
    },
    [PERMISSIONS.VIEW_DOCUMENTS]: {
        label: 'View Documents',
        description: 'View documents',
        category: 'Document Management',
    },

    // Test Management
    [PERMISSIONS.VIEW_REGRESS]: {
        label: 'View Regress Tab',
        description: 'Access regression testing features',
        category: 'Test Management',
    },
    [PERMISSIONS.CREATE_TEST_CASES]: {
        label: 'Create Test Cases',
        description: 'Create new test cases',
        category: 'Test Management',
    },
    [PERMISSIONS.EDIT_TEST_CASES]: {
        label: 'Edit Test Cases',
        description: 'Modify test cases',
        category: 'Test Management',
    },
    [PERMISSIONS.DELETE_TEST_CASES]: {
        label: 'Delete Test Cases',
        description: 'Delete test cases',
        category: 'Test Management',
    },
    [PERMISSIONS.EXECUTE_TESTS]: {
        label: 'Execute Tests',
        description: 'Run test cases',
        category: 'Test Management',
    },
    [PERMISSIONS.OVERRIDE_PRIORITY]: {
        label: 'Override Test Priority',
        description: 'Manually adjust test prioritization',
        category: 'Test Management',
    },
    [PERMISSIONS.RUN_REGRESSION_SUITE]: {
        label: 'Run Regression Suite',
        description: 'Execute full regression test suites',
        category: 'Test Management',
    },
    [PERMISSIONS.DELETE_TEST_RESULTS]: {
        label: 'Delete Test Results',
        description: 'Delete test execution results',
        category: 'Test Management',
    },

    // Reports
    [PERMISSIONS.VIEW_REPORTS]: {
        label: 'View Reports',
        description: 'Access analytics and reports',
        category: 'Analytics',
    },
    [PERMISSIONS.CREATE_REPORTS]: {
        label: 'Create Reports',
        description: 'Create custom reports',
        category: 'Analytics',
    },
    [PERMISSIONS.EXPORT_DATA]: {
        label: 'Export Data',
        description: 'Export space data',
        category: 'Analytics',
    },

    // Integrations
    [PERMISSIONS.MANAGE_INTEGRATIONS]: {
        label: 'Manage Integrations',
        description: 'Configure external integrations',
        category: 'Integrations',
    },
    [PERMISSIONS.VIEW_INTEGRATIONS]: {
        label: 'View Integrations',
        description: 'View configured integrations',
        category: 'Integrations',
    },

    // Workflows
    [PERMISSIONS.CREATE_WORKFLOWS]: {
        label: 'Create Workflows',
        description: 'Create workflow automations',
        category: 'Automation',
    },
    [PERMISSIONS.EDIT_WORKFLOWS]: {
        label: 'Edit Workflows',
        description: 'Modify workflows',
        category: 'Automation',
    },
    [PERMISSIONS.DELETE_WORKFLOWS]: {
        label: 'Delete Workflows',
        description: 'Delete workflows',
        category: 'Automation',
    },

    // Sprints & Releases
    [PERMISSIONS.MANAGE_SPRINTS]: {
        label: 'Manage Sprints',
        description: 'Create and manage sprints',
        category: 'Agile',
    },
    [PERMISSIONS.MANAGE_RELEASES]: {
        label: 'Manage Releases',
        description: 'Create and manage releases',
        category: 'Agile',
    },

    // Comments
    [PERMISSIONS.CREATE_COMMENTS]: {
        label: 'Create Comments',
        description: 'Add comments to tasks and documents',
        category: 'Collaboration',
    },
    [PERMISSIONS.DELETE_COMMENTS]: {
        label: 'Delete Comments',
        description: 'Delete comments',
        category: 'Collaboration',
    },
};

/**
 * Default role configurations
 */
export interface RoleConfig {
    name: string;
    description: string;
    permissions: PermissionKey[];
    isDefault: boolean;
    isSystem: boolean;
}

export const DEFAULT_ROLES: Record<'ADMIN' | 'MEMBER' | 'VIEWER', RoleConfig> = {
    ADMIN: {
        name: 'Space Admin',
        description: 'Full access to all space features and settings',
        permissions: Object.values(PERMISSIONS) as PermissionKey[],
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

/**
 * Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Array<{ key: PermissionKey; metadata: typeof PERMISSION_METADATA[PermissionKey] }>> {
    const grouped: Record<string, Array<{ key: PermissionKey; metadata: typeof PERMISSION_METADATA[PermissionKey] }>> = {};

    for (const [key, metadata] of Object.entries(PERMISSION_METADATA)) {
        const category = metadata.category;
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({
            key: key as PermissionKey,
            metadata,
        });
    }

    return grouped;
}
