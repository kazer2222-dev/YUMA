import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const isCreator = event.creatorId === user.id;

    // Allow update if creator or admin or space member with elevated rights
    let hasAccess = isAdmin || isCreator;
    if (!hasAccess) {
      const membership = await prisma.spaceMember.findFirst({ where: { spaceId: event.spaceId!, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } } });
      hasAccess = !!membership;
    }
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      url,
      spaceId,
      participants,
      participantsEmails,
    } = body;

    // Handle date conversion for all-day events
    let startDateTime: Date;
    let endDateTime: Date;

    if (allDay) {
      // For all-day events, store as UTC midnight to represent the calendar date
      const startDateStr = startDate.split('T')[0]; // Get YYYY-MM-DD part
      const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
      // Create as UTC midnight to represent this specific calendar date
      startDateTime = new Date(Date.UTC(startYear, startMonth - 1, startDay, 0, 0, 0, 0));
      
      const endDateStr = endDate.split('T')[0]; // Get YYYY-MM-DD part
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
      // Create as UTC end of day to represent this specific calendar date
      endDateTime = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
    } else {
      // For timed events, parse normally
      startDateTime = new Date(startDate);
      endDateTime = new Date(endDate);
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        title,
        description: description || null,
        startDate: startDateTime,
        endDate: endDateTime,
        location: location || null,
        invitationLink: url || null,
        spaceId: spaceId || event.spaceId,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        space: true,
      },
    });

    // Handle participants
    if (participants || participantsEmails) {
      // Delete existing participants
      await prisma.eventParticipant.deleteMany({ where: { eventId: params.eventId } });

      // Add new participants
      const participantIds = participants || [];
      const participantEmails = participantsEmails || [];

      // Add participants by ID
      if (participantIds.length > 0) {
        await prisma.eventParticipant.createMany({
          data: participantIds.map((userId: string) => ({
            eventId: params.eventId,
            userId,
          })),
        });
      }

      // Handle email participants - create users if needed
      if (participantEmails.length > 0) {
        for (const email of participantEmails) {
          let participantUser = await prisma.user.findUnique({ where: { email } });
          if (!participantUser) {
            // Create user if doesn't exist
            participantUser = await prisma.user.create({
              data: {
                email,
                name: email.split('@')[0],
              },
            });
          }
          await prisma.eventParticipant.create({
            data: {
              eventId: params.eventId,
              userId: participantUser.id,
            },
          });
        }
      }
    }

    // Fetch updated event with all relations
    const finalEvent = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        space: true,
      },
    });

    return NextResponse.json({ success: true, event: finalEvent });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const isCreator = event.creatorId === user.id;

    // Allow delete if creator or admin or space member with elevated rights
    let hasAccess = isAdmin || isCreator;
    if (!hasAccess) {
      const membership = await prisma.spaceMember.findFirst({ where: { spaceId: event.spaceId!, userId: user.id, role: { in: ['OWNER', 'ADMIN'] } } });
      hasAccess = !!membership;
    }
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Delete participants then event (cascade may handle, but explicit is safe for SQLite)
    await prisma.eventParticipant.deleteMany({ where: { eventId: params.eventId } });
    await prisma.event.delete({ where: { id: params.eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event delete error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete event' }, { status: 500 });
  }
}













