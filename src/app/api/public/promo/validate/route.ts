import { NextRequest, NextResponse } from 'next/server';
import { validatePromoConstraints } from '@/utils/promo';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
