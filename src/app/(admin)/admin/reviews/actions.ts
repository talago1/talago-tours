'use server';

import { moderateReview } from '@/utils/moderateReview';
import {
  listAdminReviews as listAdminReviewsFromService,
  type AdminReview,
  type AdminReviewListResult,
  type AdminReviewStatusFilter,
} from '@/utils/adminReviews';
import type { ReviewStatus } from '@/types/review';

export type { AdminReview };

export async function listAdminReviews(
  status: AdminReviewStatusFilter,
  page: number,
  limit = 20,
): Promise<AdminReviewListResult> {
  return listAdminReviewsFromService({ status, page, limit });
}

export async function moderateAdminReview(
  reviewId: string,
  status: Extract<ReviewStatus, 'APPROVED' | 'REJECTED'>,
): Promise<void> {
  await moderateReview({ reviewId, status });
}
