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
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: {
        ratingAverage: true,
        ratingCount: true,
        predecessors: {
          select: {
            id: true,
            slug: true,
            translations: true,
          },
        },
      },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const predecessorMap = new Map<string, string>();
    if (tour.predecessors && Array.isArray(tour.predecessors)) {
      for (const p of tour.predecessors) {
        const t = (p.translations as any)?.en?.title || (p.translations as any)?.de?.title || p.slug;
        predecessorMap.set(p.id, t);
      }
    }
    const allTourIds = [tourId, ...Array.from(predecessorMap.keys())];

    const reviews = await prisma.review.findMany({
      where: { tourId: { in: allTourIds }, status: 'APPROVED', isVisible: true, isSeeded: false },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        tourId: true,
        customerName: true,
        rating: true,
        comment: true,
        createdAt: true,
        bookingId: true,
      },
    });

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
      reviews: reviews.map((r) => {
        const isPredecessor = Boolean(r.tourId && r.tourId !== tourId);
        const predecessorTitle = isPredecessor && r.tourId ? (predecessorMap.get(r.tourId) || null) : null;
        return {
          id: r.id,
          customerName: r.customerName,
          rating: r.rating,
          comment: r.comment ?? '',
          createdAt: r.createdAt.toISOString(),
          isVerified: Boolean(r.bookingId),
          isPredecessor,
          predecessorTitle,
        };
      }),
    });
  } catch (error) {
    console.error('[GET /api/public/reviews/:tourId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
