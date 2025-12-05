import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/permission-middleware';
import { PERMISSIONS } from '@/lib/constants/permissions';

/**
 * GET /api/spaces/[slug]/audit
 * Get audit log for a space
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const action = searchParams.get('action');
        const userId = searchParams.get('userId');

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

        const where: any = { spaceId: space.id };
        if (action) {
            where.action = action;
        }
        if (userId) {
            where.userId = userId;
        }

        const [logs, total] = await Promise.all([
            prisma.spaceAuditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.spaceAuditLog.count({ where }),
        ]);

        const parsedLogs = logs.map((log) => ({
            ...log,
            metadata: log.metadata ? JSON.parse(log.metadata) : null,
        }));

        return NextResponse.json({
            success: true,
            logs: parsedLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[API] Error fetching audit log:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
