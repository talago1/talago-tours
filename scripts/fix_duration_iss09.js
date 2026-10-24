/**
 * ISS-09: Normalize unrealistic 22h+ day-trip durations for ACTIVE Cairo/Luxor tours.
 * Sets durationHours to 16 and duration to "Full Day (~16h with transfers)" for the
 * affected tours that have durationHours >= 20 and are ACTIVE single-day tours.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const SINGLE_DAY_SLUGS = [
  'cairo-tahrir-museum-pyramids',
  'cairo-pyramids-day-trip-from-hurghada',
  'cairo-pyramids-grand-egyptian-museum-marsa-alam', // listed as "18h Flight Trip" — already has custom label, skip
];

async function main() {
  // Fix the ones with misleading 22h values — skip the flight trip (24h) which already says "18 Hours (Flight Trip)"
  const toFix = [
    'cairo-tahrir-museum-pyramids',
    'cairo-pyramids-day-trip-from-hurghada',
  ];

  for (const slug of toFix) {
    const result = await p.tour.updateMany({
      where: { slug, status: 'ACTIVE' },
      data: {
        durationHours: 16,
        duration: 'Full Day (~16h with transfers)',
      },
    });
    console.log(`Updated ${slug}: ${result.count} row(s)`);
  }

  console.log('Done.');
  await p.$disconnect();
}

main().catch(console.error);
