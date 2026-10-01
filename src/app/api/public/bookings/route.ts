import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

// This endpoint returns PII (name, email, phone, hotel, room, travel date) and
// is reachable with only a bookingReference, whose random part is 4 characters
// out of a 32-symbol alphabet (2^20). Without a limit the whole keyspace is
// walkable in hours. Widen the reference alphabet and require a high-entropy
// access token before this returns anything; until then this is the brake.
const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/bookings?id=<uuid>
 * Returns booking details for the public confirmation page.
 * Only exposes safe, customer-facing fields.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const ref = searchParams.get('ref'); // alternate lookup by bookingReference

  if (!id && !ref) {
    return NextResponse.json(
      { error: 'Missing id or ref parameter' },
      { status: 400, headers: NO_STORE },
    );
  }

  const limit = rateLimit(clientKey(request, 'bookings-lookup'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: id
        ? { id }
        : { bookingReference: ref! },
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
