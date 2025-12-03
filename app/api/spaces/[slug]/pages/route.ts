import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/pages - Create a new page
export async function POST(
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

    const body = await request.json();
    const {
      title = 'Untitled',
      parentId = null,
      icon = null,
      content = null,
      position = null,
    } = body;

    // Check if user is member of space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
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

    // Calculate order position
    let newOrder = position;
    if (newOrder === null) {
      // Get the maximum order among documents
      const maxOrderResult = await prisma.document.aggregate({
        where: {
          spaceId: space.id,
          deletedAt: null,
        },
        _max: {
          order: true,
        }
      });
      newOrder = (maxOrderResult._max.order ?? -1) + 1;
    }

    // Create the page using existing schema fields
    const page = await prisma.document.create({
      data: {
        spaceId: space.id,
        parentId: parentId, // Add parent support for hierarchy
        title: title,
        content: content || '',
        type: 'RICH_TEXT',
        status: 'DRAFT',
        tags: '[]',
        order: newOrder,
        position: newOrder, // Use position for tree ordering
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
      }
    });

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        documentId: page.id,
        version: 1,
        content: content || '',
        createdBy: user.id,
        label: 'initial'
      }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId: page.id,
        userId: user.id,
        type: 'CREATED',
        data: JSON.stringify({ title })
      }
    });

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        parentId: page.parentId,
        title: page.title,
        icon: null,
        status: 'DRAFT' as const,
        labels: [],
        hasUnpublishedChanges: false,
        position: page.position,
        childCount: 0,
        isExpanded: true,
        depth: parentId ? 1 : 0, // Calculate depth based on parent
        path: [],
        createdAt: page.createdAt.toISOString(),
        updatedAt: page.updatedAt.toISOString(),
        authorId: page.authorId,
        authorName: page.author.name,
        authorAvatar: page.author.avatar,
      }
    });
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create page' },
      { status: 500 }
    );
  }
}

