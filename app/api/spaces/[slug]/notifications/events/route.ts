import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';
import { NotificationService } from '@/lib/services/notification-service';
import { RECIPIENT_TYPE_LABELS } from '@/lib/constants/notifications';

/**
 * PUT /api/spaces/[slug]/notifications/events
 * Update event configuration (enable/disable, add/remove recipients)
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
        const { eventId, enabled, action, recipientType, recipientId } = body;

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

        // Handle different actions
        if (action === 'toggle') {
            // Toggle event enabled/disabled
            const event = await NotificationService.updateEvent(eventId, { enabled });
            return NextResponse.json({ success: true, event });
        }

        if (action === 'addRecipient') {
            // Add a recipient to an event
            const recipient = await NotificationService.addRecipient(eventId, recipientType, recipientId);
            return NextResponse.json({ success: true, recipient });
        }

        if (action === 'removeRecipient') {
            // Remove a recipient
            await NotificationService.removeRecipient(recipientId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, message: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error updating notification event:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update notification event' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/spaces/[slug]/notifications/events
 * Get recipient type options for configuration
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

        // Get space with roles
        const space = await prisma.space.findUnique({
            where: { slug },
            include: {
                roles: {
                    select: { id: true, name: true }
                },
                members: {
                    select: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
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

        // Return recipient options
        return NextResponse.json({
            success: true,
            recipientTypes: RECIPIENT_TYPE_LABELS,
            roles: space.roles,
            users: space.members.map(m => m.user)
        });
    } catch (error) {
        console.error('Error fetching notification options:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch notification options' },
            { status: 500 }
        );
    }
}
