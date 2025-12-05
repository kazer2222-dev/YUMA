import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET - Search users, roles, and groups for template access assignment
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

        const space = await prisma.space.findUnique({
            where: { slug: params.slug },
        });

        if (!space) {
            return NextResponse.json(
                { success: false, message: 'Space not found' },
                { status: 404 }
            );
        }

        // Check if user is member
        const member = await prisma.spaceMember.findUnique({
            where: {
                spaceId_userId: {
                    spaceId: space.id,
                    userId: user.id,
                },
            },
        });

        const isAdmin = await AuthService.isAdmin(user.id);

        if (!member && !isAdmin) {
            return NextResponse.json(
                { success: false, message: 'Not a member of this space' },
                { status: 403 }
            );
        }

        const searchQuery = request.nextUrl.searchParams.get('search') || '';
        const entityType = request.nextUrl.searchParams.get('type'); // 'USER', 'ROLE', 'GROUP', or null for all
        const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);

        const entities: Array<{
            id: string;
            type: 'USER' | 'ROLE' | 'GROUP' | 'SPECIAL';
            name: string;
            email?: string;
            description?: string;
            color?: string;
            memberCount?: number;
        }> = [];

        // Special entities (always include at top when no search or search matches)
        const specialEntities = [
            { id: 'ALL_MEMBERS', type: 'SPECIAL' as const, name: 'All Space Members', description: 'Everyone in this space' },
            { id: 'SPACE_ADMINS', type: 'SPECIAL' as const, name: 'Space Administrators', description: 'Admins and owners' },
            { id: 'CREATOR', type: 'SPECIAL' as const, name: 'Task Creator', description: 'User who creates the task' },
            { id: 'ASSIGNEE', type: 'SPECIAL' as const, name: 'Task Assignee', description: 'User assigned to the task' },
        ];

        if (!entityType || entityType === 'SPECIAL') {
            const matchingSpecial = specialEntities.filter(
                e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            entities.push(...matchingSpecial);
        }

        // Search users (space members)
        if (!entityType || entityType === 'USER') {
            const members = await prisma.spaceMember.findMany({
                where: {
                    spaceId: space.id,
                    user: {
                        OR: searchQuery ? [
                            { name: { contains: searchQuery } },
                            { email: { contains: searchQuery } },
                        ] : undefined,
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                take: limit,
            });

            members.forEach(m => {
                if (m.user) {
                    entities.push({
                        id: m.user.id,
                        type: 'USER',
                        name: m.user.name || m.user.email,
                        email: m.user.email,
                    });
                }
            });
        }

        // Search roles
        if (!entityType || entityType === 'ROLE') {
            const roles = await prisma.spaceRole.findMany({
                where: {
                    spaceId: space.id,
                    ...(searchQuery ? {
                        name: { contains: searchQuery },
                    } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    _count: {
                        select: { members: true },
                    },
                },
                take: limit,
            });

            roles.forEach(r => {
                entities.push({
                    id: r.id,
                    type: 'ROLE',
                    name: r.name,
                    description: r.description || undefined,
                    memberCount: r._count.members,
                });
            });
        }

        // Search groups
        if (!entityType || entityType === 'GROUP') {
            const groups = await prisma.spaceGroup.findMany({
                where: {
                    spaceId: space.id,
                    ...(searchQuery ? {
                        name: { contains: searchQuery },
                    } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    _count: {
                        select: { members: true },
                    },
                },
                take: limit,
            });

            groups.forEach(g => {
                entities.push({
                    id: g.id,
                    type: 'GROUP',
                    name: g.name,
                    description: g.description || undefined,
                    memberCount: g._count.members,
                });
            });
        }

        // Sort: special entities first, then by name
        entities.sort((a, b) => {
            if (a.type === 'SPECIAL' && b.type !== 'SPECIAL') return -1;
            if (a.type !== 'SPECIAL' && b.type === 'SPECIAL') return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({
            success: true,
            entities: entities.slice(0, limit),
            total: entities.length,
        });
    } catch (error: any) {
        console.error('Error searching entities:', error);
        return NextResponse.json(
            { success: false, message: `Failed to search entities: ${error.message || 'Unknown error'}` },
            { status: 500 }
        );
    }
}
