import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/[documentId]/access - List access
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

    // Check access - need ADMIN or OWNER
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

    // Get all access
    const access = await prisma.documentAccess.findMany({
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
      access: access.map(a => ({
        id: a.id,
        userId: a.userId,
        user: a.user,
        role: a.role,
        expiresAt: a.expiresAt,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching access:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch access' },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/documents/[documentId]/access - Grant access
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
    const { userId, role, expiresAt } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Check access - need ADMIN or OWNER
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

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create or update access
    const access = await prisma.documentAccess.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId
        }
      },
      update: {
        role,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: user.id
      },
      create: {
        documentId,
        userId,
        role,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: user.id
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
        type: 'ACCESS_CHANGED',
        data: JSON.stringify({
          targetUserId: userId,
          role,
          action: 'granted'
        })
      }
    });

    return NextResponse.json({
      success: true,
      access: {
        id: access.id,
        userId: access.userId,
        user: access.user,
        role: access.role,
        expiresAt: access.expiresAt,
        createdAt: access.createdAt
      }
    });
  } catch (error) {
    console.error('Error granting access:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to grant access' },
      { status: 500 }
    );
  }
}

// DELETE /api/spaces/[slug]/documents/[documentId]/access/[accessId] - Revoke access
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get('accessId');
    const userId = searchParams.get('userId');

    if (!accessId && !userId) {
      return NextResponse.json(
        { success: false, message: 'Access ID or User ID is required' },
        { status: 400 }
      );
    }

    // Check access - need ADMIN or OWNER
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

    // Find access to delete
    const accessToDelete = accessId
      ? await prisma.documentAccess.findUnique({ where: { id: accessId } })
      : await prisma.documentAccess.findUnique({
          where: {
            documentId_userId: {
              documentId,
              userId: userId!
            }
          }
        });

    if (!accessToDelete) {
      return NextResponse.json(
        { success: false, message: 'Access not found' },
        { status: 404 }
      );
    }

    // Don't allow removing owner access
    if (accessToDelete.role === 'OWNER' && accessToDelete.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot remove owner access' },
        { status: 403 }
      );
    }

    // Delete access
    await prisma.documentAccess.delete({
      where: { id: accessToDelete.id }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'ACCESS_CHANGED',
        data: JSON.stringify({
          targetUserId: accessToDelete.userId,
          action: 'revoked'
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to revoke access' },
      { status: 500 }
    );
  }
}

