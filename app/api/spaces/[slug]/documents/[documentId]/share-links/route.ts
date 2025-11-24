import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/[documentId]/share-links - List share links
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

    // Get share links
    const shareLinks = await prisma.documentShareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      shareLinks: shareLinks.map(link => ({
        id: link.id,
        token: link.token,
        accessLevel: link.accessLevel,
        expiresAt: link.expiresAt,
        maxViews: link.maxViews,
        viewCount: link.viewCount,
        isActive: link.isActive,
        createdAt: link.createdAt,
        hasPassword: !!link.password
      }))
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/documents/[documentId]/share-links - Create share link
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
    const { accessLevel, password, expiresAt, maxViews } = body;

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

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      // In production, use bcrypt or similar
      const crypto = await import('crypto');
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    }

    // Create share link
    const shareLink = await prisma.documentShareLink.create({
      data: {
        documentId,
        token,
        createdBy: user.id,
        accessLevel: accessLevel || 'VIEW',
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxViews: maxViews ? parseInt(maxViews) : null,
        isActive: true
      }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'SHARED',
        data: JSON.stringify({ shareLinkId: shareLink.id, accessLevel })
      }
    });

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        accessLevel: shareLink.accessLevel,
        expiresAt: shareLink.expiresAt,
        maxViews: shareLink.maxViews,
        viewCount: shareLink.viewCount,
        isActive: shareLink.isActive,
        createdAt: shareLink.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

