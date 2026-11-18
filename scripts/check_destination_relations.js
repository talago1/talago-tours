const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkDestinationRelations() {
  const dests = await p.destination.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      _count: {
        select: {
          tours: true,
          zones: true
        }
      }
    }
  });

  console.log('=== DESTINATION RELATIONS ===');
  for (const d of dests) {
    console.log(`- ${d.slug} ("${d.name}"): ${d._count.tours} tours, ${d._count.zones} zones`);
  }

  // Check zones
  const zones = await p.zone.findMany({
    select: { id: true, name: true, destination: { select: { slug: true } } }
  });
  console.log('\nZones in DB:', zones);

  await p.$disconnect();
}

checkDestinationRelations().catch(console.error);
