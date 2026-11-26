import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const selectFieldsFull = {
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
  originalPrice: true,
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
  pickupTimes: true,
  pickupType: true,
  meetingPointName: true,
  meetingPointAddress: true,
  meetingPointLat: true,
  meetingPointLng: true,
  meetingPointLandmark: true,
  meetingPointInstructions: true,
  meetingPointMapUrl: true,
  meetingPointImageUrl: true,
  cancellationPolicy: true,
  tourOptions: true,
  bookingQuestions: true,
  pickupAreas: true,
  destination: {
    select: { id: true, name: true, slug: true },
  },
  zone: {
    select: { id: true, name: true, transferFee: true, pickupWindow: true, instructions: true, location: true },
  },
};

const selectFieldsCard = {
  id: true,
  slug: true,
  coverImage: true,
  thumbnailUrl: true,
  basePrice: true,
  basePriceUSD: true,
  duration: true,
  durationHours: true,
  translations: true,
  category: true,
  ratingAverage: true,
  ratingCount: true,
  adultPrice: true,
  originalPrice: true,
  hotelPickupIncluded: true,
  destination: { select: { id: true, name: true, slug: true } },
};

const getCachedActiveTours = unstable_cache(
  async () => {
    return prisma.tour.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ isFeatured: 'desc' }, { ratingAverage: 'desc' }, { createdAt: 'desc' }],
      select: selectFieldsCard,
      take: 50,
    });
  },
  ['public-tours-list-v1'],
  { revalidate: 60, tags: ['tours'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const tour = await prisma.tour.findUnique({
        where: { id },
        select: selectFieldsFull,
      });

      if (!tour) {
        return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
      }

      let availableZones: Array<{ id: string; name: string; transferFee: number; pickupWindow?: string | null; instructions?: string | null; location?: string | null }> = [];
      if (tour.destinationId) {
        availableZones = await prisma.zone.findMany({
          where: { destinationId: tour.destinationId, isActive: true },
          select: { id: true, name: true, transferFee: true, pickupWindow: true, instructions: true, location: true },
          orderBy: { transferFee: 'asc' },
        });
      }

      // Fetch global payment method controls
      const paymentSetting = await prisma.systemSetting.findUnique({
        where: { key: 'paymentMethods' },
      });
      let paymentMethods = {
        allowPayOnArrival: true,
        allowFullOnline: true,
        allowDepositOnline: true,
        defaultDepositPercentage: 20,
        allowPaymentLink: true,
      };
      if (paymentSetting?.value) {
        try {
          paymentMethods = { ...paymentMethods, ...JSON.parse(paymentSetting.value) };
        } catch {
          // fallback
        }
      }

      return NextResponse.json({ ...tour, availableZones, paymentMethods });
    }

    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const requestedLimit = Math.min(Number(searchParams.get('limit') || 50), 50);

    const allCachedTours = await getCachedActiveTours();

    // Apply search filter in-memory (translations is JSON, Prisma can't search inside it efficiently without raw SQL)
    const filtered = search
      ? allCachedTours.filter((t) => {
          const slug = t.slug?.toLowerCase() || '';
          const trans = t.translations as any;
          const enTitle = (trans?.en?.title || '').toLowerCase();
          const destName = (t.destination?.name || '').toLowerCase();
          return (
            slug.includes(search) ||
            enTitle.includes(search) ||
            destName.includes(search)
          );
        }).slice(0, requestedLimit)
      : allCachedTours.slice(0, requestedLimit);

    return NextResponse.json(
      { tours: filtered },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('Public tours GET error:', err);
    return NextResponse.json({ tours: [] });
  }
}
