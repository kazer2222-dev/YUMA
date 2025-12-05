import { prisma } from '@/lib/prisma';
import { DEFAULT_SCHEME_EVENTS, NotificationEventType, RecipientType } from '@/lib/constants/notifications';

/**
 * Notification Service
 * Handles creating, sending, and managing notifications for spaces
 */
export class NotificationService {
    /**
     * Get or create a notification scheme for a space
     */
    static async getOrCreateScheme(spaceId: string) {
        let scheme = await prisma.notificationScheme.findUnique({
            where: { spaceId },
            include: {
                events: {
                    include: {
                        recipients: true
                    }
                }
            }
        });

        if (!scheme) {
            scheme = await this.createDefaultScheme(spaceId);
        }

        return scheme;
    }

    /**
     * Create a default notification scheme for a space
     */
    static async createDefaultScheme(spaceId: string) {
        const space = await prisma.space.findUnique({
            where: { id: spaceId },
            select: { name: true }
        });

        const scheme = await prisma.notificationScheme.create({
            data: {
                spaceId,
                name: `${space?.name || 'Space'} Notifications`,
                description: 'Default notification scheme',
                events: {
                    create: DEFAULT_SCHEME_EVENTS.map(event => ({
                        eventType: event.eventType,
                        enabled: event.enabled,
                        recipients: {
                            create: event.defaultRecipients.map(r => ({
                                recipientType: r.type,
                                recipientId: r.id || null
                            }))
                        }
                    }))
                }
            },
            include: {
                events: {
                    include: {
                        recipients: true
                    }
                }
            }
        });

        return scheme;
    }

    /**
     * Update event configuration
     */
    static async updateEvent(eventId: string, data: { enabled?: boolean }) {
        return prisma.notificationSchemeEvent.update({
            where: { id: eventId },
            data,
            include: {
                recipients: true
            }
        });
    }

    /**
     * Add a recipient to an event
     */
    static async addRecipient(eventId: string, recipientType: RecipientType, recipientId?: string) {
        return prisma.notificationEventRecipient.create({
            data: {
                eventId,
                recipientType,
                recipientId: recipientId || null
            }
        });
    }

    /**
     * Remove a recipient from an event
     */
    static async removeRecipient(recipientId: string) {
        return prisma.notificationEventRecipient.delete({
            where: { id: recipientId }
        });
    }

    /**
     * Send a notification to users
     */
    static async sendNotification(params: {
        spaceId: string;
        eventType: NotificationEventType;
        title: string;
        message: string;
        link?: string;
        triggerUserId?: string; // User who triggered the event (to exclude from self-notify)
        targetUserIds?: string[]; // Specific users to notify (for dynamic recipients like ASSIGNEE)
    }) {
        const { spaceId, eventType, title, message, link, triggerUserId, targetUserIds } = params;

        // Get scheme and event config
        const scheme = await prisma.notificationScheme.findUnique({
            where: { spaceId },
            include: {
                events: {
                    where: { eventType, enabled: true },
                    include: {
                        recipients: true
                    }
                }
            }
        });

        if (!scheme || scheme.events.length === 0) {
            return []; // No notifications configured for this event
        }

        const event = scheme.events[0];
        const recipientUserIds = new Set<string>();

        // Resolve recipients
        for (const recipient of event.recipients) {
            const resolvedIds = await this.resolveRecipient(
                spaceId,
                recipient.recipientType as RecipientType,
                recipient.recipientId,
                targetUserIds
            );
            resolvedIds.forEach(id => recipientUserIds.add(id));
        }

        // Remove trigger user if self-notify is disabled (check user preferences)
        if (triggerUserId) {
            const pref = await prisma.userNotificationPreference.findFirst({
                where: {
                    userId: triggerUserId,
                    OR: [
                        { spaceId, eventType },
                        { spaceId, eventType: null },
                        { spaceId: null, eventType: null }
                    ]
                },
                orderBy: [
                    { spaceId: 'desc' },
                    { eventType: 'desc' }
                ]
            });

            if (!pref?.selfNotify) {
                recipientUserIds.delete(triggerUserId);
            }
        }

        // Create notifications for each recipient
        const notifications = await Promise.all(
            Array.from(recipientUserIds).map(userId =>
                prisma.notification.create({
                    data: {
                        userId,
                        spaceId,
                        eventType,
                        title,
                        message,
                        link
                    }
                })
            )
        );

        return notifications;
    }

    /**
     * Resolve a recipient type to actual user IDs
     */
    private static async resolveRecipient(
        spaceId: string,
        recipientType: RecipientType,
        recipientId: string | null,
        targetUserIds?: string[]
    ): Promise<string[]> {
        switch (recipientType) {
            case 'SPACE_ADMIN': {
                // Get users with OWNER role or admin permission
                const admins = await prisma.spaceMember.findMany({
                    where: {
                        spaceId,
                        role: 'OWNER'
                    },
                    select: { userId: true }
                });
                return admins.map(a => a.userId);
            }

            case 'ROLE': {
                if (!recipientId) return [];
                const roleMembers = await prisma.spaceMember.findMany({
                    where: {
                        spaceId,
                        roleId: recipientId
                    },
                    select: { userId: true }
                });
                return roleMembers.map(m => m.userId);
            }

            case 'USER': {
                return recipientId ? [recipientId] : [];
            }

            case 'ASSIGNEE':
            case 'REPORTER':
            case 'WATCHER': {
                // These are resolved from targetUserIds passed to sendNotification
                return targetUserIds || [];
            }

            default:
                return [];
        }
    }

    /**
     * Get user's notifications
     */
    static async getUserNotifications(userId: string, options?: {
        unreadOnly?: boolean;
        limit?: number;
        offset?: number;
    }) {
        const { unreadOnly = false, limit = 50, offset = 0 } = options || {};

        const where: any = { userId };
        if (unreadOnly) {
            where.read = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    space: {
                        select: { name: true, slug: true }
                    }
                }
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, read: false } })
        ]);

        return { notifications, total, unreadCount };
    }

    /**
     * Mark notifications as read
     */
    static async markAsRead(notificationIds: string[], userId: string) {
        return prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId
            },
            data: { read: true }
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string, spaceId?: string) {
        const where: any = { userId, read: false };
        if (spaceId) {
            where.spaceId = spaceId;
        }

        return prisma.notification.updateMany({
            where,
            data: { read: true }
        });
    }
}
