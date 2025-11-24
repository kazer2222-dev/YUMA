import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/[documentId]/versions - List versions
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

    // Get versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
      include: {
        document: {
          select: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        changeNote: v.changeNote,
        changeSummary: v.changeSummary,
        label: v.label,
        fileSize: v.fileSize,
        createdAt: v.createdAt,
        createdBy: v.createdBy
      }))
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/documents/[documentId]/versions - Restore version
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
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { success: false, message: 'Version ID is required' },
        { status: 400 }
      );
    }

    // Check access - need EDIT or higher
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

    const canEdit = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN', 'EDIT'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get version to restore
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: versionId,
        documentId
      }
    });

    if (!version) {
      return NextResponse.json(
        { success: false, message: 'Version not found' },
        { status: 404 }
      );
    }

    // Get latest version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' }
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version from restored content
    const restoredVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        version: nextVersion,
        content: version.content,
        fileUrl: version.fileUrl,
        fileSize: version.fileSize,
        changeNote: `Restored from version ${version.version}`,
        createdBy: user.id,
        label: 'restored'
      }
    });

    // Update document
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: version.content,
        fileUrl: version.fileUrl,
        fileSize: version.fileSize
      }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'VERSION_RESTORED',
        data: JSON.stringify({
          restoredVersion: version.version,
          newVersion: nextVersion
        })
      }
    });

    return NextResponse.json({
      success: true,
      version: {
        id: restoredVersion.id,
        version: restoredVersion.version,
        createdAt: restoredVersion.createdAt
      }
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to restore version' },
      { status: 500 }
    );
  }
}

