import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, rememberMe } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isRememberMe = rememberMe === true;

    // Get device information from request
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const deviceInfo = `${userAgent}|${ipAddress}`.slice(0, 500);

    // Development mode: Allow fixed OTP 123456
    if (!isProduction && otp === '123456') {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Mark any existing PIN as used (cleanup)
      await prisma.pinCode.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() }
      });

      // Update user as verified
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true }
      });

      // Create personal space if needed
      const existingSpace = await prisma.spaceMember.findFirst({
        where: { userId: user.id }
      });

      if (!existingSpace) {
        const tickerBase = user.id.slice(-6).toUpperCase();
        const space = await prisma.space.create({
          data: {
            name: 'Personal',
            slug: `personal-${user.id}`,
            ticker: `P-${tickerBase}`,
            members: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            },
            settings: {
              create: {
                allowCustomFields: true,
                allowIntegrations: true,
                aiAutomationsEnabled: true
              }
            }
          }
        });

        // Initialize default roles and assign Admin to owner
        try {
          await PermissionService.initializeDefaultRoles(space.id);

          const adminRole = await PermissionService.getAdminRole(space.id);
          if (adminRole) {
            await prisma.spaceMember.update({
              where: { spaceId_userId: { spaceId: space.id, userId: user.id } },
              data: { roleId: adminRole.id }
            });
          }
        } catch (e) {
          console.error('Error initializing roles:', e);
        }
      }

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
          console.log(`[DEV MODE] Invalidated other device sessions for user: ${user.email}`);
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

      // Set cookies
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        message: 'Email verified successfully'
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

      return response;
    }

    // Production mode: Verify OTP from database
    const pinRecord = await prisma.pinCode.findFirst({
      where: {
        email,
        expiresAt: {
          gt: new Date()
        },
        usedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!pinRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check attempts
    if (pinRecord.attempts >= 5) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOtp = await bcrypt.compare(otp, pinRecord.hashedCode);

    if (!isValidOtp) {
      // Increment attempts
      await prisma.pinCode.update({
        where: { id: pinRecord.id },
        data: { attempts: pinRecord.attempts + 1 }
      });
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.pinCode.update({
      where: { id: pinRecord.id },
      data: { usedAt: new Date() }
    });

    // Find user and mark as verified
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    });

    // Create personal space for new user if they don't have one
    const existingSpace = await prisma.spaceMember.findFirst({
      where: { userId: user.id }
    });

    if (!existingSpace) {
      // Generate unique ticker from user id
      const tickerBase = user.id.slice(-6).toUpperCase();
      const space = await prisma.space.create({
        data: {
          name: 'Personal',
          slug: `personal-${user.id}`,
          ticker: `P-${tickerBase}`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          },
          settings: {
            create: {
              allowCustomFields: true,
              allowIntegrations: true,
              aiAutomationsEnabled: true
            }
          }
        }
      });

      // Initialize default roles and assign Admin to owner
      try {
        await PermissionService.initializeDefaultRoles(space.id);

        const adminRole = await PermissionService.getAdminRole(space.id);
        if (adminRole) {
          await prisma.spaceMember.update({
            where: { spaceId_userId: { spaceId: space.id, userId: user.id } },
            data: { roleId: adminRole.id }
          });
        }
      } catch (e) {
        console.error('Error initializing roles:', e);
      }
    }

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

    // Set cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      message: 'Email verified successfully'
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

    console.log('[API] Email verified for:', user.email);
    return response;
  } catch (error: any) {
    console.error('[API] Email verification error:', error);
    return NextResponse.json(
      { success: false, message: `Verification failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

