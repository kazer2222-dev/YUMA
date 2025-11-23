import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// Helper to safely access template model
function getTemplateModel() {
  // Try to access template model - it should be available after prisma generate
  const model = (prisma as any).template;
  
  if (!model) {
    // If template model is not available, try to create a new PrismaClient instance
    // This can happen if the server was started before running prisma generate
    try {
      const { PrismaClient } = require('@prisma/client');
      const freshPrisma = new PrismaClient();
      const freshModel = (freshPrisma as any).template;
      if (freshModel) {
        console.log('[Templates] Using fresh PrismaClient instance with template model');
        return freshModel;
      }
    } catch (e) {
      console.error('[Templates] Failed to create fresh PrismaClient:', e);
    }
    
    throw new Error('Prisma template model not available. Please run: npx prisma generate and restart the server.');
  }
  return model;
}

// GET - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; templateId: string } }
) {
  try {
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    const template = await getTemplateModel().findUnique({
      where: { id: params.templateId },
    });

    if (!template || template.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        fieldConfig: JSON.parse(template.fieldConfig),
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
        updatedBy: template.updatedBy,
        workflowId: template.workflowId ?? null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching template:', error);
    
    // Check if template model is missing
    if (error.message?.includes('Prisma template model not available')) {
      return NextResponse.json(
        { success: false, message: 'Database client not updated. Please run: npx prisma generate and restart the server.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: `Failed to fetch template: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; templateId: string } }
) {
  try {
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    const template = await getTemplateModel().findUnique({
      where: { id: params.templateId },
    });

    if (!template || template.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, fieldConfig } = body;

    if (!title || !fieldConfig) {
      return NextResponse.json(
        { success: false, message: 'Title and fieldConfig are required' },
        { status: 400 }
      );
    }

    // Check if template with same title already exists (excluding current template)
    if (title.trim() !== template.title) {
      const existing = await getTemplateModel().findUnique({
        where: {
          spaceId_title: {
            spaceId: space.id,
            title: title.trim(),
          },
        },
      });

      if (existing && existing.id !== params.templateId) {
        return NextResponse.json(
          { success: false, message: 'Template title must be unique within this space.' },
          { status: 400 }
        );
      }
    }

    const updated = await getTemplateModel().update({
      where: { id: params.templateId },
      data: {
        title: title.trim(),
        fieldConfig: JSON.stringify(fieldConfig),
        updatedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      template: {
        id: updated.id,
        title: updated.title,
        fieldConfig: JSON.parse(updated.fieldConfig),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        createdBy: updated.createdBy,
        updatedBy: updated.updatedBy,
        workflowId: updated.workflowId ?? null,
      },
      message: `Template '${updated.title}' updated successfully.`,
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    
    // Check if template model is missing
    if (error.message?.includes('Prisma template model not available')) {
      return NextResponse.json(
        { success: false, message: 'Database client not updated. Please run: npx prisma generate and restart the server.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Template title must be unique within this space.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: `Failed to update template: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; templateId: string } }
) {
  try {
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

    const space = await prisma.space.findUnique({
      where: { slug: params.slug },
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Check if user is member or admin
    const member = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!member && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Not a member of this space' },
        { status: 403 }
      );
    }

    const template = await getTemplateModel().findUnique({
      where: { id: params.templateId },
    });

    if (!template || template.spaceId !== space.id) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      );
    }

    await getTemplateModel().delete({
      where: { id: params.templateId },
    });

    return NextResponse.json({
      success: true,
      message: `Template '${template.title}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    
    // Check if template model is missing
    if (error.message?.includes('Prisma template model not available')) {
      return NextResponse.json(
        { success: false, message: 'Database client not updated. Please run: npx prisma generate and restart the server.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: `Failed to delete template: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

