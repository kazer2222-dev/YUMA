import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    console.log(`[API /auth/me] Received cookies:`, {
      hasAccessToken: !!accessToken,
      cookieNames: Array.from(request.cookies.getAll().map(c => c.name)),
      allCookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value ? 'SET' : 'NOT SET' }))
    });
    
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

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isAdmin: !!adminRole,
        adminRole: adminRole?.role || null,
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

