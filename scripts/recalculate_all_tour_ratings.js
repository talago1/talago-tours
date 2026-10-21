const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RECALCULATING ALL TOUR RATINGS BASED ON REAL VISIBLE REVIEWS ONLY ---');
  const tours = await prisma.tour.findMany({ select: { id: true, slug: true } });

  let updatedCount = 0;
  for (const tour of tours) {
    const realApprovedReviews = await prisma.review.findMany({
      where: {
        tourId: tour.id,
        status: 'APPROVED',
        isVisible: true,
        isSeeded: false,
      },
      select: { rating: true },
    });

    const ratingCount = realApprovedReviews.length;
    const ratingAverage =
      ratingCount > 0
        ? realApprovedReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;

    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        ratingAverage,
        ratingCount,
      },
    });
    updatedCount++;
  }

  console.log(`Recalculated ratings for ${updatedCount} tours.`);
  const summary = await prisma.tour.aggregate({
    _avg: { ratingAverage: true },
    _sum: { ratingCount: true },
  });
  console.log('Summary after recalculation:', summary);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
