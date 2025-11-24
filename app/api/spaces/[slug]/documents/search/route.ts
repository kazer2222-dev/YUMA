import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/search - Search documents
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type');
    const authorId = searchParams.get('authorId');
    const tag = searchParams.get('tag');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const semantic = searchParams.get('semantic') === 'true';

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

    // Build where clause
    const where: any = {
      spaceId: space.id,
      deletedAt: null
    };

    if (type) {
      where.type = type;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (tag) {
      where.tags = {
        contains: tag
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Full-text search
    if (query) {
      if (semantic) {
        // Semantic search using vectors (simplified - in production, use vector DB)
        // For now, fall back to keyword search
        // SQLite doesn't support case-insensitive mode
        where.OR = [
          { title: { contains: query } },
          { description: { contains: query } },
          { content: { contains: query } }
        ];
      } else {
        // Keyword search - SQLite doesn't support case-insensitive mode
        where.OR = [
          { title: { contains: query } },
          { description: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } }
        ];
      }
    }

    // Get documents user has access to
    const documents = await prisma.document.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        access: {
          where: {
            userId: user.id
          }
        },
        _count: {
          select: {
            versions: true,
            comments: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Filter documents based on access
    const accessibleDocuments = documents.filter(doc => {
      // Author always has access
      if (doc.authorId === user.id) return true;
      
      // Check explicit access
      if (doc.access.length > 0) return true;
      
      // Check space membership role
      if (membership) {
        const role = membership.role;
        if (role === 'OWNER' || role === 'ADMIN') return true;
      }
      
      return false;
    });

    // Get total count
    const total = await prisma.document.count({ where });

    // Calculate relevance scores (simplified)
    const scoredDocuments = accessibleDocuments.map(doc => {
      let score = 0;
      if (query) {
        const queryLower = query.toLowerCase();
        if (doc.title.toLowerCase().includes(queryLower)) score += 10;
        if (doc.description?.toLowerCase().includes(queryLower)) score += 5;
        if (doc.content?.toLowerCase().includes(queryLower)) score += 3;
        if (doc.tags?.toLowerCase().includes(queryLower)) score += 2;
      }
      return { ...doc, relevanceScore: score };
    });

    // Sort by relevance if query provided
    if (query) {
      scoredDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    return NextResponse.json({
      success: true,
      documents: scoredDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        status: doc.status,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        author: doc.author,
        authorId: doc.authorId,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        versionCount: doc._count.versions,
        commentCount: doc._count.comments,
        relevanceScore: doc.relevanceScore
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to search documents' },
      { status: 500 }
    );
  }
}

