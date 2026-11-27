import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { resolveRequestUser } from '@/server/customerSession';
import { sanitizePlain } from '@/utils/sanitize';
import { phonesEquivalent } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * POST /api/public/booking-interest/withdraw
 * Marks an INTERESTED canonical Booking as CANCELLED, preserving the record
 * and conversation history while blocking stale retries.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = sanitizePlain(body.bookingId || body.leadId, 60);
    const attemptId = sanitizePlain(body.attemptId, 100);
    const reason = sanitizePlain(body.reason, 300);

    if (!bookingId && !attemptId) {
      return NextResponse.json({ error: 'leadId or attemptId is required' }, { status: 400, headers: NO_STORE });
    }

    const session = await getSessionFromRequest(request);
    let authEmail = session?.email?.toLowerCase() || null;
    let authPhone = session?.phone || session?.telegramPhone || null;

    if (!session) {
      const auth = await resolveRequestUser(request);
      if (auth?.user?.email) authEmail = auth.user.email.toLowerCase();
      if (auth?.user?.phone) authPhone = auth.user.phone;
    }

    const chatCookie = request.cookies.get('talago_live_chat')?.value || null;

    const booking = bookingId
      ? await prisma.booking.findUnique({ where: { id: bookingId } })
      : await prisma.booking.findFirst({
          where: { idempotencyKey: attemptId },
          orderBy: { createdAt: 'desc' },
        });

    if (!booking) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: NO_STORE });
    }

    const emailMatches = Boolean(authEmail && booking.customerEmail && authEmail === booking.customerEmail.toLowerCase());
    const phoneMatches = Boolean(authPhone && booking.customerPhone && phonesEquivalent(authPhone, booking.customerPhone));
    let cookieMatches = false;
    if (!emailMatches && !phoneMatches && chatCookie) {
      const conv = await prisma.bookingConversation.findFirst({
        where: { bookingId: booking.id, visitorToken: chatCookie },
        select: { id: true },
      });
      cookieMatches = Boolean(conv);
    }

    if (!emailMatches && !phoneMatches && !cookieMatches) {
      return NextResponse.json({ error: 'Unauthorized to withdraw this request' }, { status: 403, headers: NO_STORE });
    }

    if (booking.status !== BookingStatus.INTERESTED && booking.status !== BookingStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'This request has already progressed to a booking. Please use booking cancellation instead.' },
        { status: 409, headers: NO_STORE }
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return NextResponse.json({ success: true, bookingId: booking.id, leadId: booking.id, status: booking.status }, { headers: NO_STORE });
    }

    const updatedNote = [
      booking.notes,
      `Withdrawn by customer on ${new Date().toISOString()}${reason ? `: ${reason}` : ''}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        notes: updatedNote.slice(0, 1000),
      },
    });

    const ref = updated.bookingReference;

    // Append system message to the shared BookingConversation (preserve history)
    const conversation = await prisma.bookingConversation.findUnique({
      where: { bookingId: updated.id },
      select: { id: true },
    });

    if (conversation) {
      await prisma.bookingMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'SYSTEM',
          body: `[REQUEST WITHDRAWN] Preliminary request ${ref} was withdrawn by the customer.${reason ? ` Reason: ${reason}` : ''}`,
        },
      }).catch(() => {});

      await prisma.bookingConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        bookingId: updated.id,
        leadId: updated.id,
        status: updated.status,
        reference: ref,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error('[booking-interest/withdraw] Error:', err);
    return NextResponse.json({ error: 'Failed to withdraw request' }, { status: 500, headers: NO_STORE });
  }
}
