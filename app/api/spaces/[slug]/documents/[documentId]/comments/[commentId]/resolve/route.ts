import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/documents/[documentId]/comments/[commentId]/resolve - Resolve comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string; commentId: string }> | { slug: string; documentId: string; commentId: string } }
) {
  try {
    const { slug, documentId, commentId } = await resolveParams(params);
    
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

    // Get comment
    const comment = await prisma.documentComment.findUnique({
      where: { id: commentId },
      include: {
        document: {
          include: {
            access: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!comment || comment.documentId !== documentId) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check access
    const isAuthor = comment.document.authorId === user.id;
    const userAccess = comment.document.access[0];
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    const canResolve = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN', 'EDIT'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canResolve) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Toggle resolve status
    const resolved = !comment.resolved;
    const updated = await prisma.documentComment.update({
      where: { id: commentId },
      data: {
        resolved,
        resolvedBy: resolved ? user.id : null,
        resolvedAt: resolved ? new Date() : null
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

    return NextResponse.json({
      success: true,
      comment: {
        id: updated.id,
        resolved: updated.resolved,
        resolvedBy: updated.resolvedBy,
        resolvedAt: updated.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resolve comment' },
      { status: 500 }
    );
  }
}

