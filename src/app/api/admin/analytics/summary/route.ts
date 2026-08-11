export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import type { ExecutiveDashboardStats, ChannelSummary } from '@/types/analytics';

function getTourTitle(translations: unknown, lang = 'en'): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en']) {
      const entry = t[key];
      if (entry && typeof entry.title === 'string') return entry.title;
    }
  }
  return 'Unknown Tour';
}

function getDateRange(period: string | null): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

  switch (period) {
    case 'today': {
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    case '7d': {
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    }
    case 'month': {
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    case 'ytd': {
      const start = new Date(Date.UTC(now.getFullYear(), 0, 1, 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    default:
      return null;
  }
}

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

    const [aggregation, channelGroups, tourGroups] = await Promise.all([
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
    ]);

    const grossRevenueUSD = aggregation._sum.totalPriceUSD ?? 0;

    const tourIds = tourGroups.map((g) => g.tourId);
    const tours = await prisma.tour.findMany({
      where: { id: { in: tourIds } },
      select: { id: true, costPerPerson: true },
    });
    const costMap = new Map(tours.map((t) => [t.id, t.costPerPerson]));

    const totalCost = tourGroups.reduce((sum, g) => {
      const costPerPerson = costMap.get(g.tourId);
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
    if (topTourGroup.length > 0) {
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
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=900',
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
