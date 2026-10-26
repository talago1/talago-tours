/**
 * /api/admin/tours/[tourId]/availability
 *
 * Phase 6 — Structured Tour Availability
 *
 * GET    → returns { availability: TourAvailability[], scheduleRules: TourScheduleRule[] }
 * POST   → upsert a single TourAvailability date record
 * DELETE → delete one TourAvailability record by id
 *
 * Schedule rules (POST /schedule, DELETE /schedule/[id]) are handled in sub-routes
 * to keep this file focused on date-specific overrides.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { TourAvailabilitySchema } from '@/utils/tourJsonSchemas';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tourId } = params;

  const [availability, scheduleRules] = await Promise.all([
    prisma.tourAvailability.findMany({
      where: { tourId },
      orderBy: { date: 'asc' },
    }),
    prisma.tourScheduleRule.findMany({
      where: { tourId },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return NextResponse.json({ availability, scheduleRules });
}

// ─── POST — upsert one date override ────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tourId } = params;
  const body = await request.json();

  const parsed = TourAvailabilitySchema.safeParse({ ...body, tourId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { date, status, capacityOverride, adultPriceOverride, childPriceOverride, notes } =
    parsed.data;

  // Convert YYYY-MM-DD → Date at UTC midnight
  const dateObj = new Date(`${date}T00:00:00.000Z`);

  const record = await prisma.tourAvailability.upsert({
    where: { tourId_date: { tourId, date: dateObj } },
    update: { status, capacityOverride, adultPriceOverride, childPriceOverride, notes },
    create: { tourId, date: dateObj, status, capacityOverride, adultPriceOverride, childPriceOverride, notes },
  });

  return NextResponse.json({ record }, { status: 200 });
}

// ─── DELETE — remove one date override by id ─────────────────────────────────

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
    return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
  }

  await prisma.tourAvailability.deleteMany({
    where: { id, tourId }, // scope to this tour for safety
  });

  return NextResponse.json({ ok: true });
}
