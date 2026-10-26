import { prisma } from '@/lib/prisma';
import { isPlausibleAccessToken } from './bookingToken';

export interface EligibilityResult {
  eligible: boolean;
  error?: string;
  statusCode?: number;
  resolvedBookingId?: string;
  customerName?: string;
}

/**
 * Verifies that a booking is eligible for a review submission.
 * A booking is eligible when:
 * - It is addressed by its internal id and matching secret access token
 * - Its status is CONFIRMED or COMPLETED
 * - The provided tourId matches the booking's tourId
 * - No Review row already exists for this bookingId
 */
export async function verifyBookingEligibility(
  bookingId: string,
  tourId: string,
  bookingAccessToken: string,
): Promise<EligibilityResult> {
  if (!isPlausibleAccessToken(bookingAccessToken)) {
    return { eligible: false, error: 'A valid booking access token is required.', statusCode: 401 };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      tourId,
      accessToken: bookingAccessToken,
    },
    select: {
      id: true,
      tourId: true,
      customerName: true,
      status: true,
      reviews: { select: { id: true } },
    },
  });

  if (!booking) {
    return { eligible: false, error: 'Booking access could not be verified.', statusCode: 403 };
  }

  if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
    return {
      eligible: false,
      error: 'Only confirmed or completed bookings are eligible for reviews.',
      statusCode: 403,
    };
  }

  if (booking.reviews.length > 0) {
    return {
      eligible: false,
      error: 'This booking has already been reviewed.',
      statusCode: 409,
    };
  }

  return { eligible: true, resolvedBookingId: booking.id, customerName: booking.customerName };
}
