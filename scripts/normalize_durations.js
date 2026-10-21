const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cairoDayTrips = [
    { slug: 'grand-egyptian-museum-super-tour', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-gem-pyramids-day-trip', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-pyramids-day-trip-from-sharm', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-grand-egyptian-museum-from-sharm', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-pyramids-grand-egyptian-museum-marsa-alam', hours: 18, label: '18 Hours (Flight Trip)' },
    { slug: 'cairo-pyramids-day-trip-from-hurghada', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-pyramids-grand-egyptian-museum', hours: 18, label: 'Full Day (~18h with transfers)' },
    { slug: 'cairo-tahrir-museum-pyramids', hours: 18, label: 'Full Day (~18h with transfers)' },
  ];

  for (const item of cairoDayTrips) {
    const tour = await prisma.tour.findUnique({ where: { slug: item.slug } });
    if (tour) {
      await prisma.tour.update({
        where: { id: tour.id },
        data: {
          durationHours: item.hours,
          duration: item.label,
        },
      });
      console.log(`Updated ${item.slug} duration to ${item.hours}h (${item.label})`);
    }
  }

  console.log('Cairo day trips duration normalization complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
