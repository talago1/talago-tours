import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPlausibleAccessToken } from '@/utils/bookingToken';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

// Defence in depth only. The accessToken is 256 bits, so authorisation does not
// depend on this limit; it exists to blunt automated guessing of any token.
const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

const NO_STORE = { 'cache-control': 'no-store, private' };

// Only bookings that can still be completed in checkout are resumable.
const RESUMABLE_STATUSES = ['INTERESTED', 'PENDING_PAYMENT', 'PENDING'] as const;

/**
 * GET /api/public/bookings/resume?token=<accessToken>
 *
 * Returns the editable fields of an in-flight booking so the guest can
 * resume it (e.g. the checkout page prefills from it, or /booking/<token>
 * links back to checkout). This is the read side of the single-booking
 * flow: one Book click creates an INTERESTED booking, and this endpoint
 * reopens that same row.
 *
 * Authorisation is the 256-bit accessToken, and nothing else — exactly
 * like /api/public/bookings. The internal id and the human-readable
 * bookingReference are deliberately NOT accepted: the reference carries
 * only 4 random characters, so allowing it would hand out PII to anyone
 * who could enumerate it. The accessToken itself is never echoed back.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!isPlausibleAccessToken(token)) {
    return NextResponse.json(
      { error: 'Missing or invalid access token' },
      { status: 401, headers: NO_STORE },
    );
  }

  const limit = rateLimit(clientKey(request, 'bookings-resume'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { accessToken: token },
      select: {
        id: true,
        bookingReference: true,
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
        tour: {
          select: { id: true, slug: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404, headers: NO_STORE },
      );
    }

    if (!(RESUMABLE_STATUSES as readonly string[]).includes(booking.status)) {
      return NextResponse.json(
        {
          error: 'This booking can no longer be resumed.',
          code: 'NOT_RESUMABLE',
          status: booking.status,
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
        },
        { status: 409, headers: NO_STORE },
      );
    }

    // INTERESTED bookings carry placeholder contact details until the
    // guest completes checkout (see booking-interest). Do not surface
    // the synthetic guest identity as if it were the guest's own.
    const isPlaceholderIdentity =
      booking.status === 'INTERESTED' &&
      (booking.customerName === 'Guest' ||
        booking.customerEmail.endsWith('@noreply.talago.com'));

    return NextResponse.json(
      {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        tourId: booking.tour?.id ?? null,
        tourSlug: booking.tour?.slug ?? null,
        travelDate: booking.travelDate,
        adultsCount: booking.adultsCount,
        childrenCount: booking.childrenCount,
        infantsCount: booking.infantsCount,
        guestCount: booking.guestCount,
        customerName: isPlaceholderIdentity ? '' : booking.customerName,
        customerEmail: isPlaceholderIdentity ? '' : booking.customerEmail,
        customerPhone: isPlaceholderIdentity ? '' : booking.customerPhone,
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
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('[api/public/bookings/resume] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load booking' },
      { status: 500, headers: NO_STORE },
    );
  }
}
