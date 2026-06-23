import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const selectFields = {
  id: true,
  slug: true,
  basePrice: true,
  basePriceUSD: true,
  duration: true,
  durationHours: true,
  maxCapacity: true,
  thumbnailUrl: true,
  coverImage: true,
  category: true,
  status: true,
  translations: true,
  destinationId: true,
  zoneId: true,
  allowDeposit: true,
  depositPercentage: true,
  allowPayAtLocation: true,
  images: true,
  galleryImages: true,
  ratingAverage: true,
  ratingCount: true,
  adultPrice: true,
  priceAdult: true,
  childPrice: true,
  infantPrice: true,
  highlights: true,
  inclusions: true,
  exclusions: true,
  itinerary: true,
  whatToBring: true,
  pickupDescription: true,
  hotelPickupIncluded: true,
  pickupTime: true,
  cancellationPolicy: true,
  destination: {
    select: { id: true, name: true, slug: true },
  },
  zone: {
    select: { id: true, name: true, transferFee: true },
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const tour = await prisma.tour.findUnique({
        where: { id },
        select: selectFields,
      });

      if (!tour) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }

      return NextResponse.json(tour);
    }

    const tours = await prisma.tour.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: selectFields,
    });

    return NextResponse.json({ tours });
  } catch (err) {
    console.error('Public tours GET error:', err);
    return NextResponse.json({ tours: [] });
  }
}
