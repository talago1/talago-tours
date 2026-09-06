import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/promo-codes/[id] — update a promo code
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check for duplicate code (excluding current)
    if (code) {
      const existing = await prisma.promoCode.findFirst({
        where: {
          code: { equals: code.trim().toUpperCase(), mode: 'insensitive' },
          NOT: { id: params.id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: 'A promo code with this name already exists' }, { status: 409 });
      }
    }

    const updated = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.trim().toUpperCase() }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue: parseFloat(discountValue) }),
        ...(currency && { currency }),
        ...(minBookingValue !== undefined && { minBookingValue: parseFloat(minBookingValue) }),
        ...(maxUses !== undefined && { maxUses: parseInt(maxUses) }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/promo-codes/[id]]', error);
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}

// DELETE /api/admin/promo-codes/[id] — delete a promo code
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.promoCode.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/promo-codes/[id]]', error);
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
  }
}
