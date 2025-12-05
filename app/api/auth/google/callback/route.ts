import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Get stored state from cookie
    const storedState = request.cookies.get('oauth_state')?.value;

    if (error) {
      console.error('[Google OAuth] Error from Google:', error);
      return NextResponse.redirect(new URL('/auth?error=google_auth_failed', request.url));
    }

    if (!code) {
      console.error('[Google OAuth] No code received');
      return NextResponse.redirect(new URL('/auth?error=no_code', request.url));
    }

    if (!state || state !== storedState) {
      console.error('[Google OAuth] State mismatch');
      return NextResponse.redirect(new URL('/auth?error=state_mismatch', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth] Missing credentials');
      return NextResponse.redirect(new URL('/auth?error=config_error', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/auth?error=token_exchange_failed', request.url));
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('[Google OAuth] Failed to get user info');
      return NextResponse.redirect(new URL('/auth?error=user_info_failed', request.url));
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    console.log('[Google OAuth] User info:', { email: googleUser.email, name: googleUser.name });

    // Get auth mode from cookie (signin or signup)
    const authMode = request.cookies.get('oauth_mode')?.value || 'signin';
    console.log('[Google OAuth] Auth mode:', authMode);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email }
        ]
      }
    });

    if (user) {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.id,
            emailVerified: true,
            name: user.name || googleUser.name,
            avatar: user.avatar || googleUser.picture,
          }
        });
      }
    } else {
      // User not found
      if (authMode === 'signup') {
        // Create new user for signup flow
        console.log('[Google OAuth] Creating new user for signup:', googleUser.email);
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
            googleId: googleUser.id,
            emailVerified: true,
          }
        });
        console.log('[Google OAuth] New user created:', user.id);
      } else {
        // Sign-in mode: do not create new account automatically
        console.log('[Google OAuth] User not found, preventing auto-registration:', googleUser.email);
        return NextResponse.redirect(new URL('/auth?mode=signup&error=account_not_found', request.url));
      }
    }

    // Check if user has any space (recovery for failed previous attempts)
    const spaceCount = await prisma.space.count({
      where: { members: { some: { userId: user.id } } }
    });

    if (spaceCount === 0) {
      console.log('[Google OAuth] User has no spaces, creating personal space...');
      // Create personal space for new user with unique ticker
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
          roles: {
            create: [
              {
                name: 'Admin',
                description: 'Full access to all space features and settings',
                isDefault: true,
                isSystem: true,
                permissions: {
                  create: [
                    { permissionKey: 'manage_space', granted: true },
                    { permissionKey: 'manage_members', granted: true },
                    { permissionKey: 'manage_roles', granted: true },
                    { permissionKey: 'create_tasks', granted: true },
                    { permissionKey: 'edit_tasks', granted: true },
                    { permissionKey: 'delete_tasks', granted: true },
                    { permissionKey: 'view_space', granted: true },
                    { permissionKey: 'view_regress', granted: true },
                    { permissionKey: 'create_test_cases', granted: true },
                    { permissionKey: 'edit_test_cases', granted: true },
                    { permissionKey: 'execute_tests', granted: true },
                    { permissionKey: 'override_priority', granted: true },
                    { permissionKey: 'run_regression_suite', granted: true },
                    { permissionKey: 'delete_test_results', granted: true },
                    { permissionKey: 'view_reports', granted: true },
                    { permissionKey: 'export_data', granted: true },
                  ]
                }
              },
              {
                name: 'Member',
                description: 'Can create and edit content, but cannot manage settings',
                isDefault: true,
                isSystem: true,
                permissions: {
                  create: [
                    { permissionKey: 'view_space', granted: true },
                    { permissionKey: 'create_tasks', granted: true },
                    { permissionKey: 'edit_tasks', granted: true },
                    { permissionKey: 'view_regress', granted: true },
                    { permissionKey: 'create_test_cases', granted: true },
                    { permissionKey: 'edit_test_cases', granted: true },
                    { permissionKey: 'execute_tests', granted: true },
                    { permissionKey: 'view_reports', granted: true },
                  ]
                }
              },
              {
                name: 'Viewer',
                description: 'Read-only access to space content',
                isDefault: true,
                isSystem: true,
                permissions: {
                  create: [
                    { permissionKey: 'view_space', granted: true },
                    { permissionKey: 'view_regress', granted: true },
                    { permissionKey: 'view_reports', granted: true },
                  ]
                }
              }
            ]
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

      // Assign Admin role to the owner
      const adminRole = await prisma.spaceRole.findFirst({
        where: { spaceId: space.id, name: 'Admin' }
      });

      if (adminRole) {
        await prisma.spaceMember.update({
          where: {
            spaceId_userId: {
              spaceId: space.id,
              userId: user.id
            }
          },
          data: { roleId: adminRole.id }
        });
      }
    }

    // Get device information
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const deviceInfo = `${userAgent}|${ipAddress}`.slice(0, 500);

    // Check if remember me was set (stored in cookie before OAuth redirect)
    const rememberMeCookie = request.cookies.get('oauth_remember_me')?.value;
    const isRememberMe = rememberMeCookie === 'true';

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

    // Redirect to home with cookies set
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.redirect(new URL('/home', request.url));

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

    // Clear oauth state, rememberMe, and mode cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_remember_me');
    response.cookies.delete('oauth_mode');

    // Set remember me flag if it was set (we'll check this on client side)
    // The client will check sessionStorage for 'yuma_remember_me' and save user info
    // We can't access sessionStorage from server, so we'll handle it client-side

    console.log('[Google OAuth] Authentication successful for:', user.email);
    return response;
  } catch (error: any) {
    console.error('[Google OAuth] Error:', error);
    console.error('[Google OAuth] Error stack:', error?.stack);
    // Log specific Prisma errors if available
    if (error?.code) {
      console.error('[Google OAuth] Prisma Error Code:', error.code);
      console.error('[Google OAuth] Prisma Error Meta:', error.meta);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const encodedError = encodeURIComponent(errorMessage);
    return NextResponse.redirect(new URL(`/auth?error=internal_error&details=${encodedError}`, request.url));
  }
}

