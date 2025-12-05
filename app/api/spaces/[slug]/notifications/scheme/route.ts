import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';
import { NotificationService } from '@/lib/services/notification-service';
import { NOTIFICATION_EVENTS, NOTIFICATION_EVENT_LABELS, NOTIFICATION_EVENT_DESCRIPTIONS } from '@/lib/constants/notifications';

/**
 * GET /api/spaces/[slug]/notifications/scheme
 * Get the notification scheme for a space
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
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

        const { slug } = params;

        // Get space
        const space = await prisma.space.findUnique({
            where: { slug }
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        // Check if user is a member
        const membership = await prisma.spaceMember.findFirst({
            where: { spaceId: space.id, userId: user.id }
        });

        if (!membership) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Get or create scheme
        const scheme = await NotificationService.getOrCreateScheme(space.id);

        // Enrich with labels and descriptions
        const enrichedEvents = scheme.events.map(event => ({
            ...event,
            label: NOTIFICATION_EVENT_LABELS[event.eventType as keyof typeof NOTIFICATION_EVENTS] || event.eventType,
            description: NOTIFICATION_EVENT_DESCRIPTIONS[event.eventType as keyof typeof NOTIFICATION_EVENTS] || ''
        }));

        return NextResponse.json({
            success: true,
            scheme: {
                ...scheme,
                events: enrichedEvents
            }
        });
    } catch (error) {
        console.error('Error fetching notification scheme:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch notification scheme' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/spaces/[slug]/notifications/scheme
 * Update notification scheme settings
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { slug: string } }
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

        const { slug } = params;
        const body = await request.json();

        // Get space
        const space = await prisma.space.findUnique({
            where: { slug }
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        // Check permissions
        const hasPermission = await PermissionService.hasPermission(user.id, space.id, 'manage_members');
        const membership = await prisma.spaceMember.findFirst({
            where: { spaceId: space.id, userId: user.id }
        });
        const isOwner = membership?.role === 'OWNER';

        if (!isOwner && !hasPermission) {
            return NextResponse.json(
                { success: false, message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Update scheme
        const scheme = await prisma.notificationScheme.update({
            where: { spaceId: space.id },
            data: {
                name: body.name,
                description: body.description
            },
            include: {
                events: {
                    include: {
                        recipients: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            scheme
        });
    } catch (error) {
        console.error('Error updating notification scheme:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update notification scheme' },
            { status: 500 }
        );
    }
}
