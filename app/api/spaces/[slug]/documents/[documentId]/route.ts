import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents/[documentId] - Get document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string }> | { slug: string; documentId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug, documentId } = resolvedParams;
    
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

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
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
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
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
        },
        linkedTasks: {
          include: {
            task: {
              select: {
                id: true,
                number: true,
                summary: true,
                status: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            versions: true,
            comments: true,
            activities: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check access
    const userAccess = document.access.find(a => a.userId === user.id);
    const isAuthor = document.authorId === user.id;
    const canAccess = isAuthor || userAccess || 
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Record view activity
    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        userId: user.id,
        type: 'VIEWED',
        data: JSON.stringify({ timestamp: new Date().toISOString() })
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        status: document.status,
        content: document.content,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        tags: document.tags ? JSON.parse(document.tags) : [],
        metadata: document.metadata ? JSON.parse(document.metadata) : null,
        structure: document.structure ? JSON.parse(document.structure) : null,
        author: document.author,
        authorId: document.authorId,
        projectId: document.projectId,
        isPinned: document.isPinned,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        access: document.access.map(a => ({
          id: a.id,
          userId: a.userId,
          user: a.user,
          role: a.role,
          expiresAt: a.expiresAt
        })),
        versions: document.versions.map(v => ({
          id: v.id,
          version: v.version,
          changeNote: v.changeNote,
          changeSummary: v.changeSummary,
          label: v.label,
          createdAt: v.createdAt,
          createdBy: v.createdBy
        })),
        linkedTasks: document.linkedTasks.map(lt => ({
          id: lt.task.id,
          number: lt.task.number,
          summary: lt.task.summary,
          status: lt.task.status
        })),
        versionCount: document._count.versions,
        commentCount: document._count.comments,
        activityCount: document._count.activities,
        userRole: userAccess?.role || (isAuthor ? 'OWNER' : (membership?.role === 'OWNER' || membership?.role === 'ADMIN' ? 'ADMIN' : 'VIEW'))
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PATCH /api/spaces/[slug]/documents/[documentId] - Update document
export async function PATCH(
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

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
      include: {
        access: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check access - need EDIT or higher
    const userAccess = document.access[0];
    const isAuthor = document.authorId === user.id;
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
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

    // Build update data
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.structure !== undefined) updateData.structure = JSON.stringify(body.structure);
    if (body.metadata !== undefined) updateData.metadata = JSON.stringify(body.metadata);

    // If content or file is being updated, create new version
    let newVersion = null;
    if (body.content !== undefined || body.fileUrl !== undefined) {
      updateData.content = body.content !== undefined ? body.content : document.content;
      updateData.fileUrl = body.fileUrl !== undefined ? body.fileUrl : document.fileUrl;
      updateData.fileSize = body.fileSize !== undefined ? body.fileSize : document.fileSize;
      updateData.mimeType = body.mimeType !== undefined ? body.mimeType : document.mimeType;

      // Get latest version number
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { version: 'desc' }
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      newVersion = await prisma.documentVersion.create({
        data: {
          documentId,
          version: nextVersion,
          content: updateData.content,
          fileUrl: updateData.fileUrl,
          fileSize: updateData.fileSize,
          changeNote: body.changeNote || null,
          createdBy: user.id,
          label: body.versionLabel || null
        }
      });
    }

    // Update document
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        author: {
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
        type: newVersion ? 'VERSION_CREATED' : 'UPDATED',
        data: JSON.stringify({
          changes: Object.keys(updateData),
          version: newVersion?.version || null
        })
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DOCUMENT_UPDATED',
        targetType: 'DOCUMENT',
        targetId: documentId,
        metadata: JSON.stringify({ changes: Object.keys(updateData) })
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        type: updated.type,
        status: updated.status,
        content: updated.content,
        fileUrl: updated.fileUrl,
        tags: updated.tags ? JSON.parse(updated.tags) : [],
        author: updated.author,
        updatedAt: updated.updatedAt,
        newVersion: newVersion ? {
          version: newVersion.version,
          createdAt: newVersion.createdAt
        } : null
      }
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/spaces/[slug]/documents/[documentId] - Delete document (soft delete)
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

    // Get document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
      include: {
        access: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    // Check access - need OWNER or ADMIN
    const userAccess = document.access[0];
    const isAuthor = document.authorId === user.id;
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    const canDelete = isAuthor || 
      (userAccess && ['OWNER', 'ADMIN'].includes(userAccess.role)) ||
      (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) ||
      isAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date()
      }
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'DELETED',
        data: JSON.stringify({ timestamp: new Date().toISOString() })
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DOCUMENT_DELETED',
        targetType: 'DOCUMENT',
        targetId: documentId,
        metadata: JSON.stringify({ title: document.title })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

