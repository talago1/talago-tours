export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getTourTitle, getDateRange } from '@/utils/analyticsHelpers';
import type { TourPerformanceItem } from '@/types/analytics';

const getCachedTourAnalyticsQueries = unstable_cache(
  async (startIso: string, endIso: string) => {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const bookingWhere = {
      status: 'CONFIRMED' as const,
      travelDate: { gte: startDate, lte: endDate },
    };
    const interestWhere = {
      createdAt: { gte: startDate, lte: endDate },
      status: 'INTERESTED' as const,
      source: { not: 'INQUIRY' },
    };

    return Promise.all([
      prisma.booking.groupBy({
        by: ['tourId'],
        where: bookingWhere,
        _sum: { totalPriceUSD: true, guestCount: true },
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ['tourId'],
        where: {
          ...interestWhere,
          tourId: { not: null },
        },
        _count: true,
      }),
      prisma.tour.findMany({
        select: {
          id: true,
          slug: true,
          translations: true,
          status: true,
        },
      }),
    ]);
  },
  ['admin-analytics-tours-v1'],
  { revalidate: 60, tags: ['analytics', 'bookings', 'tours'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const rawStart = searchParams.get('startDate');
    const rawEnd = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date;

    if (period) {
      const range = getDateRange(period);
      if (!range) {
        return NextResponse.json(
          { error: 'Invalid period parameter. Use: today, 7d, month, or ytd' },
          { status: 400 }
        );
      }
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (rawStart && rawEnd) {
      startDate = new Date(rawStart);
      endDate = new Date(rawEnd);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Provide period (today/7d/month/ytd) or startDate + endDate query parameters' },
        { status: 400 }
      );
    }

    const [bookingGroups, leadGroups, allTours] = await getCachedTourAnalyticsQueries(
      startDate.toISOString(),
      endDate.toISOString()
    );

    const tourMap = new Map(allTours.map((t) => [t.id, t]));
    const bookingMap = new Map(bookingGroups.filter((b) => Boolean(b.tourId)).map((b) => [b.tourId as string, b]));
    const leadMap = new Map(leadGroups.filter((l) => l.tourId !== null).map((l) => [l.tourId as string, l._count]));

    // Identify all unique tours that either have bookings, leads, or are active in catalog
    const relevantTourIds = new Set<string>([
      ...bookingGroups.map((b) => b.tourId).filter((id): id is string => Boolean(id)),
      ...leadGroups.filter((l) => l.tourId !== null).map((l) => l.tourId as string),
    ]);

    // If few or none, also include published active tours
    if (relevantTourIds.size < 10) {
      for (const t of allTours) {
        if (t.status === 'ACTIVE' || t.status === 'PUBLISHED') {
          relevantTourIds.add(t.id);
        }
      }
    }

    const performance: TourPerformanceItem[] = Array.from(relevantTourIds).map((tourId) => {
      const tour = tourMap.get(tourId);
      const bookingData = bookingMap.get(tourId);
      const leadsCount = leadMap.get(tourId) ?? 0;
      const confirmedBookingsCount = bookingData?._count ?? 0;
      const revenueUSD = bookingData?._sum.totalPriceUSD ?? 0;
      const passengerCount = bookingData?._sum.guestCount ?? 0;

      const conversionRate = leadsCount > 0
        ? Math.round((confirmedBookingsCount / leadsCount) * 1000) / 10
        : confirmedBookingsCount > 0
        ? 100
        : 0;

      return {
        tourId,
        tourSlug: tour?.slug || 'unknown-tour',
        tourTitle: tour ? getTourTitle(tour.translations) : 'Unknown Tour',
        leadsCount,
        confirmedBookingsCount,
        conversionRate,
        revenueUSD,
        passengerCount,
      };
    });

    // Sort by revenue descending, then confirmed bookings descending
    performance.sort((a, b) => b.revenueUSD - a.revenueUSD || b.confirmedBookingsCount - a.confirmedBookingsCount);

    return NextResponse.json(performance, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Tour performance report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
