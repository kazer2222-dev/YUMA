import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    if (!adminRole) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { email, name } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let targetUser = await prisma.user.findUnique({
      where: { email },
      include: { adminRole: true },
    });

    if (targetUser) {
      // User exists, check if they already have admin role
      if (targetUser.adminRole) {
        return NextResponse.json({
          success: false,
          message: 'User is already an admin',
        });
      }

      // Add admin role to existing user
      await prisma.adminRole.create({
        data: {
          userId: targetUser.id,
          role: 'ADMIN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Admin role added to existing user',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
      });
    }

    // Create new user with admin role
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        adminRole: {
          create: {
            role: 'ADMIN',
          },
        },
      },
      include: {
        adminRole: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        adminRole: newUser.adminRole,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if current user is admin
export async function GET(request: NextRequest) {
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

    const adminRole = await prisma.adminRole.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      isAdmin: !!adminRole,
      role: adminRole?.role || null,
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
















