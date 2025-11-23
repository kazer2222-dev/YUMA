import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { integrationId, spaceSlug } = body;

    // Get space ID from slug
    const space = await prisma.space.findUnique({
      where: { slug: spaceSlug },
      select: { id: true }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Disconnect integration
    await prisma.integration.updateMany({
      where: {
        spaceId: space.id,
        type: integrationId.toUpperCase()
      },
      data: {
        status: 'DISCONNECTED',
        lastSync: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${integrationId} disconnected successfully`
    });

  } catch (error) {
    console.error('Integration disconnect error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
