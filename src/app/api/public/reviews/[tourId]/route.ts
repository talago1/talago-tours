import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { tourId: string };
}

const getCachedTourReviews = unstable_cache(
  async (tourId: string) => {
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

    if (!tour) return null;

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

    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating]++;
    }

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percentage: reviews.length > 0 ? Math.round((counts[star] / reviews.length) * 100) : 0,
    }));

    return {
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
    };
  },
  ['public-tour-reviews-v1'],
  { revalidate: 120, tags: ['reviews', 'tours'] }
);

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { tourId } = params;

  if (!tourId) {
    return NextResponse.json({ error: 'tourId is required' }, { status: 400 });
  }

  try {
    const data = await getCachedTourReviews(tourId);
    if (!data) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/public/reviews/:tourId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
