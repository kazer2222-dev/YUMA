import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/pages/recent - Get user's recently viewed pages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const { slug } = await resolveParams(params);
    
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

    // Get recent pages from activity log (VIEWED events)
    const recentActivities = await prisma.documentActivity.findMany({
      where: {
        userId: user.id,
        type: 'VIEWED',
        document: {
          spaceId: space.id,
          deletedAt: null,
          type: 'RICH_TEXT',
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      distinct: ['documentId'],
      include: {
        document: {
          select: {
            id: true,
            title: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    const pages = recentActivities
      .filter(a => a.document)
      .map(activity => ({
        id: activity.document.id,
        parentId: null,
        title: activity.document.title,
        icon: null,
        status: 'DRAFT' as const,
        labels: [],
        hasUnpublishedChanges: false,
        position: activity.document.order,
        childCount: 0,
        isExpanded: true,
        depth: 0,
        path: [],
        createdAt: activity.document.createdAt.toISOString(),
        updatedAt: activity.document.updatedAt.toISOString(),
        viewedAt: activity.createdAt.toISOString(),
      }));

    return NextResponse.json({
      success: true,
      pages,
    });
  } catch (error: any) {
    console.error('Error fetching recent pages:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch recent pages' },
      { status: 500 }
    );
  }
}

