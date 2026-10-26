export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];

export interface ReviewData {
  id: string;
  bookingId: string;
  tourId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSubmissionPayload {
  bookingId: string;
  bookingAccessToken: string;
  tourId: string;
  customerName: string;
  rating: number;
  comment: string;
}

export interface ModerationPayload {
  reviewId: string;
  status: Extract<ReviewStatus, 'APPROVED' | 'REJECTED'>;
}

export interface ReviewDistribution {
  star: number;
  count: number;
  percentage: number;
}

export interface ApprovedReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
