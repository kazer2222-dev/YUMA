import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/pages/[pageId]/move - Move a page to a new position
// Note: Full parent-child hierarchy will be available after schema migration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; pageId: string }> | { slug: string; pageId: string } }
) {
  try {
    const resolvedParams = await resolveParams(params);
    const { slug, pageId } = resolvedParams;
    
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
    const { newParentId, newPosition } = body;

    // Check if user is member of space
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    const isAdmin = await AuthService.isAdmin(user.id);

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get space
    const space = await prisma.space.findUnique({
      where: { slug }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Get the page to move
    const page = await prisma.document.findFirst({
      where: {
        id: pageId,
        spaceId: space.id,
        deletedAt: null,
      }
    });

    if (!page) {
      return NextResponse.json(
        { success: false, message: 'Page not found' },
        { status: 404 }
      );
    }

    const oldOrder = page.order;

    // Transaction: update order of affected pages
    await prisma.$transaction(async (tx) => {
      if (newPosition > oldOrder) {
        // Moving down - decrease order of pages between old and new
        await tx.document.updateMany({
          where: {
            spaceId: space.id,
            order: { gt: oldOrder, lte: newPosition },
            deletedAt: null,
          },
          data: {
            order: { decrement: 1 }
          }
        });
      } else if (newPosition < oldOrder) {
        // Moving up - increase order of pages between new and old
        await tx.document.updateMany({
          where: {
            spaceId: space.id,
            order: { gte: newPosition, lt: oldOrder },
            deletedAt: null,
          },
          data: {
            order: { increment: 1 }
          }
        });
      }

      // Update the page itself
      await tx.document.update({
        where: { id: pageId },
        data: {
          order: newPosition,
          updatedAt: new Date(),
        }
      });
    });

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId: pageId,
        userId: user.id,
        type: 'MOVED',
        data: JSON.stringify({
          fromOrder: oldOrder,
          toOrder: newPosition,
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Page moved successfully',
    });
  } catch (error: any) {
    console.error('Error moving page:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to move page' },
      { status: 500 }
    );
  }
}

