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

    // Path 2: Resume an INTERESTED/PENDING canonical Booking by id (leadId) or idempotencyKey (attemptId)
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

    const booking = leadId
      ? await prisma.booking.findUnique({
          where: { id: leadId },
          include: { tour: { select: { id: true, slug: true, translations: true } } },
        })
      : await prisma.booking.findFirst({
          where: { idempotencyKey: attemptId },
          orderBy: { createdAt: 'desc' },
          include: { tour: { select: { id: true, slug: true, translations: true } } },
        });

    if (!booking) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: NO_STORE });
    }

    const emailMatches = Boolean(authEmail && booking.customerEmail && authEmail === booking.customerEmail.toLowerCase());
    const phoneMatches = Boolean(authPhone && booking.customerPhone && phonesEquivalent(authPhone, booking.customerPhone));

    if (!emailMatches && !phoneMatches) {
      return NextResponse.json({ error: 'Unauthorized to resume this request' }, { status: 403, headers: NO_STORE });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'This request was withdrawn and cannot be resumed.', code: 'REQUEST_WITHDRAWN' },
        { status: 409, headers: NO_STORE }
      );
    }

    if (booking.status !== 'INTERESTED' && booking.status !== 'PENDING') {
      return NextResponse.json(
        {
          type: 'converted',
          leadId: booking.id,
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          accessToken: booking.accessToken,
          status: booking.status,
        },
        { headers: NO_STORE }
      );
    }

    const tMap = booking.tour?.translations as Record<string, { title?: string }> | null;
    return NextResponse.json(
      {
        type: 'lead',
        leadId: booking.id,
        bookingId: booking.id,
        attemptId: booking.idempotencyKey || `lead_${booking.id}`,
        reservationReference: booking.bookingReference,
        status: booking.status,
        tourId: booking.tourId,
        tourSlug: booking.tour?.slug ?? booking.tourSlugSnapshot,
        tourTitle: booking.tourTitleSnapshot || tMap?.en?.title || booking.tour?.slug || 'Tour',
        travelDate: booking.travelDate.toISOString().split('T')[0],
        adultsCount: booking.adultsCount || 1,
        childrenCount: booking.childrenCount || 0,
        infantsCount: booking.infantsCount || 0,
        customerName: booking.customerName || '',
        customerEmail: booking.customerEmail && !booking.customerEmail.endsWith('@noreply.talago.com') ? booking.customerEmail : '',
        customerPhone: booking.customerPhone || '',
        notes: booking.notes || '',
        currency: booking.currency || 'USD',
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/public/bookings/resume] GET error:', error);
    return NextResponse.json({ error: 'Failed to load resumable request' }, { status: 500, headers: NO_STORE });
  }
}
