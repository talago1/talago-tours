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
  destination: {
    select: { id: true, name: true, slug: true },
  },
  zone: {
    select: { id: true, name: true, transferFee: true, pickupWindow: true, instructions: true, location: true },
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

    const tours = await prisma.tour.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ isFeatured: 'desc' }, { ratingAverage: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        translations: true,
        adultPrice: true,
        basePriceUSD: true,
        basePrice: true,
        durationHours: true,
        coverImage: true,
        thumbnailUrl: true,
        category: true,
        destination: { select: { id: true, name: true, slug: true } },
      },
      take: Math.min(Number(searchParams.get('limit') || 50), 50),
    });

    // Apply search filter in-memory (translations is JSON, Prisma can't search inside it efficiently without raw SQL)
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const filtered = search
      ? tours.filter((t) => {
          const slug = t.slug?.toLowerCase() || '';
          const trans = t.translations as any;
          const enTitle = (trans?.en?.title || '').toLowerCase();
          const destName = (t.destination?.name || '').toLowerCase();
          return (
            slug.includes(search) ||
            enTitle.includes(search) ||
            destName.includes(search)
          );
        })
      : tours;

    return NextResponse.json({ tours: filtered });
  } catch (err) {
    console.error('Public tours GET error:', err);
    return NextResponse.json({ tours: [] });
  }
}
