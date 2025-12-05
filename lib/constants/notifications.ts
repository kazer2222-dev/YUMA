// Notification Event Types and Configurations

export const NOTIFICATION_EVENTS = {
    // Test/Regression events
    TEST_PRIORITIZED: 'TEST_PRIORITIZED',
    TEST_CREATED: 'TEST_CREATED',
    BUG_REPORTED: 'BUG_REPORTED',

    // User management events
    USER_ADDED: 'USER_ADDED',
    USER_REMOVED: 'USER_REMOVED',
    ROLE_CHANGED: 'ROLE_CHANGED',
    GROUP_MEMBER_ADDED: 'GROUP_MEMBER_ADDED',
    GROUP_MEMBER_REMOVED: 'GROUP_MEMBER_REMOVED',

    // Task events
    TASK_ASSIGNED: 'TASK_ASSIGNED',
    TASK_COMPLETED: 'TASK_COMPLETED',
    TASK_COMMENTED: 'TASK_COMMENTED',
} as const;

export type NotificationEventType = keyof typeof NOTIFICATION_EVENTS;

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
    TEST_PRIORITIZED: 'Test Priority Updated',
    TEST_CREATED: 'New Test Created',
    BUG_REPORTED: 'Bug Reported',
    USER_ADDED: 'User Added to Space',
    USER_REMOVED: 'User Removed from Space',
    ROLE_CHANGED: 'User Role Changed',
    GROUP_MEMBER_ADDED: 'User Added to Group',
    GROUP_MEMBER_REMOVED: 'User Removed from Group',
    TASK_ASSIGNED: 'Task Assigned',
    TASK_COMPLETED: 'Task Completed',
    TASK_COMMENTED: 'New Comment on Task',
};

export const NOTIFICATION_EVENT_DESCRIPTIONS: Record<NotificationEventType, string> = {
    TEST_PRIORITIZED: 'When a test case priority is updated by the regression algorithm',
    TEST_CREATED: 'When a new test case is created in the space',
    BUG_REPORTED: 'When a bug is linked to a test case',
    USER_ADDED: 'When a new user is added to the space',
    USER_REMOVED: 'When a user is removed from the space',
    ROLE_CHANGED: 'When a user\'s role is changed in the space',
    GROUP_MEMBER_ADDED: 'When a user is added to a group',
    GROUP_MEMBER_REMOVED: 'When a user is removed from a group',
    TASK_ASSIGNED: 'When a task is assigned to a user',
    TASK_COMPLETED: 'When a task is marked as completed',
    TASK_COMMENTED: 'When someone comments on a task',
};

// Recipient types
export const RECIPIENT_TYPES = {
    SPACE_ADMIN: 'SPACE_ADMIN',
    ROLE: 'ROLE',
    USER: 'USER',
    ASSIGNEE: 'ASSIGNEE',
    REPORTER: 'REPORTER',
    WATCHER: 'WATCHER',
} as const;

export type RecipientType = keyof typeof RECIPIENT_TYPES;

export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
    SPACE_ADMIN: 'Space Administrators',
    ROLE: 'Specific Role',
    USER: 'Specific User',
    ASSIGNEE: 'Current Assignee',
    REPORTER: 'Reporter',
    WATCHER: 'Watchers',
};

// Default notification scheme configuration
export const DEFAULT_SCHEME_EVENTS: Array<{
    eventType: NotificationEventType;
    enabled: boolean;
    defaultRecipients: Array<{ type: RecipientType; id?: string }>;
}> = [
        {
            eventType: 'TEST_PRIORITIZED',
            enabled: true,
            defaultRecipients: [{ type: 'ASSIGNEE' }, { type: 'WATCHER' }],
        },
        {
            eventType: 'TEST_CREATED',
            enabled: true,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'BUG_REPORTED',
            enabled: true,
            defaultRecipients: [{ type: 'ASSIGNEE' }],
        },
        {
            eventType: 'USER_ADDED',
            enabled: true,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'USER_REMOVED',
            enabled: true,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'ROLE_CHANGED',
            enabled: true,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'GROUP_MEMBER_ADDED',
            enabled: false,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'GROUP_MEMBER_REMOVED',
            enabled: false,
            defaultRecipients: [{ type: 'SPACE_ADMIN' }],
        },
        {
            eventType: 'TASK_ASSIGNED',
            enabled: true,
            defaultRecipients: [{ type: 'ASSIGNEE' }],
        },
        {
            eventType: 'TASK_COMPLETED',
            enabled: true,
            defaultRecipients: [{ type: 'REPORTER' }, { type: 'WATCHER' }],
        },
        {
            eventType: 'TASK_COMMENTED',
            enabled: true,
            defaultRecipients: [{ type: 'ASSIGNEE' }, { type: 'WATCHER' }],
        },
    ];
