import { NextRequest, NextResponse } from 'next/server';
import { BookingMessageSender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bookings/[id]/messages
 * Loads the 1:1 BookingConversation and its messages for a canonical Booking,
 * marking unread VISITOR messages as read by admin.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        tourTitleSnapshot: true,
        status: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const conv = await prisma.bookingConversation.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        visitorName: booking.customerName || undefined,
        visitorEmail: booking.customerEmail || undefined,
        visitorPhone: booking.customerPhone || undefined,
        tourTitle: booking.tourTitleSnapshot || undefined,
      },
      update: {},
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    });

    // Mark unread visitor messages and booking-scoped admin notifications as read
    await Promise.all([
      prisma.bookingMessage.updateMany({
        where: {
          conversationId: conv.id,
          sender: BookingMessageSender.VISITOR,
          readAt: null,
        },
        data: { readAt: new Date() },
      }),
      prisma.notificationLog.updateMany({
        where: {
          bookingId: { in: [booking.id, conv.id] },
          channel: { in: ['CUSTOMER_MESSAGE_ALERT', 'NEW_BOOKING_ALERT', 'LEAD_INTEREST_ALERT'] },
          status: { in: ['UNREAD', 'LOGGED'] },
        },
        data: { status: 'READ' },
      }),
    ]).catch(() => {});

    const messages = conv.messages.map((m) => ({
      id: m.id,
      body: m.body,
      text: m.body,
      sender: m.sender,
      senderRole: m.sender,
      attachmentUrl: m.attachmentUrl ?? null,
      readAt: m.readAt,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      conversation: {
        id: conv.id,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status: conv.status,
      },
      messages,
    });
  } catch (error) {
    console.error('GET /api/admin/bookings/[id]/messages error:', error);
    return NextResponse.json({ error: 'Failed to load booking conversation' }, { status: 500 });
  }
}

/**
 * POST /api/admin/bookings/[id]/messages
 * Sends an ADMIN reply in the canonical Booking's 1:1 conversation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = sanitizeText(body.text || body.body, 2000);
    if (!text) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        tourTitleSnapshot: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const conv = await prisma.bookingConversation.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        visitorName: booking.customerName || undefined,
        visitorEmail: booking.customerEmail || undefined,
        visitorPhone: booking.customerPhone || undefined,
        tourTitle: booking.tourTitleSnapshot || undefined,
      },
      update: {
        lastMessageAt: new Date(),
        status: 'OPEN',
      },
      select: { id: true },
    });

    const msg = await prisma.bookingMessage.create({
      data: {
        conversationId: conv.id,
        sender: BookingMessageSender.ADMIN,
        body: text,
      },
    });

    await prisma.bookingConversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date(), status: 'OPEN' },
    });

    return NextResponse.json(
      {
        message: {
          id: msg.id,
          body: msg.body,
          text: msg.body,
          sender: msg.sender,
          senderRole: msg.sender,
          createdAt: msg.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/bookings/[id]/messages error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
