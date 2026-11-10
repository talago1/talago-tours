import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveRequestUser } from '@/server/customerSession';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400, headers: NO_STORE });
    }

    const { bookingReference, accessToken, reason, notes } = body;

    if (!bookingReference && !accessToken) {
      return NextResponse.json(
        { error: 'bookingReference or accessToken is required' },
        { status: 400, headers: NO_STORE }
      );
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { error: 'Please specify a reason for cancellation' },
        { status: 400, headers: NO_STORE }
      );
    }

    // 1. Locate the booking
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          ...(bookingReference ? [{ bookingReference: String(bookingReference).trim() }] : []),
          ...(accessToken ? [{ accessToken: String(accessToken).trim() }] : []),
        ],
      },
      include: {
        tour: {
          select: {
            translations: true,
            freeCancellationHours: true,
            cancellationPolicy: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: NO_STORE });
    }

    // 2. Authorize requester (either valid accessToken or logged-in owner)
    let isAuthorized = false;
    if (accessToken && booking.accessToken === accessToken.trim()) {
      isAuthorized = true;
    } else {
      const auth = await resolveRequestUser(request);
      if (auth?.user?.email) {
        const userEmail = auth.user.email.trim().toLowerCase();
        if (
          booking.customerEmail.trim().toLowerCase() === userEmail ||
          (auth.user.phone && booking.customerPhone.includes(auth.user.phone.replace(/\D/g, '')))
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this booking' },
        { status: 401, headers: NO_STORE }
      );
    }

    // 3. Status checks
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This booking is already cancelled' },
        { status: 400, headers: NO_STORE }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed booking' },
        { status: 400, headers: NO_STORE }
      );
    }

    // 4. Calculate timing and policy window
    const now = Date.now();
    const departureTime = new Date(booking.travelDate).getTime();
    const hoursRemaining = Math.max(0, (departureTime - now) / (3600 * 1000));
    const freeCancellationHours = booking.tour?.freeCancellationHours ?? 24;
    const isWithinPolicy = hoursRemaining >= freeCancellationHours;

    // 5. Store cancellation request record inside bookingAnswers
    const existingAnswers =
      typeof booking.bookingAnswers === 'object' && booking.bookingAnswers !== null
        ? { ...(booking.bookingAnswers as Record<string, any>) }
        : {};

    const cancellationRequestData = {
      requestedAt: new Date().toISOString(),
      reason: reason.trim(),
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      hoursRemaining: Math.round(hoursRemaining),
      freeCancellationHours,
      isWithinPolicy,
      status: 'PENDING_REVIEW' as const,
    };

    existingAnswers._cancellationRequest = cancellationRequestData;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        bookingAnswers: existingAnswers,
      },
    });

    // 6. Record event in dedicated LiveChatConversation for transparency
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
        const policyNote = isWithinPolicy
          ? `Eligible for Free Cancellation (${Math.round(hoursRemaining)}h remaining vs ${freeCancellationHours}h policy)`
          : `Late Cancellation Notice (${Math.round(hoursRemaining)}h remaining vs ${freeCancellationHours}h policy)`;

        await prisma.liveChatMessage.create({
          data: {
            conversationId: conv.id,
            sender: 'SYSTEM',
            body: `[CANCELLATION REQUEST] Traveler requested booking cancellation.\n• Reason: ${reason.trim()}${
              notes?.trim() ? `\n• Notes: ${notes.trim()}` : ''
            }\n• Window: ${policyNote}\n• Status: Pending Operator Review`,
          },
        });

        await prisma.liveChatConversation.update({
          where: { id: conv.id },
          data: { lastMessageAt: new Date() },
        });
      }
    } catch (chatErr) {
      console.warn('[cancel-request] chat message log failed:', chatErr);
    }

    // 7. Record NotificationLog entry for admin alerts
    try {
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          recipient: 'admin',
          channel: 'SYSTEM',
          status: 'PENDING',
          errorMessage: 'Cancellation request: ' + reason.trim() + ' (Within policy: ' + isWithinPolicy + ')',
        },
      });
    } catch {}

    return NextResponse.json(
      {
        success: true,
        cancellationRequest: cancellationRequestData,
        message: isWithinPolicy
          ? 'Your cancellation request has been submitted. It is within the free cancellation window and is being processed by operations.'
          : 'Your cancellation request has been received. Because departure is approaching, operations will review and coordinate with you.',
      },
      { headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('POST /api/public/bookings/cancel-request error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to submit cancellation request' },
      { status: 500, headers: NO_STORE }
    );
  }
}

