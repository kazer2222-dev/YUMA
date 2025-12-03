import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/pages/tree - Get hierarchical page tree
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

    // Get all documents for this space as a flat list
    // We'll build the tree on the client side for performance
    const documents = await prisma.document.findMany({
      where: {
        spaceId: space.id,
        deletedAt: null,
        type: 'RICH_TEXT', // Only include pages, not file uploads
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        order: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Placeholder for expanded states until schema is fully applied
    const expandedMap = new Map<string, boolean>();

    // Transform documents to PageTreeNode format
    // Using existing fields until schema migration is complete
    const pages = documents.map(doc => {
      const path: string[] = [];
      
      return {
        id: doc.id,
        parentId: null, // Will be populated after schema migration
        title: doc.title,
        icon: null, // Will be populated after schema migration
        status: 'DRAFT' as const,
        labels: [],
        hasUnpublishedChanges: false,
        position: doc.order,
        childCount: 0, // Will be computed after schema migration
        isExpanded: expandedMap.get(doc.id) ?? true,
        depth: 0,
        path,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        authorId: doc.authorId,
        authorName: doc.author.name,
        authorAvatar: doc.author.avatar,
      };
    });

    return NextResponse.json({
      success: true,
      pages,
      total: pages.length,
    });
  } catch (error: any) {
    console.error('Error fetching page tree:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch page tree' },
      { status: 500 }
    );
  }
}

