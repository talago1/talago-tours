const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function inspectTourHistory() {
  const toursWithHistory = await p.tour.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      basePriceUSD: true,
      translations: true,
      destination: { select: { slug: true, name: true } },
      _count: {
        select: {
          bookings: true,
          reviewEntries: true
        }
      }
    }
  });

  const activeTours = toursWithHistory.filter(t => t.status === 'ACTIVE');
  const draftTours = toursWithHistory.filter(t => t.status === 'DRAFT');
  const inactiveTours = toursWithHistory.filter(t => t.status === 'INACTIVE');

  console.log('=== TOUR COUNTS BY STATUS ===');
  console.log('Total tours:', toursWithHistory.length);
  console.log('ACTIVE:', activeTours.length);
  console.log('DRAFT:', draftTours.length);
  console.log('INACTIVE:', inactiveTours.length);

  const toursWithBookings = toursWithHistory.filter(t => t._count.bookings > 0);
  const toursWithReviews = toursWithHistory.filter(t => t._count.reviewEntries > 0);

  console.log('\nTours with bookings:', toursWithBookings.length);
  console.log('Tours with reviews:', toursWithReviews.length);

  // Sort by booking count
  toursWithBookings.sort((a, b) => b._count.bookings - a._count.bookings);

  console.log('\n=== TOP TOURS BY BOOKINGS ===');
  toursWithBookings.forEach((t, i) => {
    const title = t.translations?.en?.title || t.slug;
    console.log(`${i + 1}. [${t.slug}] "${title}" (Status: ${t.status}, Dest: ${t.destination?.name})`);
    console.log(`   Bookings: ${t._count.bookings} | Reviews: ${t._count.reviewEntries} | Price: $${t.basePriceUSD}`);
  });

  await p.$disconnect();
}

inspectTourHistory().catch(console.error);
