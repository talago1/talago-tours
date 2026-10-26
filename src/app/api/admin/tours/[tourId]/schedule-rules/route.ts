/**
 * /api/admin/tours/[tourId]/schedule-rules
 *
 * Phase 6 — Tour Schedule Rules (recurring day-of-week patterns & blackouts)
 *
 * GET    → list all rules for a tour
 * POST   → create a new rule
 * DELETE → delete rule by ?id=
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { TourScheduleRuleSchema } from '@/utils/tourJsonSchemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rules = await prisma.tourScheduleRule.findMany({
    where: { tourId: params.tourId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ rules });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tourId } = params;
  const body = await request.json();

  const parsed = TourScheduleRuleSchema.safeParse({ ...body, tourId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { dayOfWeek, isBlackout, validFrom, validUntil, departureTime, notes } = parsed.data;

  const rule = await prisma.tourScheduleRule.create({
    data: {
      tourId,
      dayOfWeek: dayOfWeek ?? null,
      isBlackout: isBlackout ?? false,
      validFrom: validFrom ? new Date(`${validFrom}T00:00:00.000Z`) : null,
      validUntil: validUntil ? new Date(`${validUntil}T00:00:00.000Z`) : null,
      departureTime: departureTime ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tourId } = params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await prisma.tourScheduleRule.deleteMany({ where: { id, tourId } });
  return NextResponse.json({ ok: true });
}
