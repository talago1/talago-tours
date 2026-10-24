const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.review.count();
  const byStatus = await prisma.review.groupBy({ by: ['status'], _count: { id: true } });
  console.log('Total reviews in DB:', total);
  console.log('By status:', byStatus);

  const seededCount = await prisma.review.count({ where: { isSeeded: true } });
  const visibleCount = await prisma.review.count({ where: { isVisible: true } });
  console.log('Currently marked isSeeded=true:', seededCount);
  console.log('Currently marked isVisible=true:', visibleCount);

  // Update existing seeded reviews
  // Mark all existing reviews as isSeeded: true, isVisible: false (per AUDIT.md 6.2)
  const updated = await prisma.review.updateMany({
    where: {
      isSeeded: false, // all existing reviews haven't been marked yet
    },
    data: {
      isSeeded: true,
      isVisible: false,
    }
  });

  console.log(`Deactivated ${updated.count} seeded reviews (isSeeded: true, isVisible: false)`);

  const afterSeeded = await prisma.review.count({ where: { isSeeded: true, isVisible: false } });
  const afterVisible = await prisma.review.count({ where: { isVisible: true } });
  console.log('Reviews now isSeeded=true, isVisible=false:', afterSeeded);
  console.log('Reviews now isVisible=true (real reviews):', afterVisible);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
