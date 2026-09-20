import { prisma } from '@/lib/prisma';
import AdminToursClient from './AdminToursClient';
import { safeParseItinerary, safeParseReviews } from '@/utils/tourJsonSchemas';

export const dynamic = 'force-dynamic';

export default async function AdminToursPage() {
  const [tours, destinations, zones] = await Promise.all([
    prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        type: true,
        category: true,
        adultPrice: true,
        basePriceUSD: true,
        status: true,
        translations: true,
        coverImage: true,
        galleryImages: true,
        destinationId: true,
        zoneId: true,
        maxCapacity: true,
        durationHours: true,
        pickupTime: true,
        pickupDescription: true,
        whatToBring: true,
        cancellationPolicy: true,
        hotelPickupIncluded: true,
        allowDeposit: true,
        depositPercentage: true,
        allowPayAtLocation: true,
        childPrice: true,
        childMinAge: true,
        childMaxAge: true,
        infantPrice: true,
        infantMinAge: true,
        infantMaxAge: true,
        ageRestrictionsNotes: true,
        itinerary: true,
        cardExcerpt: true,
        showExcerptOnCard: true,
        reviews: true,
        ratingAverage: true,
        ratingCount: true,
        tourOptions: true,
        pickupTimes: true,
        destination: { select: { name: true } },
      },
    }),
    prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.zone.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  // Convert decimal to number if needed or cast types
  const mappedTours = tours.map(t => ({
    ...t,
    destinationId: t.destinationId ?? '',
    destination: t.destination ?? { name: '' },
    status: t.status ?? 'ACTIVE',
    category: t.category ?? null,
    adultPrice: Number(t.adultPrice || t.basePriceUSD || 0),
    basePriceUSD: Number(t.basePriceUSD || 0),
    pickupTime: t.pickupTime ?? undefined,
    pickupDescription: t.pickupDescription ?? undefined,
    whatToBring: t.whatToBring ?? undefined,
    cancellationPolicy: t.cancellationPolicy ?? undefined,
    hotelPickupIncluded: t.hotelPickupIncluded ?? false,
    allowDeposit: t.allowDeposit ?? false,
    depositPercentage: t.depositPercentage ?? 100,
    allowPayAtLocation: t.allowPayAtLocation ?? true,
    childPrice: t.childPrice ?? undefined,
    childMinAge: t.childMinAge ?? undefined,
    childMaxAge: t.childMaxAge ?? undefined,
    infantPrice: t.infantPrice ?? undefined,
    infantMinAge: t.infantMinAge ?? undefined,
    infantMaxAge: t.infantMaxAge ?? undefined,
    ageRestrictionsNotes: t.ageRestrictionsNotes ?? undefined,
    cardExcerpt: t.cardExcerpt ?? undefined,
    showExcerptOnCard: t.showExcerptOnCard ?? true,
    itinerary: safeParseItinerary(t.itinerary),
    reviews: safeParseReviews(t.reviews),
    ratingAverage: t.ratingAverage ?? undefined,
    ratingCount: t.ratingCount ?? undefined,
    tourOptions: Array.isArray(t.tourOptions) ? (t.tourOptions as unknown as any[]) : null,
    pickupTimes: Array.isArray(t.pickupTimes) ? t.pickupTimes : [],
  }));

  return (
    <AdminToursClient
      initialTours={mappedTours}
      destinations={destinations}
      zones={zones}
    />
  );
}
