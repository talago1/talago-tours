import { NextRequest, NextResponse } from 'next/server';
import { getBookingByAccessToken, isPlausibleAccessToken } from '@/utils/bookingToken';
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
    const booking = await getBookingByAccessToken(token);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404, headers: NO_STORE },
      );
    }
        // Explicit field list: accessToken must never be echoed back, and anything
    // added to Booking later is opt-in rather than leaked by default.
    const {
      accessToken: _omitted,
      promoCodeId: _omittedPromo,
      customerProfileId: _omittedProfile,
      checkInLog: _omittedCheckIn,
      paymentGatewayLogs: _omittedLogs,
      ...safe
    } = booking;
    void _omitted; void _omittedPromo; void _omittedProfile; void _omittedCheckIn; void _omittedLogs;

    // Derive a simple collectionDue flag for the frontend
    const collectionDue =
      (booking.amountDueOnArrival ?? 0) > 0 &&
      booking.status !== 'CANCELLED';

    return NextResponse.json(
      { ...safe, collectionDue },
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
