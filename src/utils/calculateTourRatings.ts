import { prisma } from '@/lib/prisma';

export interface RatingCalculationResult {
  ratingAverage: number | null;
  ratingCount: number | null;
}

/**
 * Pure helper — computes average and count from an in-memory array.
 * Used for lightweight calculations without a DB round-trip.
 */
export function calculateTourRatings(reviews: { rating: number }[]): RatingCalculationResult {
  if (reviews.length === 0) return { ratingAverage: 0, ratingCount: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { ratingAverage: total / reviews.length, ratingCount: reviews.length };
}

/**
 * Atomic DB helper — fetches all APPROVED reviews for a tour inside the
 * provided transaction client, computes the aggregate, and writes it back
 * to Tour.ratingAverage / Tour.ratingCount in the same transaction.
 *
 * Matches the `RatingCalculator` signature expected by moderateReview.ts:
 *   (tx, tourId) => Promise<RatingCalculationResult>
 */
export async function recalculateTourRatings(
  tx: { review: { findMany(a: object): Promise<{ rating: number }[]> }; tour: { update(a: object): Promise<unknown> } },
  tourId: string,
): Promise<RatingCalculationResult> {
  const approvedReviews = await tx.review.findMany({
    where: { tourId, status: 'APPROVED' },
    select: { rating: true },
  });

  const result = calculateTourRatings(approvedReviews);

  await tx.tour.update({
    where: { id: tourId },
    data: {
      ratingAverage: result.ratingAverage ?? 0,
      ratingCount: result.ratingCount ?? 0,
    },
  });

  return result;
}

/**
 * Standalone version (no transaction) — used for one-off recalculations.
 */
export async function recalculateTourRatingsStandalone(tourId: string): Promise<RatingCalculationResult> {
  return recalculateTourRatings(prisma as Parameters<typeof recalculateTourRatings>[0], tourId);
}
