import { NextRequest, NextResponse } from 'next/server';
import { validatePromoConstraints } from '@/utils/promo';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

// 20 promo validations per IP per 10 minutes — generous to allow normal checkout
// flows but still blocks automated code-guessing attacks.
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'promo-validate'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const { code, bookingValue, currency } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const result = await validatePromoConstraints(code, {
      bookingValue: typeof bookingValue === 'number' ? bookingValue : undefined,
      currency: typeof currency === 'string' ? currency : undefined,
    });

    if (!result.valid) {
      return NextResponse.json({ error: result.message, code: result.error }, { status: 400 });
    }

    return NextResponse.json(result.discount, { status: 200 });
  } catch (error) {
    console.error('[POST /api/public/promo/validate] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
