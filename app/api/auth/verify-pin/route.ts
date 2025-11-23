import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json();

    console.log(`[API] Verifying PIN for: ${email}, PIN: ${pin}`);

    if (!email || !pin) {
      return NextResponse.json(
        { success: false, message: 'Email and PIN are required' },
        { status: 400 }
      );
    }

    const result = await AuthService.verifyPIN(email, pin);
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
      
      response.cookies.set('accessToken', result.session.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 // 15 minutes
      });

      response.cookies.set('refreshToken', result.session.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days
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
