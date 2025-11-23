import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Requesting PIN for: ${email}`);
    const result = await AuthService.requestPIN(email);
    console.log(`[API] PIN request result:`, result);
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error: any) {
    console.error('[API] Auth request error:', error);
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

