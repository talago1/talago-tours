import { prisma } from '../lib/prisma';
import {
  calculateTourRatings,
  type RatingCalculationResult,
} from './calculateTourRatings';
import type { ModerationPayload } from '../types/review';

export interface ModerationResult {
  reviewId: string;
  status: ModerationPayload['status'];
  tourId: string;
  ratingAverage: number | null;
  ratingCount: number | null;
}

interface ModerationReviewDelegate {
  findUniqueOrThrow(args: {
    where: { id: string };
    select: { status: true; tourId: true };
  }): Promise<{ status: string; tourId: string }>;
  update(args: {
    where: { id: string };
    data: { status: ModerationPayload['status'] };
    select: { id: true; status: true; tourId: true };
  }): Promise<{ id: string; status: string; tourId: string }>;
}

interface ModerationTransactionClient {
  review: ModerationReviewDelegate;
}

interface ModerationPrismaClient {
  $transaction<T>(
    fn: (tx: ModerationTransactionClient) => Promise<T>,
  ): Promise<T>;
}

type RatingCalculator = (
  tx: ModerationTransactionClient,
  tourId: string,
) => Promise<RatingCalculationResult>;

export interface ModerateReviewDependencies {
  prismaClient?: ModerationPrismaClient;
  calculateRatings?: RatingCalculator;
}

export async function moderateReview({
  reviewId,
  status,
}: ModerationPayload, dependencies: ModerateReviewDependencies = {}): Promise<ModerationResult> {
  const prismaClient = dependencies.prismaClient ?? (prisma as unknown as ModerationPrismaClient);
  const calculateRatings: RatingCalculator =
    dependencies.calculateRatings ??
    (calculateTourRatings as unknown as RatingCalculator);

  return prismaClient.$transaction(async (tx) => {
    const existing = await tx.review.findUniqueOrThrow({
      where: { id: reviewId },
      select: { status: true, tourId: true },
    });

    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { status },
      select: { id: true, status: true, tourId: true },
    });

    if (status === 'APPROVED' || existing.status === 'APPROVED') {
      const aggregates = await calculateRatings(tx, updated.tourId);
      return {
        reviewId: updated.id,
        status,
        tourId: updated.tourId,
        ...aggregates,
      };
    }

    return {
      reviewId: updated.id,
      status,
      tourId: updated.tourId,
      ratingAverage: null,
      ratingCount: null,
    };
  });
}
