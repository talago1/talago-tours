import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  try {
    const body = await request.json();

    // Only allow toggling isActive for now
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 422 });
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return NextResponse.json({
      data: {
        ...updated,
        discountValue: Number(updated.discountValue),
        minBookingValue: Number(updated.minBookingValue),
      },
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/campaigns/:id] error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  try {
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    console.error('[DELETE /api/admin/campaigns/:id] error:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
