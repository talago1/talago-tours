export interface RatingCalculationResult {
  ratingAverage: number | null;
  ratingCount: number | null;
}

export function calculateTourRatings(reviews: { rating: number }[]): RatingCalculationResult {
  if (reviews.length === 0) return { ratingAverage: 0, ratingCount: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { ratingAverage: total / reviews.length, ratingCount: reviews.length };
}
