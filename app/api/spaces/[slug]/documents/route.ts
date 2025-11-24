import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// GET /api/spaces/[slug]/documents - List documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;
    
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
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    if (projectId) {
      where.projectId = projectId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = {
        contains: tag
      };
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll filter in memory
      // For now, use case-sensitive contains
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Check if Document model exists in Prisma client
    if (!prisma.document) {
      console.error('Prisma client does not have Document model. Please regenerate Prisma client:');
      console.error('1. Stop the dev server (Ctrl+C)');
      console.error('2. Run: npx prisma generate');
      console.error('3. Restart the dev server');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Document model not available. Please restart the dev server after running: npx prisma generate',
          error: 'Prisma client needs to be regenerated',
          documents: []
        },
        { status: 500 }
      );
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
            comments: true,
            linkedTasks: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
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
        // For MEMBER and VIEWER, they need explicit access
      }
      
      return false;
    });

    // Get total count
    const total = await prisma.document.count({ where });

    return NextResponse.json({
      success: true,
      documents: accessibleDocuments.map(doc => ({
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
        isPinned: doc.isPinned,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        versionCount: doc._count.versions,
        commentCount: doc._count.comments,
        linkedTaskCount: doc._count.linkedTasks,
        access: doc.access[0]?.role || 'VIEW'
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to fetch documents',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/spaces/[slug]/documents - Create document
export async function POST(
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
    const body = await request.json();
    const {
      title,
      type = 'RICH_TEXT',
      content,
      fileUrl,
      fileSize,
      mimeType,
      tags = [],
      projectId,
      taskIds = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
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

    // Check if Document model exists in Prisma client
    if (!prisma.document) {
      console.error('Prisma client does not have Document model. Please regenerate Prisma client:');
      console.error('1. Stop the dev server (Ctrl+C)');
      console.error('2. Run: npx prisma generate');
      console.error('3. Restart the dev server');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Document model not available. Please restart the dev server after running: npx prisma generate',
          error: 'Prisma client needs to be regenerated'
        },
        { status: 500 }
      );
    }

    // Create document
    const document = await prisma.document.create({
      data: {
        spaceId: space.id,
        title,
        type,
        content: content || null,
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        tags: JSON.stringify(tags),
        projectId: projectId || null,
        authorId: user.id,
        status: 'DRAFT'
      },
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

    // Create initial version
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        content: content || null,
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        createdBy: user.id,
        label: 'initial'
      }
    });

    // Create owner access
    await prisma.documentAccess.create({
      data: {
        documentId: document.id,
        userId: user.id,
        role: 'OWNER',
        grantedBy: user.id
      }
    });

    // Link to tasks if provided
    if (taskIds && taskIds.length > 0) {
      await Promise.all(
        taskIds.map((taskId: string) =>
          prisma.documentLink.create({
            data: {
              documentId: document.id,
              taskId
            }
          }).catch(() => null) // Ignore errors for invalid task IDs
        )
      );
    }

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        userId: user.id,
        type: 'CREATED',
        data: JSON.stringify({ title, type })
      }
    });

    // Audit log (optional - don't fail if it doesn't exist)
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'DOCUMENT_CREATED',
          targetType: 'DOCUMENT',
          targetId: document.id,
          metadata: JSON.stringify({ spaceId: space.id, title, type })
        }
      });
    } catch (auditError) {
      // Log but don't fail document creation if audit log fails
      console.warn('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        type: document.type,
        status: document.status,
        tags: JSON.parse(document.tags),
        author: document.author,
        authorId: document.authorId,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error creating document:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to create document',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

