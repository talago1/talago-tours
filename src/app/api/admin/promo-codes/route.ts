import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/promo-codes — list all promo codes
export async function GET() {
  try {
    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bookings: true } },
      },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error('[GET /api/admin/promo-codes]', error);
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
  }
}

// POST /api/admin/promo-codes — create a new promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      currency,
      minBookingValue,
      maxUses,
      expiresAt,
      isActive,
    } = body;

    if (!code || !discountType || discountValue === undefined || !maxUses || !expiresAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.promoCode.findFirst({
      where: { code: { equals: code.trim().toUpperCase(), mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A promo code with this name already exists' }, { status: 409 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        currency: currency || 'USD',
        minBookingValue: parseFloat(minBookingValue || 0),
        maxUses: parseInt(maxUses),
        expiresAt: new Date(expiresAt),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/promo-codes]', error);
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}
