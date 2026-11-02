const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const genuineReviews = await prisma.review.findMany({
    where: { isSeeded: false }
  });
  const allBookings = await prisma.booking.findMany();
  const retainedTourIds = new Set([...allBookings.map(b => b.tourId), ...genuineReviews.map(r => r.tourId)]);
  console.log('Retained tour IDs count:', retainedTourIds.size);

  const seededReviewsOnRetainedTours = await prisma.review.count({
    where: {
      tourId: { in: Array.from(retainedTourIds) },
      isSeeded: true
    }
  });
  console.log('Seeded reviews on retained tours:', seededReviewsOnRetainedTours);

  const seededReviewsOnDeletedTours = await prisma.review.count({
    where: {
      tourId: { notIn: Array.from(retainedTourIds) },
      isSeeded: true
    }
  });
  console.log('Seeded reviews on deleted tours:', seededReviewsOnDeletedTours);

  const genuineReviewsOnDeletedTours = await prisma.review.count({
    where: {
      tourId: { notIn: Array.from(retainedTourIds) },
      isSeeded: false
    }
  });
  console.log('Genuine reviews on deleted tours:', genuineReviewsOnDeletedTours);
}

main().finally(() => prisma.$disconnect());

