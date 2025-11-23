import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// One-time setup endpoint to create first admin user
// Call this once: POST /api/setup/admin with { email: "admin@yuma.com", name: "Admin" }
export async function POST(request: NextRequest) {
  try {
    // Security: Only allow if no admin exists yet
    const existingAdmin = await prisma.adminRole.findFirst({});

    if (existingAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin user already exists. Use /api/admin/create-admin to create additional admins.' 
        },
        { status: 400 }
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
    let user = await prisma.user.findUnique({
      where: { email },
      include: { adminRole: true },
    });

    if (user) {
      if (user.adminRole) {
        return NextResponse.json({
          success: false,
          message: 'User is already an admin',
        });
      }

      // Add admin role
      await prisma.adminRole.create({
        data: {
          userId: user.id,
          role: 'ADMIN',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Admin role added to existing user',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
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
      instructions: {
        step1: 'Go to http://localhost:3000/auth',
        step2: `Enter email: ${email}`,
        step3: 'Check console for PIN',
        step4: 'Log in and access /admin',
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create admin user', error: String(error) },
      { status: 500 }
    );
  }
}
















