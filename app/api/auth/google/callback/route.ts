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
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          avatar: googleUser.picture,
          emailVerified: true,
        }
      });

      // Create personal space for new user with unique ticker
      const tickerBase = user.id.slice(-6).toUpperCase();
      await prisma.space.create({
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

    // Clear oauth state and rememberMe cookies
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_remember_me');

    // Set remember me flag if it was set (we'll check this on client side)
    // The client will check sessionStorage for 'yuma_remember_me' and save user info
    // We can't access sessionStorage from server, so we'll handle it client-side

    console.log('[Google OAuth] Authentication successful for:', user.email);
    return response;
  } catch (error: any) {
    console.error('[Google OAuth] Error:', error);
    return NextResponse.redirect(new URL('/auth?error=internal_error', request.url));
  }
}

