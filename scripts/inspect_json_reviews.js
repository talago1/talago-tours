const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tours = await prisma.tour.findMany({
    select: { id: true, slug: true, reviews: true, ratingAverage: true, ratingCount: true }
  });
  const withJsonReviews = tours.filter(t => t.reviews && JSON.stringify(t.reviews) !== '[]' && JSON.stringify(t.reviews) !== 'null');
  console.log('Total tours:', tours.length);
  console.log('Tours with non-empty tour.reviews JSON:', withJsonReviews.length);
  if (withJsonReviews.length > 0) {
    console.log('Sample JSON reviews for first tour:', withJsonReviews[0].slug);
    console.log(JSON.stringify(withJsonReviews[0].reviews, null, 2).slice(0, 500));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
