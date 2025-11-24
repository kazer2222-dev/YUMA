import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/documents/upload - Upload file
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const taskIds = formData.get('taskIds') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine file type
    const mimeType = file.type;
    let documentType = 'TXT';
    if (mimeType === 'application/pdf') documentType = 'PDF';
    else if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) documentType = 'DOCX';
    else if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) documentType = 'XLSX';
    else if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) documentType = 'PPTX';
    else if (mimeType.startsWith('image/')) documentType = 'IMAGE';
    else if (mimeType.includes('zip') || mimeType.includes('archive')) documentType = 'ARCHIVE';

    // In production, upload to S3 or similar storage
    // For now, we'll store a placeholder URL
    // In a real implementation, you would:
    // 1. Upload file to S3/storage
    // 2. Get the URL
    // 3. Store metadata in database
    
    const fileUrl = `/uploads/${space.id}/${Date.now()}-${file.name}`;
    const fileSize = file.size;

    // Create document
    const document = await prisma.document.create({
      data: {
        spaceId: space.id,
        title: title || file.name,
        description: description || null,
        type: documentType,
        fileUrl,
        fileSize,
        mimeType,
        authorId: user.id,
        status: 'DRAFT',
        tags: JSON.stringify([])
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
        fileUrl,
        fileSize,
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
    if (taskIds) {
      const taskIdArray = JSON.parse(taskIds);
      if (Array.isArray(taskIdArray)) {
        await Promise.all(
          taskIdArray.map((taskId: string) =>
            prisma.documentLink.create({
              data: {
                documentId: document.id,
                taskId
              }
            }).catch(() => null)
          )
        );
      }
    }

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId: document.id,
        userId: user.id,
        type: 'CREATED',
        data: JSON.stringify({ title: document.title, type: documentType, uploaded: true })
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DOCUMENT_UPLOADED',
        targetType: 'DOCUMENT',
        targetId: document.id,
        metadata: JSON.stringify({ spaceId: space.id, filename: file.name, size: fileSize })
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        type: document.type,
        status: document.status,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        author: document.author,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

