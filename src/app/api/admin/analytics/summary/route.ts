export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { getTourTitle, getDateRange } from '@/utils/analyticsHelpers';
import type { ExecutiveDashboardStats, ChannelSummary } from '@/types/analytics';

const getCachedSummaryQueries = unstable_cache(
  async (startIso: string, endIso: string) => {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const where = {
      status: 'CONFIRMED' as const,
      travelDate: { gte: startDate, lte: endDate },
    };

    return Promise.all([
      prisma.booking.aggregate({
        where,
        _sum: { totalPriceUSD: true, guestCount: true },
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ['channel'],
        where,
        _sum: { totalPriceUSD: true },
        _count: true,
      }),
      prisma.booking.groupBy({
        by: ['tourId'],
        where,
        _sum: { totalPriceUSD: true, guestCount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          booking: where,
        },
        _sum: { amountPaidOnline: true },
      }),
      Promise.all([
        prisma.abandonedCheckout.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
        prisma.abandonedCheckout.count({ where: { createdAt: { gte: startDate, lte: endDate }, isRecovered: false } }),
        prisma.abandonedCheckout.count({ where: { createdAt: { gte: startDate, lte: endDate }, isRecovered: true } }),
      ]),
    ]);
  },
  ['admin-analytics-summary-v1'],
  { revalidate: 60, tags: ['analytics', 'bookings'] }
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

    const where = {
      status: 'CONFIRMED' as const,
      travelDate: { gte: startDate, lte: endDate },
    };

    const [aggregation, channelGroups, tourGroups, transactionAggregation, abandonedCounts] =
      await getCachedSummaryQueries(startDate.toISOString(), endDate.toISOString());

    const grossRevenueUSD = aggregation._sum.totalPriceUSD ?? 0;
    const onlineCapturedRevenueUSD = transactionAggregation._sum.amountPaidOnline ?? 0;

    const [checkoutStarts, abandonedCheckouts, recoveredCheckouts] = abandonedCounts;
    const confirmedBookings = aggregation._count;
    const funnelDenominator = confirmedBookings + abandonedCheckouts;
    const funnelConversionRate = funnelDenominator > 0
      ? Math.round((confirmedBookings / funnelDenominator) * 1000) / 10
      : 0;

    const tourIds = tourGroups.map((g) => g.tourId).filter((id): id is string => Boolean(id));
    const tours = await prisma.tour.findMany({
      where: { id: { in: tourIds } },
      select: { id: true, costPerPerson: true },
    });
    const costMap = new Map(tours.map((t) => [t.id, t.costPerPerson]));

    const totalCost = tourGroups.reduce((sum, g) => {
      const costPerPerson = g.tourId ? costMap.get(g.tourId) : null;
      if (costPerPerson != null) {
        return sum + Number(costPerPerson) * (g._sum.guestCount ?? 0);
      }
      return sum;
    }, 0);

    const netMarginUSD = grossRevenueUSD - totalCost;

    const passengerCount = aggregation._sum.guestCount ?? 0;

    const topTourGroup = await prisma.booking.groupBy({
      by: ['tourId'],
      where,
      _sum: { totalPriceUSD: true },
      orderBy: { _sum: { totalPriceUSD: 'desc' } },
      take: 1,
    });

    let topTourTitle = '—';
    if (topTourGroup.length > 0 && topTourGroup[0].tourId) {
      const topTour = await prisma.tour.findUnique({
        where: { id: topTourGroup[0].tourId },
        select: { translations: true },
      });
      if (topTour) {
        topTourTitle = getTourTitle(topTour.translations);
      }
    }

    const channelBreakdown: ChannelSummary[] = channelGroups.map((g) => ({
      channel: g.channel as ChannelSummary['channel'],
      _count: g._count,
      totalRevenueUSD: g._sum.totalPriceUSD ?? 0,
    }));

    const allChannels: ChannelSummary['channel'][] = [
      'VIATOR', 'GETYOURGUIDE', 'WHATSAPP', 'HOTEL_DIRECT', 'WEBSITE',
    ];
    for (const ch of allChannels) {
      if (!channelBreakdown.some((c) => c.channel === ch)) {
        channelBreakdown.push({ channel: ch, _count: 0, totalRevenueUSD: 0 });
      }
    }

    const financialSetting = await prisma.systemSetting.findUnique({ where: { key: 'financial' } });
    const financialData = financialSetting ? parseSettingValue<{ exchangeRates?: { EGP?: number } }>(financialSetting.value, {}) : {};
    const usdToEgpRate = financialData.exchangeRates?.EGP ?? 48.5;

    const convertUsdToEgp = (amount: number) => Math.round(amount * usdToEgpRate * 100) / 100;

    const response: ExecutiveDashboardStats = {
      grossRevenueUSD,
      grossRevenueEGP: convertUsdToEgp(grossRevenueUSD),
      netMarginUSD,
      netMarginEGP: convertUsdToEgp(netMarginUSD),
      passengerCount,
      topTourTitle,
      channelBreakdown,
      onlineCapturedRevenueUSD,
      funnel: {
        checkoutStarts,
        confirmedBookings,
        abandonedCheckouts,
        recoveredCheckouts,
        conversionRate: funnelConversionRate,
      },
    };

    return NextResponse.json(response, {
      headers: {
        // This route is admin-only. Never allow a shared cache to retain
        // business metrics outside the authenticated request context.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
