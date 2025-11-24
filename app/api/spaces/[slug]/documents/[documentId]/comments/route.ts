import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/[documentId]/comments - List comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string }> | { slug: string; documentId: string } }
) {
  try {
    const { slug, documentId } = await resolveParams(params);
    
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

    // Check access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
      include: {
        access: {
          where: { userId: user.id }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    const isAuthor = document.authorId === user.id;
    const hasAccess = document.access.length > 0 || isAuthor;
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    if (!hasAccess && !membership && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get comments
    const comments = await prisma.documentComment.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        userId: c.userId,
        user: c.user,
        parentId: c.parentId,
        resolved: c.resolved,
        resolvedBy: c.resolvedBy,
        resolvedAt: c.resolvedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/documents/[documentId]/comments - Create comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string }> | { slug: string; documentId: string } }
) {
  try {
    const { slug, documentId } = await resolveParams(params);
    
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
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check access - need COMMENT or higher
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
      include: {
        access: {
          where: { userId: user.id }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    const userAccess = document.access[0];
    const isAuthor = document.authorId === user.id;
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    const canComment = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN', 'EDIT', 'COMMENT'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN' || membership.role === 'MEMBER')) ||
      isAdmin;

    if (!canComment) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to comment' },
        { status: 403 }
      );
    }

    // Create comment
    const comment = await prisma.documentComment.create({
      data: {
        documentId,
        userId: user.id,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'COMMENTED',
        data: JSON.stringify({ commentId: comment.id })
      }
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        userId: comment.userId,
        user: comment.user,
        parentId: comment.parentId,
        resolved: comment.resolved,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

