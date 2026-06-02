import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ReviewStatus } from '@/types/review';

export type AdminReviewStatusFilter = ReviewStatus | 'ALL';

export interface AdminReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  tourId: string;
  tourTitle: string;
}

export interface AdminReviewListResult {
  reviews: AdminReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ADMIN_REVIEW_SELECT = {
  id: true,
  customerName: true,
  rating: true,
  comment: true,
  status: true,
  createdAt: true,
  tourId: true,
  tour: {
    select: { translations: true },
  },
} satisfies Prisma.ReviewSelect;

type AdminReviewRecord = Prisma.ReviewGetPayload<{
  select: typeof ADMIN_REVIEW_SELECT;
}>;

export function parseAdminReviewStatusFilter(
  status: string | null,
): AdminReviewStatusFilter {
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    return status;
  }

  return 'ALL';
}

function getTourTitle(translations: unknown): string {
  const value = translations as Record<string, { title?: string }> | null;
  return value?.en?.title ?? 'Unknown Tour';
}

function mapAdminReview(review: AdminReviewRecord): AdminReview {
  return {
    id: review.id,
    customerName: review.customerName,
    rating: review.rating,
    comment: review.comment ?? '',
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    tourId: review.tourId,
    tourTitle: getTourTitle(review.tour.translations),
  };
}

export async function listAdminReviews({
  status,
  page,
  limit = 20,
}: {
  status: AdminReviewStatusFilter;
  page: number;
  limit?: number;
}): Promise<AdminReviewListResult> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const where: Prisma.ReviewWhereInput = status === 'ALL' ? {} : { status };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: ADMIN_REVIEW_SELECT,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews.map(mapAdminReview),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}
