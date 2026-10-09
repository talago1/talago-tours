import { NextRequest, NextResponse } from 'next/server';
import {
  validateReviewSubmissionPayload,
  submitVerifiedReview,
  ReviewSubmissionError,
} from '@/utils/reviewSubmission';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'reviews-submit'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();

    // Step 1: Validate input shape & business rules
    const validation = validateReviewSubmissionPayload(body);
    if (validation.error || !validation.data) {
      return NextResponse.json({ error: validation.error ?? 'Invalid input' }, { status: 400 });
    }

    // Step 2: Verify booking eligibility + persist as PENDING
    const result = await submitVerifiedReview(validation.data);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ReviewSubmissionError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[POST /api/public/reviews/submit] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
