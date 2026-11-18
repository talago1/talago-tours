// Phase 0: Catalog Audit
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      basePriceUSD: true,
      adultPrice: true,
      durationHours: true,
      category: true,
      destination: { select: { slug: true, name: true } },
      coverImage: true,
      ratingAverage: true,
      ratingCount: true,
      _count: { select: { bookings: true, reviewEntries: true } },
    },
    orderBy: { destination: { slug: 'asc' } },
  });

  console.log(`\nTotal tours: ${tours.length}`);
  
  const statusGroups = {};
  const byDest = {};
  const testTours = [];
  const legacyTours = [];

  for (const t of tours) {
    const dest = t.destination?.slug || 'NO_DEST';
    byDest[dest] = (byDest[dest] || 0) + 1;
    statusGroups[t.status || 'null'] = (statusGroups[t.status || 'null'] || 0) + 1;
    
    if (t.slug.startsWith('test-tour')) testTours.push(t.slug);
    if (t.slug.includes('egypt-gate') || t.slug.includes('legacy')) legacyTours.push(t.slug);
  }

  console.log('\n=== BY DESTINATION ===');
  for (const [dest, count] of Object.entries(byDest)) {
    console.log(`  ${dest}: ${count}`);
  }

  console.log('\n=== BY STATUS ===');
  for (const [status, count] of Object.entries(statusGroups)) {
    console.log(`  "${status}": ${count}`);
  }

  console.log(`\n=== TEST TOURS (${testTours.length}) ===`);
  testTours.forEach(s => console.log(`  ${s}`));

  console.log(`\n=== LEGACY/EGYPT-GATE TOURS (${legacyTours.length}) ===`);
  legacyTours.forEach(s => console.log(`  ${s}`));

  console.log('\n=== ALL TOURS DETAIL ===');
  for (const t of tours) {
    const dest = t.destination?.slug || 'NO_DEST';
    const price = t.basePriceUSD || t.adultPrice || 0;
    const bookings = t._count.bookings;
    const reviews = t._count.reviewEntries;
    console.log(`  [${dest}] [${t.status}] ${t.slug} | $${price} | ${t.durationHours}h | bookings=${bookings} reviews=${reviews} | img=${t.coverImage ? 'YES' : 'MISSING'}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
