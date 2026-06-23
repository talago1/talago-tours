const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tours = await prisma.tour.findMany({ select: { id: true, slug: true, coverImage: true, category: true } });
  console.log('--- TOURS ---');
  console.log(JSON.stringify(tours, null, 2));
  const destinations = await prisma.destination.findMany({ select: { id: true, slug: true, imageUrl: true } });
  console.log('--- DESTINATIONS ---');
  console.log(JSON.stringify(destinations, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
