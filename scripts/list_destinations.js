// Get destinations from DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dests = await prisma.destination.findMany({
    select: { id: true, slug: true, name: true }
  });
  console.log('Destinations:', JSON.stringify(dests, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
