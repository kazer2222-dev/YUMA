import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has a password (might have signed up with Google)
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'This account uses Google Sign-In. Please sign in with Google.' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email first', requiresVerification: true },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get device information
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const deviceInfo = `${userAgent}|${ipAddress}`.slice(0, 500);
    const isRememberMe = rememberMe === true;

    // Generate tokens
    const { accessToken, refreshToken } = AuthService.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name || undefined
    });

    // If remember me is enabled, invalidate sessions from other devices
    if (isRememberMe) {
      try {
        await prisma.session.deleteMany({
          where: {
            userId: user.id,
            deviceInfo: {
              not: deviceInfo
            }
          }
        });
        console.log(`Invalidated other device sessions for user: ${user.email}`);
      } catch (e) {
        console.error('Error invalidating other sessions:', e);
      }
    }

    // Session expiration: 30 days if remember me, otherwise 7 days
    const sessionExpiration = isRememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        deviceInfo,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiration,
        lastActiveAt: new Date()
      }
    });

    // Set cookies and return response
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      message: 'Login successful'
    });

    // If remember me: use persistent cookies (30 days)
    // If not remember me: use session cookies (expire when browser closes)
    const accessTokenMaxAge = isRememberMe ? 30 * 24 * 60 * 60 : undefined;
    const refreshTokenMaxAge = isRememberMe ? 30 * 24 * 60 * 60 : undefined;

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      ...(accessTokenMaxAge ? { maxAge: accessTokenMaxAge } : {}),
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      ...(refreshTokenMaxAge ? { maxAge: refreshTokenMaxAge } : {}),
    });

    console.log('[API] Login successful for:', user.email);
    return response;
  } catch (error: any) {
    console.error('[API] Login error:', error);
    return NextResponse.json(
      { success: false, message: `Login failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}







