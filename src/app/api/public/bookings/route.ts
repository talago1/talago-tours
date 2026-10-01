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

/**
 * GET /api/public/bookings?token=<accessToken>
 * Returns booking details for the public confirmation page.
 *
 * Authorisation is the 256-bit accessToken, and nothing else. The internal id
 * and the human-readable bookingReference are deliberately NOT accepted: the
 * reference carries only 4 random characters, so allowing it would hand out
 * PII to anyone who could enumerate it.
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

  const limit = rateLimit(clientKey(request, 'bookings-lookup'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    // Explicit allowlist, not "the whole row minus the sensitive bits". A
    // denylist silently starts leaking the moment a column is added to Booking
    // (admin notes, cancellation reason, ...), and this response is customer PII.
    // accessToken is therefore not selected at all, so it cannot be echoed back.
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
        pickupDirectives: true,
        selectedPickupTime: true,
        specialRequirements: true,
        createdAt: true,
        tour: {
          select: {
            id: true,
            slug: true,
            translations: true,
            coverImage: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            provider: true,
            gatewayReference: true,
            amountPaidOnline: true,
            amountDueOnArrival: true,
            scheme: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404, headers: NO_STORE },
      );
    }

    // Derive a simple collectionDue flag for the frontend
    const collectionDue =
      (booking.amountDueOnArrival ?? 0) > 0 &&
      booking.status !== 'CANCELLED';

    return NextResponse.json(
      { ...booking, collectionDue },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('[api/public/bookings] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load booking' },
      { status: 500, headers: NO_STORE },
    );
  }
}
