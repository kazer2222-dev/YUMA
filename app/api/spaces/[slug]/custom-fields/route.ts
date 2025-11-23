import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

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

    const { slug } = params;

    // Check if user is member of space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get custom fields for the space
    const customFields = await prisma.customField.findMany({
      where: {
        space: { slug }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      customFields: customFields.map(field => ({
        id: field.id,
        name: field.name,
        key: field.key,
        type: field.type,
        options: field.options ? JSON.parse(field.options) : null,
        required: field.required,
        order: field.order,
        createdAt: field.createdAt,
        updatedAt: field.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch custom fields' },
      { status: 500 }
    );
  }
}

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

    const { slug } = params;
    const {
      name,
      key,
      type,
      options,
      required = false
    } = await request.json();

    if (!name || !key || !type) {
      return NextResponse.json(
        { success: false, message: 'Name, key, and type are required' },
        { status: 400 }
      );
    }

    // Check if user has admin/owner role in space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if key already exists in space
    const existingField = await prisma.customField.findFirst({
      where: {
        space: { slug },
        key
      }
    });

    if (existingField) {
      return NextResponse.json(
        { success: false, message: 'Field key already exists' },
        { status: 400 }
      );
    }

    // Get the next order number
    const lastField = await prisma.customField.findFirst({
      where: {
        space: { slug }
      },
      orderBy: {
        order: 'desc'
      }
    });

    const order = lastField ? lastField.order + 1 : 1;

    // Create custom field
    const customField = await prisma.customField.create({
      data: {
        space: { connect: { slug } },
        name,
        key,
        type,
        options: options ? JSON.stringify(options) : null,
        required,
        order
      }
    });

    return NextResponse.json({
      success: true,
      customField: {
        id: customField.id,
        name: customField.name,
        key: customField.key,
        type: customField.type,
        options: customField.options ? JSON.parse(customField.options) : null,
        required: customField.required,
        order: customField.order,
        createdAt: customField.createdAt,
        updatedAt: customField.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating custom field:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create custom field' },
      { status: 500 }
    );
  }
}


