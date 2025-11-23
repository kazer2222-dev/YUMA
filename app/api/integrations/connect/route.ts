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

    // Mock integration connection
    // In a real implementation, you would:
    // 1. Redirect to OAuth flow for the specific service
    // 2. Handle the callback and store tokens
    // 3. Set up webhooks and permissions

    const mockSettings = {
      webhookUrl: `https://api.yuma.com/webhooks/${integrationId}/${spaceSlug}`,
      permissions: ['read', 'write'],
      channels: integrationId === 'slack' ? ['#general', '#tasks'] : undefined
    };

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

    // Check if integration already exists
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        spaceId: space.id,
        type: integrationId.toUpperCase()
      }
    });

    // Store integration in database
    if (existingIntegration) {
      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          status: 'ACTIVE',
          config: JSON.stringify(mockSettings),
          lastSync: new Date()
        }
      });
    } else {
      await prisma.integration.create({
        data: {
          spaceId: space.id,
          type: integrationId.toUpperCase(),
          name: `${integrationId.charAt(0).toUpperCase() + integrationId.slice(1)} Integration`,
          status: 'ACTIVE',
          config: JSON.stringify(mockSettings),
          lastSync: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${integrationId} connected successfully`,
      settings: mockSettings
    });

  } catch (error) {
    console.error('Integration connect error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
