import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// DELETE /api/spaces/[slug]/documents/[documentId]/comments/[commentId] - Delete comment
export async function DELETE(
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

    // Check if user can delete (owner or admin)
    const isOwner = comment.userId === user.id;
    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const canDelete = isOwner || 
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete comment (cascade will delete replies)
    await prisma.documentComment.delete({
      where: { id: commentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

