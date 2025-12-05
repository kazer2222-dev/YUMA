import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission-middleware';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { PermissionService } from '@/lib/services/permission-service';
import crypto from 'crypto';

/**
 * POST /api/spaces/[slug]/invitations
 * Send invitation to join space
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json();
        const { email, roleId } = body;

        if (!email || !roleId) {
            return NextResponse.json(
                { success: false, message: 'email and roleId are required' },
                { status: 400 }
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

        const authCheck = await requirePermission(request, space.id, PERMISSIONS.MANAGE_MEMBERS);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        // Verify role exists
        const role = await prisma.spaceRole.findFirst({
            where: {
                id: roleId,
                spaceId: space.id,
            },
        });

        if (!role) {
            return NextResponse.json(
                { success: false, message: 'Invalid role ID' },
                { status: 400 }
            );
        }

        // Check if user already exists and is a member
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const existingMember = await prisma.spaceMember.findUnique({
                where: {
                    spaceId_userId: {
                        spaceId: space.id,
                        userId: existingUser.id,
                    },
                },
            });

            if (existingMember) {
                return NextResponse.json(
                    { success: false, message: 'User is already a member' },
                    { status: 400 }
                );
            }
        }

        // Check for pending invitation
        const pendingInvitation = await prisma.spaceInvitation.findFirst({
            where: {
                spaceId: space.id,
                email,
                status: 'PENDING',
            },
        });

        if (pendingInvitation) {
            return NextResponse.json(
                { success: false, message: 'Invitation already sent to this email' },
                { status: 400 }
            );
        }

        // Generate invitation token
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invitation = await prisma.spaceInvitation.create({
            data: {
                spaceId: space.id,
                email,
                roleId,
                token,
                invitedBy: authCheck.user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            include: {
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // TODO: Send invitation email

        // Log action
        await PermissionService.logAction(
            space.id,
            authCheck.user.id,
            'INVITATION_SENT',
            invitation.id,
            { email, role: role.name }
        );

        return NextResponse.json({
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role.name,
                expiresAt: invitation.expiresAt,
                invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
            },
        });
    } catch (error) {
        console.error('[API] Error creating invitation:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/spaces/[slug]/invitations
 * List all pending invitations for a space
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        const authCheck = await requirePermission(request, space.id, PERMISSIONS.MANAGE_MEMBERS);
        if (!authCheck.authorized) {
            return authCheck.response!;
        }

        const invitations = await prisma.spaceInvitation.findMany({
            where: {
                spaceId: space.id,
            },
            include: {
                role: {
                    select: {
                        name: true,
                    },
                },
                inviter: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            invitations,
        });
    } catch (error) {
        console.error('[API] Error fetching invitations:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
