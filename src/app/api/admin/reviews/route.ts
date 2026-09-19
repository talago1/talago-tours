import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculateTourRatingsStandalone } from '@/utils/calculateTourRatings';

export const dynamic = 'force-dynamic';

function getTourTitle(translations: unknown): string {
  const value = translations as Record<string, { title?: string }> | null;
  return value?.en?.title ?? value?.de?.title ?? 'Unknown Tour';
}

// GET: list reviews with optional tourId and status filters, plus available tours list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));

    const where: any = {};
    if (tourId && tourId !== 'ALL') {
      where.tourId = tourId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [rawReviews, total, tours] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tour: {
            select: {
              id: true,
              slug: true,
              translations: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.tour.findMany({
        where: {
          OR: [{ status: 'ACTIVE' }, { status: 'PUBLISHED' }, { status: null }],
        },
        select: {
          id: true,
          slug: true,
          translations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const reviews = rawReviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment || '',
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      tourId: r.tourId,
      tourTitle: getTourTitle(r.tour?.translations),
      tourSlug: r.tour?.slug,
    }));

    const formattedTours = tours.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: getTourTitle(t.translations),
    }));

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tours: formattedTours,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST: create a new review for a tour
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, customerName, rating, comment, status = 'APPROVED' } = body;

    if (!tourId || !customerName || !rating) {
      return NextResponse.json(
        { error: 'tourId, customerName, and rating (1-5) are required' },
        { status: 400 }
      );
    }

    const numRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

    const newReview = await prisma.review.create({
      data: {
        tourId,
        customerName: customerName.trim(),
        rating: numRating,
        comment: comment?.trim() || '',
        status: status === 'REJECTED' ? 'REJECTED' : status === 'PENDING' ? 'PENDING' : 'APPROVED',
      },
      include: {
        tour: { select: { translations: true } },
      },
    });

    // Recalculate rating aggregates for the tour
    const aggregates = await recalculateTourRatingsStandalone(tourId);

    return NextResponse.json({
      review: {
        id: newReview.id,
        customerName: newReview.customerName,
        rating: newReview.rating,
        comment: newReview.comment || '',
        status: newReview.status,
        createdAt: newReview.createdAt.toISOString(),
        tourId: newReview.tourId,
        tourTitle: getTourTitle(newReview.tour?.translations),
      },
      aggregates,
    });
  } catch (error: any) {
    console.error('[POST /api/admin/reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create review' }, { status: 500 });
  }
}

// PUT: update review details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, customerName, rating, comment, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review id is required' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const data: any = {};
    if (customerName !== undefined) data.customerName = customerName.trim();
    if (comment !== undefined) data.comment = comment.trim();
    if (rating !== undefined) {
      data.rating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    }
    if (status !== undefined) {
      data.status = status;
    }

    const updated = await prisma.review.update({
      where: { id },
      data,
      include: {
        tour: { select: { translations: true } },
      },
    });

    // Recalculate rating aggregates for the tour
    const aggregates = await recalculateTourRatingsStandalone(updated.tourId);

    return NextResponse.json({
      review: {
        id: updated.id,
        customerName: updated.customerName,
        rating: updated.rating,
        comment: updated.comment || '',
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        tourId: updated.tourId,
        tourTitle: getTourTitle(updated.tour?.translations),
      },
      aggregates,
    });
  } catch (error: any) {
    console.error('[PUT /api/admin/reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update review' }, { status: 500 });
  }
}

// DELETE: delete a review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review id is required' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate rating aggregates for the tour
    const aggregates = await recalculateTourRatingsStandalone(existing.tourId);

    return NextResponse.json({ success: true, aggregates });
  } catch (error: any) {
    console.error('[DELETE /api/admin/reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete review' }, { status: 500 });
  }
}
