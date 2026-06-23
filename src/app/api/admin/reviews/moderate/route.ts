import { NextRequest, NextResponse } from 'next/server';
import { moderateReview } from '@/utils/moderateReview';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || typeof reviewId !== 'string') {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const result = await moderateReview({ reviewId, status });

    return NextResponse.json(result);
  } catch (error: unknown) {
    // Prisma not-found
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/reviews/moderate] error:', error);
    return NextResponse.json({ error: 'Failed to moderate review' }, { status: 500 });
  }
}
