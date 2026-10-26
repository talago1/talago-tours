/**
 * /api/public/tours/[tourId]/availability?month=YYYY-MM
 *
 * Public endpoint — returns availability status for each day of the requested
 * month, merging:
 *   1. TourAvailability date-specific overrides
 *   2. TourScheduleRule recurring day-of-week patterns
 *   3. Real-time capacity from confirmed + pending bookings
 *
 * Response shape:
 * {
 *   "2025-03-15": { status: "AVAILABLE", remaining: 8, adultPrice: 45 },
 *   "2025-03-16": { status: "SOLD_OUT",  remaining: 0 },
 *   ...
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PENDING_STATUSES = ['PENDING', 'DEPOSIT_PAID'];
const CONFIRMED_STATUSES = ['CONFIRMED', 'PAID'];

export async function GET(
  _request: NextRequest,
  { params }: { params: { tourId: string } },
) {
  const { tourId } = params;
  const url = new URL(_request.url);
  const monthParam = url.searchParams.get('month'); // YYYY-MM

  // Validate month param
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json(
      { error: 'month query param required (YYYY-MM)' },
      { status: 400 },
    );
  }

  const [year, month] = monthParam.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // exclusive

  // Fetch tour basics (capacity, prices, cutoffHours)
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: {
      maxCapacity: true,
      adultPrice: true,
      childPrice: true,
      cutoffHours: true,
      status: true,
    },
  });

  if (!tour || tour.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
  }

  // Fetch date-specific overrides within the month
  const overrides = await prisma.tourAvailability.findMany({
    where: { tourId, date: { gte: startDate, lt: endDate } },
  });

  // Fetch schedule rules
  const scheduleRules = await prisma.tourScheduleRule.findMany({
    where: { tourId },
  });

  // Fetch confirmed+pending guest counts grouped by travelDate in this month
  const bookingSums = await prisma.booking.groupBy({
    by: ['travelDate'],
    where: {
      tourId,
      travelDate: { gte: startDate, lt: endDate },
      status: { in: [...PENDING_STATUSES, ...CONFIRMED_STATUSES] as any },
    },
    _sum: { guestCount: true },
  });

  const bookedByDate = new Map<string, number>();
  for (const row of bookingSums) {
    const key = row.travelDate.toISOString().slice(0, 10);
    bookedByDate.set(key, row._sum.guestCount ?? 0);
  }

  const overridesByDate = new Map(
    overrides.map((o) => [o.date.toISOString().slice(0, 10), o]),
  );

  // Build result for every day in the month
  const result: Record<
    string,
    { status: string; remaining: number; adultPrice: number; childPrice?: number | null }
  > = {};

  const now = new Date();
  const cutoffMs = (tour.cutoffHours ?? 12) * 3_600_000;

  for (let day = 1; day <= 31; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date >= endDate) break;

    const key = date.toISOString().slice(0, 10);
    const override = overridesByDate.get(key);

    // Past/cutoff check
    if (date.getTime() - now.getTime() < cutoffMs) {
      result[key] = { status: 'CLOSED', remaining: 0, adultPrice: tour.adultPrice };
      continue;
    }

    // Explicit status override
    if (override && override.status !== 'AVAILABLE') {
      result[key] = {
        status: override.status,
        remaining: 0,
        adultPrice: override.adultPriceOverride ?? tour.adultPrice,
        childPrice: override.childPriceOverride ?? tour.childPrice,
      };
      continue;
    }

    // Check schedule rules — if any blackout rule covers this weekday, mark BLACKOUT
    const isoDay = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // 1=Mon…7=Sun
    const isBlackedOut = scheduleRules.some((rule) => {
      if (!rule.isBlackout) return false;
      const dayMatch = rule.dayOfWeek == null || rule.dayOfWeek === isoDay;
      const fromOk = !rule.validFrom || date >= rule.validFrom;
      const untilOk = !rule.validUntil || date <= rule.validUntil;
      return dayMatch && fromOk && untilOk;
    });

    if (isBlackedOut) {
      result[key] = { status: 'BLACKOUT', remaining: 0, adultPrice: tour.adultPrice };
      continue;
    }

    // Check if tour runs on this weekday at all (non-blackout inclusive rules)
    const inclusiveRules = scheduleRules.filter((r) => !r.isBlackout);
    const hasSchedule = inclusiveRules.length > 0;
    if (hasSchedule) {
      const runs = inclusiveRules.some((rule) => {
        const dayMatch = rule.dayOfWeek == null || rule.dayOfWeek === isoDay;
        const fromOk = !rule.validFrom || date >= rule.validFrom;
        const untilOk = !rule.validUntil || date <= rule.validUntil;
        return dayMatch && fromOk && untilOk;
      });
      if (!runs) {
        result[key] = { status: 'CLOSED', remaining: 0, adultPrice: tour.adultPrice };
        continue;
      }
    }

    // Capacity calculation
    const capacity = override?.capacityOverride ?? tour.maxCapacity;
    const booked = bookedByDate.get(key) ?? 0;
    const remaining = Math.max(0, capacity - booked);

    const adultPrice = override?.adultPriceOverride ?? tour.adultPrice;
    const childPrice = override?.childPriceOverride ?? tour.childPrice;

    result[key] = {
      status: remaining === 0 ? 'SOLD_OUT' : 'AVAILABLE',
      remaining,
      adultPrice,
      childPrice,
    };
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
    },
  });
}
