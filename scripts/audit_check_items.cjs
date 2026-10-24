const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const divingTours = await p.tour.findMany({
    where: { slug: { in: ['diving-trip-red-sea-hurghada', 'hurghada-crystal-bay-diving-intro'] } },
    select: { slug: true, adultPrice: true, originalPrice: true, durationHours: true, status: true }
  });
  console.log('ISS-05 diving:', JSON.stringify(divingTours, null, 2));

  const safaga = await p.destination.findFirst({
    where: { slug: 'safaga' },
    select: { slug: true, isVisible: true, _count: { select: { tours: true } } }
  });
  console.log('ISS-07 safaga:', JSON.stringify(safaga, null, 2));

  const longTours = await p.tour.findMany({
    where: { durationHours: { gte: 20 } },
    select: { slug: true, adultPrice: true, originalPrice: true, durationHours: true, durationDisplay: true, status: true }
  });
  console.log('ISS-09 long durations:', JSON.stringify(longTours, null, 2));

  const [tc, bc, rc] = await Promise.all([
    p.tour.count({ where: { status: 'ACTIVE' } }),
    p.booking.count(),
    p.review.count({ where: { isSeeded: false, isVisible: true } })
  ]);
  console.log('SUMMARY:', JSON.stringify({ activeTours: tc, totalBookings: bc, realVisibleReviews: rc }));
}

main().catch(console.error).finally(() => p.$disconnect());
