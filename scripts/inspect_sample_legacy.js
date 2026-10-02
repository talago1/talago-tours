const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tours = await prisma.tour.findMany({
    where: { slug: { in: ['desert-safari-3h-atv', 'orange-bay-island-hurghada', 'cairo-gem-pyramids-day-trip'] } },
    select: { slug: true, category: true, translations: true, itinerary: true, highlights: true }
  });
  console.log(JSON.stringify(tours, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
