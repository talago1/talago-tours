import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { BOOKING_STATUS_VALUES } from '@/types/booking';
import { dispatchStatusChangeNotifications } from '@/utils/notificationDispatcher';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (!status || !BOOKING_STATUS_VALUES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${BOOKING_STATUS_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const oldStatus = booking.status;

    // Admins can set any valid status
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        updatedAt: true,
      },
    });

    // Record status transition in the booking's 1:1 BookingConversation and dispatch notifications
    if (oldStatus !== status) {
      try {
        const conv = await prisma.bookingConversation.upsert({
          where: { bookingId: booking.id },
          create: {
            bookingId: booking.id,
            visitorName: booking.customerName || undefined,
            visitorEmail: booking.customerEmail || undefined,
            visitorPhone: booking.customerPhone || undefined,
            tourTitle: booking.tourTitleSnapshot || undefined,
            lastMessageAt: new Date(),
          },
          update: {
            lastMessageAt: new Date(),
          },
          select: { id: true },
        });

        await prisma.bookingMessage.create({
          data: {
            conversationId: conv.id,
            sender: 'SYSTEM',
            body: `[STATUS UPDATE] Booking status changed from ${oldStatus} to ${status}.`,
          },
        });
      } catch (convErr) {
        console.warn('Failed to post status update message to chat:', convErr);
      }

      // Fire notifications
      dispatchStatusChangeNotifications(booking.id, oldStatus, status).catch((err) => {
        console.error('Status change notification failed:', err);
      });
    }

    revalidateTag('analytics');
    revalidateTag('bookings');

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('PATCH /api/admin/bookings/[id]/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
