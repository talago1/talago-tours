import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyReviewToken } from '@/utils/reviewToken';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 30;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'reviews-verify-token'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Missing review token.' }, { status: 400 });
  }

  const verified = verifyReviewToken(token);
  if (!verified) {
    return NextResponse.json(
      { valid: false, error: 'This review invitation link is invalid or has expired.' },
      { status: 401 },
    );
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        id: verified.bookingId,
        tourId: verified.tourId,
      },
      select: {
        id: true,
        customerName: true,
        status: true,
        language: true,
        tour: {
          select: {
            id: true,
            slug: true,
            translations: true,
            coverImage: true,
          },
        },
        reviews: {
          select: { id: true },
        },
      },
    });

    if (!booking || !booking.tour) {
      return NextResponse.json(
        { valid: false, error: 'Booking or tour not found.' },
        { status: 404 },
      );
    }

    if (booking.reviews.length > 0) {
      return NextResponse.json({
        valid: false,
        alreadyReviewed: true,
        error: 'Thank you! You have already submitted a review for this experience.',
        tourSlug: booking.tour.slug,
      });
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
      return NextResponse.json(
        { valid: false, error: 'Reviews are only open for confirmed or completed bookings.' },
        { status: 403 },
      );
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle =
      translations?.[booking.language]?.title ||
      translations?.en?.title ||
      booking.tour.slug;

    return NextResponse.json({
      valid: true,
      bookingId: booking.id,
      tourId: booking.tour.id,
      tourTitle,
      tourSlug: booking.tour.slug,
      customerName: booking.customerName,
      coverImage: booking.tour.coverImage,
    });
  } catch (err: any) {
    console.error('[GET /api/public/reviews/verify-token] error:', err);
    return NextResponse.json({ valid: false, error: 'Internal server error.' }, { status: 500 });
  }
}

