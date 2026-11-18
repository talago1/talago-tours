const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const raw = JSON.parse(fs.readFileSync('scripts/data/match_results.json', 'utf8'));
  const results = raw.results || raw;

  console.log('=== CLASS A DETAILED AUDIT (30 records) ===');
  const aRecords = results.filter(r => r.classification === 'A');
  for (const r of aRecords) {
    const tour = await p.tour.findUnique({
      where: { slug: r.matchedTourSlug },
      select: { id: true, slug: true, basePriceUSD: true, adultPrice: true, status: true, internalNotes: true }
    });
    console.log(`[${r.source}] "${r.sourceName}"`);
    console.log(`   -> Matched: ${r.matchedTourSlug} (exists: ${!!tour}, price: $${tour?.basePriceUSD}, status: ${tour?.status})`);
    console.log(`   -> Source price: ${JSON.stringify(r.priceFrom)}`);
  }

  console.log('\n=== CLASS D DESTINATION AUDIT (243 records) ===');
  const dRecords = results.filter(r => r.classification === 'D');
  const dByDest = {};
  dRecords.forEach(r => {
    dByDest[r.destination] = (dByDest[r.destination] || 0) + 1;
  });
  console.log('Class D destination counts:', dByDest);

  // Check existing destinations in DB
  const dests = await p.destination.findMany({ select: { id: true, slug: true, name: true } });
  console.log('\nDB Destinations:', dests.map(d => `${d.slug} ("${d.name}")`));

  await p.$disconnect();
}

run().catch(console.error);
