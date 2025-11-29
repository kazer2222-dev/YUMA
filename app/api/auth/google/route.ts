import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
  
  // Get rememberMe from query params (set by client before redirect)
  const rememberMe = request.nextUrl.searchParams.get('rememberMe') === 'true';
  
  // Debug logging (remove in production)
  if (!clientId) {
    console.error('[Google OAuth] Missing GOOGLE_CLIENT_ID');
    console.error('[Google OAuth] Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
    console.error('[Google OAuth] GOOGLE_CLIENT_ID value:', process.env.GOOGLE_CLIENT_ID);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Google OAuth is not configured',
        debug: process.env.NODE_ENV === 'development' ? {
          hasClientId: !!clientId,
          availableGoogleVars: Object.keys(process.env).filter(k => k.includes('GOOGLE')),
        } : undefined
      },
      { status: 500 }
    );
  }

  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).substring(7);
  
  // Store state and rememberMe in cookie for verification
  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`
  );
  
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10 // 10 minutes
  });

  // Store rememberMe preference
  if (rememberMe) {
    response.cookies.set('oauth_remember_me', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10 // 10 minutes (same as oauth_state)
    });
  }

  return response;
}

