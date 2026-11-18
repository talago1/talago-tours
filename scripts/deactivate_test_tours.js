// Deactivate test tours that have no real content
// (PUBLISHED status, slug starts with test-tour-*, no cover image)
// We set status to INACTIVE rather than deleting since some have test bookings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const testTours = await prisma.tour.findMany({
    where: { slug: { startsWith: 'test-tour' } },
    select: {
      id: true, slug: true, status: true,
      _count: { select: { bookings: true } }
    }
  });

  console.log(`Found ${testTours.length} test tours:`);
  testTours.forEach(t => console.log(`  ${t.slug} | status=${t.status} | bookings=${t._count.bookings}`));

  const updated = await prisma.tour.updateMany({
    where: { slug: { startsWith: 'test-tour' } },
    data: { status: 'INACTIVE' }
  });

  console.log(`\nSet ${updated.count} test tours to INACTIVE`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
