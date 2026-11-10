import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatchStatusChangeNotifications } from '@/utils/notificationDispatcher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => null);
    const action = body?.action; // 'APPROVE' | 'DECLINE'
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : null;

    if (action !== 'APPROVE' && action !== 'DECLINE') {
      return NextResponse.json(
        { error: 'action must be either APPROVE or DECLINE' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const existingAnswers =
      typeof booking.bookingAnswers === 'object' && booking.bookingAnswers !== null
        ? { ...(booking.bookingAnswers as Record<string, any>) }
        : {};

    const reqData = existingAnswers._cancellationRequest || {};
    const oldStatus = booking.status;

    if (action === 'APPROVE') {
      existingAnswers._cancellationRequest = {
        ...reqData,
        status: 'APPROVED',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes,
      };

      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          bookingAnswers: existingAnswers,
        },
      });

      // Post in live chat
      try {
        const conv = await prisma.liveChatConversation.findFirst({
          where: {
            OR: [
              { bookingReference: booking.bookingReference },
              { visitorToken: `booking:${booking.bookingReference}` },
              { bookingId: booking.id },
            ],
          },
        });

        if (conv) {
          await prisma.liveChatMessage.create({
            data: {
              conversationId: conv.id,
              sender: 'SYSTEM',
              body: `[CANCELLATION APPROVED] The cancellation request was approved by the operations team. Booking reference ${booking.bookingReference} has been CANCELLED.${
                notes ? `\nNote: ${notes}` : ''
              }`,
            },
          });
          await prisma.liveChatConversation.update({
            where: { id: conv.id },
            data: { lastMessageAt: new Date() },
          });
        }
      } catch (convErr) {
        console.warn('Failed to post cancellation approval to chat:', convErr);
      }

      // Fire notifications
      dispatchStatusChangeNotifications(booking.id, oldStatus, 'CANCELLED').catch((err) => {
        console.error('Status change notification failed:', err);
      });

      return NextResponse.json({ success: true, booking: updated });
    } else {
      // DECLINE
      existingAnswers._cancellationRequest = {
        ...reqData,
        status: 'DECLINED',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes,
      };

      const updated = await prisma.booking.update({
        where: { id: params.id },
        data: {
          bookingAnswers: existingAnswers,
        },
      });

      // Post in live chat
      try {
        const conv = await prisma.liveChatConversation.findFirst({
          where: {
            OR: [
              { bookingReference: booking.bookingReference },
              { visitorToken: `booking:${booking.bookingReference}` },
              { bookingId: booking.id },
            ],
          },
        });

        if (conv) {
          await prisma.liveChatMessage.create({
            data: {
              conversationId: conv.id,
              sender: 'SYSTEM',
              body: `[CANCELLATION REVIEW] The cancellation request was reviewed and could not be approved per policy.${
                notes ? `\nDetails: ${notes}` : ''
              }\nYour booking remains confirmed. Please reach out via WhatsApp concierge for further assistance.`,
            },
          });
          await prisma.liveChatConversation.update({
            where: { id: conv.id },
            data: { lastMessageAt: new Date() },
          });
        }
      } catch (convErr) {
        console.warn('Failed to post cancellation decline to chat:', convErr);
      }

      return NextResponse.json({ success: true, booking: updated });
    }
  } catch (error) {
    console.error('POST /api/admin/bookings/[id]/cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

