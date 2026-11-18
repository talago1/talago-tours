const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function testPublic() {
  // Simulate public tours query (from src/app/api/public/tours/route.ts)
  const publicTours = await p.tour.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, slug: true, status: true }
  });

  console.log(`Publicly visible tours count: ${publicTours.length}`);
  const hasDraft = publicTours.some(t => t.status === 'DRAFT');
  console.log(`Are any DRAFT tours visible to public? ${hasDraft ? 'YES (BUG!)' : 'NO (Correct!)'}`);

  await p.$disconnect();
}

testPublic().catch(console.error);
