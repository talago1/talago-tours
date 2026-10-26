export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type LeadStatusFilter = 'INTERESTED' | 'IN_PROGRESS' | 'CONTACTED' | 'CONVERTED' | 'ABANDONED';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') as LeadStatusFilter | 'ALL' | null;
    const tourId = searchParams.get('tourId')?.trim() || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (tourId) {
      where.tourId = tourId;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { tourTitle: { contains: search, mode: 'insensitive' } },
        { tourSlug: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, totalCount, countsByStatus, valueSum] = await Promise.all([
      prisma.bookingLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          booking: {
            select: {
              id: true,
              bookingReference: true,
              status: true,
              totalPriceUSD: true,
            },
          },
        },
      }),
      prisma.bookingLead.count({ where }),
      prisma.bookingLead.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.bookingLead.aggregate({
        _sum: { totalEstimatedPrice: true },
      }),
    ]);

    const statsMap: Record<string, number> = {
      INTERESTED: 0,
      IN_PROGRESS: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      ABANDONED: 0,
    };
    countsByStatus.forEach((c) => {
      statsMap[c.status] = c._count.status;
    });

    const totalAll = Object.values(statsMap).reduce((a, b) => a + b, 0);
    const converted = statsMap.CONVERTED || 0;
    const conversionRate = totalAll > 0 ? Math.round((converted / totalAll) * 100) : 0;

    return NextResponse.json({
      leads,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      metrics: {
        totalLeads: totalAll,
        interested: statsMap.INTERESTED || 0,
        inProgress: statsMap.IN_PROGRESS || 0,
        contacted: statsMap.CONTACTED || 0,
        converted: statsMap.CONVERTED || 0,
        abandoned: statsMap.ABANDONED || 0,
        conversionRate,
        totalEstimatedValue: valueSum._sum.totalEstimatedPrice || 0,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch admin leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
