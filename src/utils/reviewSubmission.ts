import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { ReviewSubmissionPayload } from '../types/review';
import { sanitizePlain, sanitizeText } from './sanitize';
import {
  verifyBookingEligibility,
  type EligibilityResult,
} from './verifyBookingEligibility';

export interface ValidationResult {
  data?: ReviewSubmissionPayload;
  error?: string;
}

export interface SubmittedReviewResult {
  id: string;
  status: 'PENDING';
  createdAt: string;
}

export class ReviewSubmissionError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ReviewSubmissionError';
  }
}

interface ReviewCreateDelegate {
  create(args: {
    data: Omit<ReviewSubmissionPayload, 'bookingAccessToken'> & { status: 'PENDING' };
    select: { id: true; status: true; createdAt: true };
  }): Promise<{ id: string; status: string; createdAt: Date }>;
}

export interface SubmitVerifiedReviewDependencies {
  prismaClient?: {
    review: ReviewCreateDelegate;
  };
  verifyEligibility?: (
    bookingId: string,
    tourId: string,
    bookingAccessToken: string,
  ) => Promise<EligibilityResult>;
}

export function validateReviewSubmissionPayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body is required.' };
  }

  const payload = body as Record<string, unknown>;

  if (!payload.bookingId || typeof payload.bookingId !== 'string') {
    return { error: 'bookingId is required.' };
  }

  if (!payload.bookingAccessToken || typeof payload.bookingAccessToken !== 'string') {
    return { error: 'bookingAccessToken is required.' };
  }

  if (!payload.tourId || typeof payload.tourId !== 'string') {
    return { error: 'tourId is required.' };
  }

  if (!payload.customerName || typeof payload.customerName !== 'string') {
    return { error: 'customerName is required.' };
  }

  const customerName = sanitizePlain(payload.customerName, 50);
  if (customerName.length < 2 || customerName.length > 50) {
    return { error: 'customerName must be between 2 and 50 characters.' };
  }

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'rating must be an integer between 1 and 5.' };
  }

  if (!payload.comment || typeof payload.comment !== 'string') {
    return { error: 'comment is required.' };
  }

  const comment = sanitizeText(payload.comment, 1000);
  if (comment.length < 10 || comment.length > 1000) {
    return { error: 'comment must be between 10 and 1000 characters.' };
  }

  return {
    data: {
      bookingId: payload.bookingId,
      bookingAccessToken: payload.bookingAccessToken,
      tourId: payload.tourId,
      customerName,
      rating,
      comment,
    },
  };
}

export async function submitVerifiedReview(
  payload: ReviewSubmissionPayload,
  dependencies: SubmitVerifiedReviewDependencies = {},
): Promise<SubmittedReviewResult> {
  const prismaClient = dependencies.prismaClient ?? prisma;
  const verifyEligibility = dependencies.verifyEligibility ?? verifyBookingEligibility;
  const eligibility = await verifyEligibility(payload.bookingId, payload.tourId, payload.bookingAccessToken);

  if (!eligibility.eligible) {
    throw new ReviewSubmissionError(
      eligibility.error ?? 'This booking is not eligible for review.',
      eligibility.statusCode ?? 403,
    );
  }

  const actualBookingId = eligibility.resolvedBookingId || payload.bookingId;
  const { bookingAccessToken: _bookingAccessToken, ...reviewData } = payload;

  try {
    const review = await prismaClient.review.create({
      data: {
        ...reviewData,
        bookingId: actualBookingId,
        // The public display name belongs to the verified booking, not a
        // browser-provided identity claim.
        customerName: eligibility.customerName ?? payload.customerName,
        status: 'PENDING',
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      id: review.id,
      status: 'PENDING',
      createdAt: review.createdAt.toISOString(),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ReviewSubmissionError(
        'This booking has already been reviewed.',
        409,
      );
    }

    throw err;
  }
}
