const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tours = await p.tour.findMany({
    where: {
      OR: [
        { slug: { in: ['diving-trip-red-sea-hurghada', 'hurghada-crystal-bay-diving-intro'] } },
        { durationHours: { gte: 20 } },
      ]
    },
    select: {
      slug: true,
      adultPrice: true,
      priceAdult: true,
      originalPrice: true,
      durationHours: true,
      duration: true,
      status: true,
    },
    orderBy: { durationHours: 'desc' },
  });
  console.log(JSON.stringify(tours, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
