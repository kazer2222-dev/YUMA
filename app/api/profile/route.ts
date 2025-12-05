import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { name, avatar } = body;

    // Validate input
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name must be a string' },
        { status: 400 }
      );
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Avatar must be a string (base64 or URL)' },
        { status: 400 }
      );
    }

    // Update user
    const updateData: { name?: string; avatar?: string } = {};
    if (name !== undefined) {
      updateData.name = name.trim() || null;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar.trim() || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}















