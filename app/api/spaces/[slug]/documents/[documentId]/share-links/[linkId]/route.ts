import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// PATCH /api/spaces/[slug]/documents/[documentId]/share-links/[linkId] - Update share link
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string; linkId: string }> | { slug: string; documentId: string; linkId: string } }
) {
  try {
    const { slug, documentId, linkId } = await resolveParams(params);
    
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

    const userAccess = document.access[0];
    const isAuthor = document.authorId === user.id;
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    const canManage = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canManage) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update share link
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const shareLink = await prisma.documentShareLink.update({
      where: { id: linkId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        isActive: shareLink.isActive
      }
    });
  } catch (error) {
    console.error('Error updating share link:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update share link' },
      { status: 500 }
    );
  }
}

// DELETE /api/spaces/[slug]/documents/[documentId]/share-links/[linkId] - Delete share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string; linkId: string }> | { slug: string; documentId: string; linkId: string } }
) {
  try {
    const { slug, documentId, linkId } = await resolveParams(params);
    
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

    const userAccess = document.access[0];
    const isAuthor = document.authorId === user.id;
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    const canManage = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canManage) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete share link
    await prisma.documentShareLink.delete({
      where: { id: linkId }
    });

    return NextResponse.json({
      success: true,
      message: 'Share link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting share link:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}

