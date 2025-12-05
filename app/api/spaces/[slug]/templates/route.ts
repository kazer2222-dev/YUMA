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

// GET - List all templates for a space
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const templates = await getTemplateModel().findMany({
      where: { spaceId: space.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      templates: templates.map((t: any) => ({
        id: t.id,
        title: t.title,
        fieldConfig: JSON.parse(t.fieldConfig),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        createdBy: t.createdBy,
        updatedBy: t.updatedBy,
        workflowId: t.workflowId ?? null,
        restrictAccess: t.restrictAccess ?? false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);

    // Check if template model is missing
    if (error.message?.includes('Prisma template model not available')) {
      return NextResponse.json(
        { success: false, message: 'Database client not updated. Please run: npx prisma generate and restart the server.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: `Failed to fetch templates: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST - Create a new template
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const body = await request.json();
    const { title, fieldConfig } = body;

    if (!title || !fieldConfig) {
      return NextResponse.json(
        { success: false, message: 'Title and fieldConfig are required' },
        { status: 400 }
      );
    }

    // Check if template with same title already exists
    const existing = await getTemplateModel().findUnique({
      where: {
        spaceId_title: {
          spaceId: space.id,
          title: title.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Template title must be unique within this space.' },
        { status: 400 }
      );
    }

    const template = await getTemplateModel().create({
      data: {
        spaceId: space.id,
        title: title.trim(),
        fieldConfig: JSON.stringify(fieldConfig),
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

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
      message: `Template '${template.title}' created successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });

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

    // Check if it's a table not found error (migration not run)
    if (error.message?.includes('no such table') || error.message?.includes('does not exist') || error.code === 'P2021') {
      return NextResponse.json(
        { success: false, message: 'Templates table not found. Please run: npx prisma db push' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: `Failed to create template: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

