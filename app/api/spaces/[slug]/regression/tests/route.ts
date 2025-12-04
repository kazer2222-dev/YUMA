import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/spaces/[slug]/regression/tests
export async function GET(
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

        const tests = await prisma.test.findMany({
            where: { spaceId: space.id },
            include: { lastExecutedRelease: true },
            orderBy: { score: 'desc' },
        });

        return NextResponse.json({ success: true, tests });
    } catch (error: any) {
        console.error('Regression Tests GET error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch tests', error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/spaces/[slug]/regression/tests
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

        const body = await request.json();
        const { name, module } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        const test = await prisma.test.create({
            data: {
                spaceId: space.id,
                name,
                module: module || 'General',
            },
        });

        return NextResponse.json({ success: true, test });
    } catch (error: any) {
        console.error('Regression Test POST error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create test', error: error.message },
            { status: 500 }
        );
    }
}
