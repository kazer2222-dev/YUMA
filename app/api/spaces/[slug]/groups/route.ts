import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';

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

        // Check if user is member of space
        const membership = await prisma.spaceMember.findFirst({
            where: {
                space: { slug },
                userId: user.id
            }
        });

        if (!membership) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Fetch groups
        const groups = await prisma.spaceGroup.findMany({
            where: {
                space: { slug }
            },
            include: {
                _count: {
                    select: { members: true }
                },
                role: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            groups
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch groups' },
            { status: 500 }
        );
    }
}

export async function POST(
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
        const { name, description, roleId } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, message: 'Group name is required' },
                { status: 400 }
            );
        }

        // Check permissions
        const membership = await prisma.spaceMember.findFirst({
            where: {
                space: { slug },
                userId: user.id
            }
        });

        const hasPermission = await PermissionService.hasPermission(user.id, membership?.spaceId || '', 'manage_members');
        const isOwner = membership?.role === 'OWNER';

        if (!membership || (!isOwner && !hasPermission)) {
            return NextResponse.json(
                { success: false, message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Check if group name exists
        const existingGroup = await prisma.spaceGroup.findFirst({
            where: {
                space: { slug },
                name
            }
        });

        if (existingGroup) {
            return NextResponse.json(
                { success: false, message: 'Group with this name already exists' },
                { status: 400 }
            );
        }

        // Create group
        const group = await prisma.spaceGroup.create({
            data: {
                space: { connect: { slug } },
                name,
                description,
                role: roleId ? { connect: { id: roleId } } : undefined
            },
            include: {
                space: { select: { id: true } },
                role: { select: { name: true } }
            }
        });

        // Audit log
        await prisma.spaceAuditLog.create({
            data: {
                spaceId: group.spaceId,
                userId: user.id,
                action: 'GROUP_CREATED',
                targetId: group.id,
                metadata: JSON.stringify({
                    groupName: group.name,
                    roleName: group.role?.name || null
                })
            }
        });

        return NextResponse.json({
            success: true,
            group
        });
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create group' },
            { status: 500 }
        );
    }
}
