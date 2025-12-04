import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { RegressionService } from '@/lib/services/regression-service';

// POST /api/spaces/[slug]/regression/prioritize
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value;
        if (!accessToken) {
            return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
        }

        const user = await AuthService.getUserFromToken(accessToken);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        }

        const resolvedParams = await Promise.resolve(params);
        const slug = resolvedParams.slug;

        const space = await prisma.space.findUnique({ where: { slug } });
        if (!space) {
            return NextResponse.json({ success: false, message: 'Space not found' }, { status: 404 });
        }

        const membership = await prisma.spaceMember.findFirst({
            where: { spaceId: space.id, userId: user.id },
        });

        if (!membership) {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        await RegressionService.prioritizeTests(space.id);

        return NextResponse.json({ success: true, message: 'Prioritization completed' });
    } catch (error: any) {
        console.error('Prioritization POST error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to prioritize tests', error: error.message },
            { status: 500 }
        );
    }
}
