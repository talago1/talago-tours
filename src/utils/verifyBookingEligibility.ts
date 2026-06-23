import { prisma } from '@/lib/prisma';

export interface EligibilityResult {
  eligible: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Verifies that a booking is eligible for a review submission.
 * A booking is eligible when:
 * - It exists
 * - Its status is CONFIRMED or COMPLETED
 * - The provided tourId matches the booking's tourId
 * - No Review row already exists for this bookingId
 */
export async function verifyBookingEligibility(
  bookingId: string,
  tourId: string,
): Promise<EligibilityResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      tourId: true,
      status: true,
      reviews: { select: { id: true } },
    },
  });

  if (!booking) {
    return { eligible: false, error: 'Booking not found.', statusCode: 404 };
  }

  if (booking.tourId !== tourId) {
    return {
      eligible: false,
      error: 'The provided tourId does not match this booking.',
      statusCode: 403,
    };
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

  return { eligible: true };
}
