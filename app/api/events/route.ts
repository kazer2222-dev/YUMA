import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      space: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    };

    if (spaceId) {
      whereClause.spaceId = spaceId;
    }

    if (startDate && endDate) {
      whereClause.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } }
          ]
        }
      ];
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      events
    });

  } catch (error) {
    console.error('Events fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    console.log('[Events API] POST request received');
    console.log('[Events API] Cookies:', request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));
    console.log('[Events API] AccessToken present:', !!accessToken);
    
    if (!accessToken) {
      console.log('[Events API] No access token found');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    console.log('[Events API] User from token:', user ? { id: user.id, email: user.email } : null);
    
    if (!user) {
      console.log('[Events API] Invalid token');
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { spaceId, title, description, startDate, endDate, allDay, location, url, participants, participantsEmails } = body;

    // Validate required fields
    if (!spaceId) {
      return NextResponse.json(
        { success: false, message: 'Space ID is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Event title is required' },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { success: false, message: 'Start date is required' },
        { status: 400 }
      );
    }

    // Check if user is admin or member of space
    const isAdmin = await AuthService.isAdmin(user.id);
    const spaceMember = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: user.id,
        role: { in: ['OWNER', 'ADMIN', 'MEMBER'] }
      }
    });

    if (!isAdmin && !spaceMember) {
      return NextResponse.json(
        { success: false, message: 'Access denied to this space' },
        { status: 403 }
      );
    }

    // Validate that space exists
    const space = await prisma.space.findUnique({
      where: { id: spaceId }
    });

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found' },
        { status: 404 }
      );
    }

    // Parse dates - for all-day events, store as UTC midnight to represent the calendar date
    let parsedStartDate: Date;
    let parsedEndDate: Date;
    
    if (allDay) {
      // For all-day events, the date string format is YYYY-MM-DDTHH:mm:ss
      // Extract the date part and create UTC midnight to represent that calendar date
      const startDateStr = startDate.split('T')[0]; // Get YYYY-MM-DD part
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      // Create as UTC midnight to represent this specific calendar date
      parsedStartDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
      
      if (endDate) {
        const endDateStr = endDate.split('T')[0]; // Get YYYY-MM-DD part
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        // Create as UTC end of day to represent this specific calendar date
        parsedEndDate = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
      } else {
        parsedEndDate = new Date(Date.UTC(startYear, startMonth - 1, startDay, 23, 59, 59, 999));
      }
    } else {
      // For timed events, parse normally
      parsedStartDate = new Date(startDate);
      parsedEndDate = endDate ? new Date(endDate) : new Date(startDate);
    }

    // Create base event
    const event = await prisma.event.create({
      data: {
        spaceId,
        creatorId: user.id,
        title: title.trim(),
        description: description || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        location: location || null,
        invitationLink: url || null,
        participants: participants && Array.isArray(participants) && participants.length > 0 ? {
          create: participants.map((userId: string) => ({ userId }))
        } : undefined
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Handle email invites by creating/connecting users then participants
    if (participantsEmails && Array.isArray(participantsEmails) && participantsEmails.length > 0) {
      const uniqueEmails = Array.from(new Set(participantsEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)));
      for (const email of uniqueEmails) {
        // Validate simple email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
        // Find or create user record
        const invitedUser = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email }
        });
        // Create participant if not already added via IDs
        await prisma.eventParticipant.upsert({
          where: { eventId_userId: { eventId: event.id, userId: invitedUser.id } },
          update: {},
          create: { eventId: event.id, userId: invitedUser.id }
        });
      }
    }

    const fullEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        space: { select: { id: true, name: true, slug: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }
      }
    });

    return NextResponse.json({
      success: true,
      event: fullEvent
    });

  } catch (error: any) {
    console.error('Event creation error:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to create event: ${error?.message || 'Unknown error'}`,
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
