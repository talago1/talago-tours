import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { tourId: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { tourId } = params;

  if (!tourId) {
    return NextResponse.json({ error: 'tourId is required' }, { status: 400 });
  }

  try {
    const [tour, reviews] = await Promise.all([
      prisma.tour.findUnique({
        where: { id: tourId },
        select: { ratingAverage: true, ratingCount: true },
      }),
      prisma.review.findMany({
        where: { tourId, status: 'APPROVED', isVisible: true, isSeeded: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          createdAt: true,
          bookingId: true,
        },
      }),
    ]);

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Build star distribution (5 → 1)
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
      percentage:
        reviews.length > 0
          ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
          : 0,
    }));

    return NextResponse.json({
      ratingAverage: tour.ratingAverage,
      ratingCount: tour.ratingCount,
      distribution,
      reviews: reviews.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment ?? '',
        createdAt: r.createdAt.toISOString(),
        isVerified: Boolean(r.bookingId),
      })),
    });
  } catch (error) {
    console.error('[GET /api/public/reviews/:tourId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
