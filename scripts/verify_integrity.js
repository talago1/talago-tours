const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const [b, r, tx, c, dests, drafts] = await Promise.all([
    p.booking.count(),
    p.review.count(),
    p.transaction.count(),
    p.customerProfile.count(),
    p.destination.count(),
    p.tour.count({ where: { status: 'DRAFT' } })
  ]);

  console.log('=== DATA INTEGRITY AUDIT ===');
  console.log('Bookings:', b);
  console.log('Reviews:', r);
  console.log('Transactions:', tx);
  console.log('Customer Profiles:', c);
  console.log('Destinations:', dests);
  console.log('DRAFT Tours in DB:', drafts);

  // Check some draft samples
  const sampleDrafts = await p.tour.findMany({
    where: { status: 'DRAFT' },
    take: 5,
    select: {
      id: true,
      slug: true,
      basePriceUSD: true,
      durationHours: true,
      destination: { select: { name: true } },
      internalNotes: true,
      translations: true
    }
  });

  console.log('\nSample DRAFT tours in DB:');
  sampleDrafts.forEach(d => {
    console.log(` - [${d.slug}] in ${d.destination?.name} ($${d.basePriceUSD}, ${d.durationHours}h)`);
    console.log(`   Title: ${d.translations?.en?.title}`);
    console.log(`   Notes: ${d.internalNotes}`);
  });

  await p.$disconnect();
}

check().catch(console.error);
