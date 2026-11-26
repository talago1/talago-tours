import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { resolveRequestUser } from '@/server/customerSession';
import { isPlausibleAccessToken } from '@/utils/bookingToken';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain } from '@/utils/sanitize';
import { phonesEquivalent } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/bookings/resume
 * Supports resuming:
 *   1. An incomplete/pending Booking via ?token=<accessToken>
 *   2. A preliminary BookingLead via ?leadId=<id> or ?attemptId=<attemptId>
 *      (requires authenticated customer session matching the lead's email/phone).
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'bookings-resume'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const leadId = sanitizePlain(searchParams.get('leadId'), 60);
  const attemptId = sanitizePlain(searchParams.get('attemptId'), 100);

  try {
    // Path 1: Resume Booking by 256-bit accessToken
    if (token) {
      if (!isPlausibleAccessToken(token)) {
        return NextResponse.json({ error: 'Missing or invalid access token' }, { status: 401, headers: NO_STORE });
      }

      const booking = await prisma.booking.findUnique({
        where: { accessToken: token },
        select: {
          id: true,
          bookingReference: true,
          idempotencyKey: true,
          status: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          hotelName: true,
          roomNumber: true,
          pickupType: true,
          pickupLocationName: true,
          pickupAddress: true,
          travelDate: true,
          guestCount: true,
          adultsCount: true,
          childrenCount: true,
          infantsCount: true,
          totalPriceUSD: true,
          currency: true,
          paymentScheme: true,
          amountPaidOnline: true,
          amountDueOnArrival: true,
          selectedPickupTime: true,
          specialRequirements: true,
          createdAt: true,
          tour: { select: { id: true, slug: true } },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: NO_STORE });
      }

      if (booking.status !== 'PENDING') {
        return NextResponse.json(
          {
            error: 'This booking can no longer be resumed.',
            code: 'NOT_RESUMABLE',
            status: booking.status,
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
          },
          { status: 409, headers: NO_STORE }
        );
      }

      return NextResponse.json(
        {
          type: 'booking',
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          attemptId: booking.idempotencyKey,
          status: booking.status,
          tourId: booking.tour?.id ?? null,
          tourSlug: booking.tour?.slug ?? null,
          travelDate: booking.travelDate,
          adultsCount: booking.adultsCount,
          childrenCount: booking.childrenCount,
          infantsCount: booking.infantsCount,
          guestCount: booking.guestCount,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          hotelName: booking.hotelName,
          roomNumber: booking.roomNumber,
          pickupType: booking.pickupType,
          pickupLocationName: booking.pickupLocationName,
          pickupAddress: booking.pickupAddress,
          selectedPickupTime: booking.selectedPickupTime,
          specialRequirements: booking.specialRequirements,
          paymentScheme: booking.paymentScheme,
          currency: booking.currency,
          totalPriceUSD: booking.totalPriceUSD,
          amountPaidOnline: booking.amountPaidOnline,
          amountDueOnArrival: booking.amountDueOnArrival,
          createdAt: booking.createdAt,
        },
        { headers: NO_STORE }
      );
    }

    // Path 2: Resume preliminary BookingLead by leadId or attemptId
    if (!leadId && !attemptId) {
      return NextResponse.json({ error: 'Missing token, leadId, or attemptId' }, { status: 400, headers: NO_STORE });
    }

    const session = await getSessionFromRequest(request);
    let authEmail = session?.email?.toLowerCase() || null;
    let authPhone = session?.phone || session?.telegramPhone || null;

    if (!session) {
      const auth = await resolveRequestUser(request);
      if (auth?.user?.email) authEmail = auth.user.email.toLowerCase();
      if (auth?.user?.phone) authPhone = auth.user.phone;
    }

    if (!authEmail && !authPhone) {
      return NextResponse.json({ error: 'Authentication required to resume request' }, { status: 401, headers: NO_STORE });
    }

    const lead = leadId
      ? await prisma.bookingLead.findUnique({ where: { id: leadId } })
      : await prisma.bookingLead.findFirst({
          where: { sessionId: attemptId },
          orderBy: { createdAt: 'desc' },
        });

    if (!lead) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: NO_STORE });
    }

    const emailMatches = Boolean(authEmail && lead.customerEmail && authEmail === lead.customerEmail.toLowerCase());
    const phoneMatches = Boolean(authPhone && lead.customerPhone && phonesEquivalent(authPhone, lead.customerPhone));

    if (!emailMatches && !phoneMatches) {
      return NextResponse.json({ error: 'Unauthorized to resume this request' }, { status: 403, headers: NO_STORE });
    }

    if (lead.status === 'ABANDONED') {
      return NextResponse.json(
        { error: 'This request was withdrawn and cannot be resumed.', code: 'REQUEST_WITHDRAWN' },
        { status: 409, headers: NO_STORE }
      );
    }

    if (lead.bookingId) {
      const existingBooking = await prisma.booking.findUnique({
        where: { id: lead.bookingId },
        select: { accessToken: true, bookingReference: true, status: true },
      });
      return NextResponse.json(
        {
          type: 'converted',
          leadId: lead.id,
          bookingId: lead.bookingId,
          bookingReference: existingBooking?.bookingReference ?? null,
          accessToken: existingBooking?.accessToken ?? null,
          status: existingBooking?.status ?? 'CONFIRMED',
        },
        { headers: NO_STORE }
      );
    }

    return NextResponse.json(
      {
        type: 'lead',
        leadId: lead.id,
        attemptId: lead.sessionId || `lead_${lead.id}`,
        reservationReference: `RES-${lead.id.slice(-8).toUpperCase()}`,
        status: lead.status,
        tourId: lead.tourId,
        tourSlug: lead.tourSlug,
        tourTitle: lead.tourTitle,
        travelDate: lead.travelDate,
        adultsCount: lead.adults,
        childrenCount: lead.children,
        infantsCount: 0,
        customerName: lead.customerName || '',
        customerEmail: lead.customerEmail && !lead.customerEmail.endsWith('@noreply.talago.com') ? lead.customerEmail : '',
        customerPhone: lead.customerPhone || '',
        notes: lead.notes || '',
        currency: lead.currency || 'USD',
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/public/bookings/resume] GET error:', error);
    return NextResponse.json({ error: 'Failed to load resumable request' }, { status: 500, headers: NO_STORE });
  }
}
