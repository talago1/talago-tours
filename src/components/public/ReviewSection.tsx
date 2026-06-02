import ReviewStars from './ReviewStars';
import ReviewBreakdownBars from './ReviewBreakdownBars';
import VerifiedBadge from './VerifiedBadge';
import type { ReviewDistribution, ApprovedReview } from '@/types/review';

interface ReviewSectionProps {
  ratingAverage: number;
  ratingCount: number;
  distribution: ReviewDistribution[];
  reviews: ApprovedReview[];
}

export default function ReviewSection({
  ratingAverage,
  ratingCount,
  distribution,
  reviews,
}: ReviewSectionProps) {
  if (ratingCount === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">No reviews yet</h3>
        <p className="text-sm text-gray-500">
          Be the first to share your experience after taking this tour!
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-gray-900">
              {ratingAverage.toFixed(1)}
            </span>
            <div>
              <ReviewStars rating={ratingAverage} size="md" />
              <p className="mt-0.5 text-sm text-gray-500">
                Based on {ratingCount} review{ratingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ReviewBreakdownBars distribution={distribution} />
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Customer Reviews
          </h3>
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-900">
                  {review.customerName}
                </span>
                <ReviewStars rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="mb-2">
                <VerifiedBadge />
              </div>
              <p className="text-sm leading-relaxed text-gray-600">
                {review.comment}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
