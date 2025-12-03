import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/pages/tree-state - Save user's expanded/collapsed state
// Note: UserTreeState model will be available after schema migration
// For now, we store state client-side in localStorage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const { slug } = await resolveParams(params);
    
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

    // Tree state persistence will be enabled after schema migration
    // For now, client stores state in localStorage
    return NextResponse.json({
      success: true,
      message: 'Tree state acknowledged (client-side storage)',
    });
  } catch (error: any) {
    console.error('Error saving tree state:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save tree state' },
      { status: 500 }
    );
  }
}

// PUT /api/spaces/[slug]/pages/tree-state - Batch update tree states
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const { slug } = await resolveParams(params);
    
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

    // Tree state persistence will be enabled after schema migration
    // For now, client stores state in localStorage
    return NextResponse.json({
      success: true,
      message: 'Tree states acknowledged (client-side storage)',
    });
  } catch (error: any) {
    console.error('Error saving tree states:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save tree states' },
      { status: 500 }
    );
  }
}

