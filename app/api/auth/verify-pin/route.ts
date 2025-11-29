import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, pin, rememberMe } = await request.json();

    console.log(`[API] Verifying PIN for: ${email}, PIN: ${pin}, rememberMe: ${rememberMe}`);

    if (!email || !pin) {
      return NextResponse.json(
        { success: false, message: 'Email and PIN are required' },
        { status: 400 }
      );
    }

    // Get device information from request
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    // Generate device fingerprint from user agent and other headers
    const deviceInfo = `${userAgent}|${ipAddress}`.slice(0, 500); // Limit length

    const result = await AuthService.verifyPIN(email, pin, {
      rememberMe: rememberMe === true,
      deviceInfo,
      userAgent,
      ipAddress,
    });
    console.log(`[API] PIN verification result:`, { 
      success: result.success, 
      message: result.message,
      hasSession: !!result.session 
    });
    
    if (result.success && result.session) {
      // Set HTTP-only cookies for security
      const response = NextResponse.json({
        success: true,
        user: result.session.user,
        message: result.message
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const isRememberMe = rememberMe === true;
      
      // If remember me: use persistent cookies (30 days)
      // If not remember me: use session cookies (expire when browser closes)
      const accessTokenMaxAge = isRememberMe ? 30 * 24 * 60 * 60 : undefined; // 30 days or session
      const refreshTokenMaxAge = isRememberMe ? 30 * 24 * 60 * 60 : undefined; // 30 days or session
      
      response.cookies.set('accessToken', result.session.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        ...(accessTokenMaxAge ? { maxAge: accessTokenMaxAge } : {}), // Session cookie if no maxAge
      });

      response.cookies.set('refreshToken', result.session.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        ...(refreshTokenMaxAge ? { maxAge: refreshTokenMaxAge } : {}), // Session cookie if no maxAge
      });

      console.log(`[API] Cookies set for: ${email}`);
      console.log(`[API] AccessToken cookie: ${response.cookies.get('accessToken')?.value ? 'SET' : 'NOT SET'}`);
      console.log(`[API] RefreshToken cookie: ${response.cookies.get('refreshToken')?.value ? 'SET' : 'NOT SET'}`);
      
      console.log(`[API] Authentication successful for: ${email}`);
      return response;
    }

    console.log(`[API] Authentication failed: ${result.message}`);
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error: any) {
    console.error('[API] Auth verify error:', error);
    console.error('[API] Error stack:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error?.message || 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
