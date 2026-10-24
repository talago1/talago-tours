const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const [destinations, tours, reviews, bookings, zones, promoCodes] = await Promise.all([
    prisma.destination.findMany({
      include: { _count: { select: { tours: true, zones: true } } },
      orderBy: { name: 'asc' }
    }),
    prisma.tour.findMany({
      include: {
        destination: true,
        zone: true,
        reviewEntries: true,
        _count: { select: { bookings: true, reviewEntries: true } }
      },
      orderBy: { slug: 'asc' }
    }),
    prisma.review.findMany({
      select: { id: true, rating: true, status: true, tourId: true, customerName: true }
    }),
    prisma.booking.findMany({
      select: { id: true, status: true, totalPriceUSD: true, guestCount: true, tourId: true }
    }),
    prisma.zone.findMany({
      include: { _count: { select: { tours: true, bookings: true } } }
    }),
    prisma.promoCode.findMany()
  ]);

  console.log('=== PLATFORM TOTALS ===');
  console.log('Total Tours:', tours.length);
  console.log('Total Destinations:', destinations.length);
  console.log('Total Zones:', zones.length);
  console.log('Total Bookings in DB:', bookings.length);
  console.log('Total Reviews in DB:', reviews.length);
  console.log('Total Promo Codes in DB:', promoCodes.length);

  console.log('\n=== DESTINATIONS IN DB ===');
  destinations.forEach(d => {
    console.log(`- ${d.name} (slug: "${d.slug}", id: "${d.id}", toursCount: ${d._count.tours}, isVisible: ${d.isVisible})`);
  });

  console.log('\n=== ALL 75 TOURS DETAILED DUMP ===');
  const tourList = tours.map(t => {
    const en = t.translations?.en || {};
    return {
      id: t.id,
      slug: t.slug,
      title: en.title || t.slug,
      destination: t.destination?.slug || 'NONE',
      destinationName: t.destination?.name || 'NONE',
      zone: t.zone?.name || 'NONE',
      type: t.type,
      basePriceUSD: t.basePriceUSD,
      adultPrice: t.adultPrice,
      originalPrice: t.originalPrice,
      childPrice: t.childPrice,
      infantPrice: t.infantPrice,
      durationHours: t.durationHours,
      duration: t.duration,
      durationDisplay: t.durationDisplay,
      category: t.category,
      ratingAverage: t.ratingAverage,
      ratingCount: t.ratingCount,
      realReviewCount: t._count.reviewEntries,
      bookingCount: t._count.bookings,
      freeCancellationHours: t.freeCancellationHours,
      instantConfirmation: t.instantConfirmation,
      inclusionsCount: t.inclusions?.length || 0,
      highlightsCount: t.highlights?.length || 0,
      variants: t.variants,
      tourOptions: t.tourOptions
    };
  });

  const fs = require('fs');
  fs.writeFileSync('scripts/audit_tours_dump.json', JSON.stringify(tourList, null, 2));
  console.log('Saved dump to scripts/audit_tours_dump.json');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
