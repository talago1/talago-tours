import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        discountType: true,
        discountValue: true,
        currency: true,
        minBookingValue: true,
        maxUses: true,
        usedCount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Serialize Decimal fields to numbers for JSON serialization
    const serialized = campaigns.map((c) => ({
      ...c,
      discountValue: Number(c.discountValue),
      minBookingValue: Number(c.minBookingValue),
    }));

    return NextResponse.json({ campaigns: serialized });
  } catch (error) {
    console.error('[GET /api/admin/campaigns] error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
