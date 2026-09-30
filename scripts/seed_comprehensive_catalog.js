const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { ensureDestinations } = require('./data/destinations_config');
const hurghadaTours = require('./data/tours_hurghada');
const sharmTours = require('./data/tours_sharm');
const marsaTours = require('./data/tours_marsa_alam');
const culturalTours = require('./data/tours_cultural');
const blogArticles = require('./data/blog_articles');

async function ensureZone(name, destinationId) {
  let zone = await prisma.zone.findFirst({ where: { name } });
  if (!zone) {
    zone = await prisma.zone.create({
      data: { name, destinationId, transferFee: 0, isActive: true },
    });
    console.log(`  ✓ Zone created: ${name}`);
  }
  return zone;
}

function buildTourPayload(t, destinationId, zoneId) {
  return {
    slug: t.slug, type: t.type || 'SHARED',
    basePriceUSD: t.basePriceUSD, basePrice: t.basePriceUSD,
    durationHours: t.durationHours, duration: t.duration || null,
    maxCapacity: t.maxCapacity || 30, zoneId, destinationId,
    translations: t.translations || {},
    countryCode: 'EG', timezone: 'Africa/Cairo',
    coverImage: t.coverImage || null, galleryImages: t.galleryImages || [],
    thumbnailUrl: t.coverImage || null,
    highlights: t.highlights || [], inclusions: t.inclusions || [],
    exclusions: t.exclusions || [], category: t.category || null,
    status: t.status || 'ACTIVE',
    isFeatured: t.isFeatured || false, isBestSeller: t.isBestSeller || false,
    isNew: true, ratingAverage: t.ratingAverage || 0, ratingCount: t.ratingCount || 0,
    allowDeposit: true, depositPercentage: 20, depositType: 'PERCENTAGE',
    allowPayAtLocation: true, showExcerptOnCard: true,
    whatToBring: t.whatToBring || null,
    cancellationPolicy: t.cancellationPolicy || 'Free cancellation up to 24 hours before departure.',
    hotelPickupIncluded: t.hotelPickupIncluded !== undefined ? t.hotelPickupIncluded : true,
    pickupTimes: t.pickupTimes || [], pickupType: t.pickupType || 'hotel',
    instantConfirmation: true, freeCancellationHours: 24,
    adultPrice: t.adultPrice || t.basePriceUSD,
    priceAdult: t.priceAdult || t.adultPrice || t.basePriceUSD,
    originalPrice: t.originalPrice || null,
    childPrice: t.childPrice || 0, infantPrice: t.infantPrice || 0,
    childMinAge: 3, childMaxAge: 11, infantMinAge: 0, infantMaxAge: 2,
  };
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  TALAGO TOURS — Comprehensive Catalog Seeder');
  console.log('══════════════════════════════════════════════════');

  // 1. Destinations
  console.log('\n📍 Step 1: Ensuring Destinations...');
  const destMap = await ensureDestinations(prisma);
  console.log(`  ✓ ${Object.keys(destMap).length} destinations ready`);

  // 2. Zones
  console.log('\n🗺️  Step 2: Ensuring Zones...');
  const zones = {
    hurghada: await ensureZone('Hurghada City & Marina', destMap['hurghada'].id),
    'sharm-el-sheikh': await ensureZone('Sharm City & Naama Bay', destMap['sharm-el-sheikh'].id),
    'marsa-alam': await ensureZone('Marsa Alam & Port Ghalib', destMap['marsa-alam'].id),
    luxor: await ensureZone('Luxor East & West Banks', destMap['luxor'].id),
    cairo: await ensureZone('Cairo & Giza Area', destMap['cairo'].id),
  };

  // 3. Tours
  console.log('\n🎯 Step 3: Seeding Tours...');
  const allTours = [
    ...hurghadaTours.map((t) => ({ ...t, destSlug: 'hurghada' })),
    ...sharmTours.map((t) => ({ ...t, destSlug: 'sharm-el-sheikh' })),
    ...marsaTours.map((t) => ({ ...t, destSlug: 'marsa-alam' })),
    ...culturalTours.map((t) => ({
      ...t,
      destSlug: t.slug.includes('cairo') ? 'cairo' : 'luxor',
    })),
  ];
  let tourOk = 0;
  for (const raw of allTours) {
    const { destSlug, ...data } = raw;
    const dest = destMap[destSlug] || destMap['hurghada'];
    const zone = zones[destSlug] || zones['hurghada'];
    const payload = buildTourPayload(data, dest.id, zone.id);
    try {
      await prisma.tour.upsert({
        where: { slug: payload.slug },
        update: payload,
        create: payload,
      });
      tourOk++;
      console.log(`  ✓ [${destSlug}] ${data.title}`);
    } catch (err) {
      console.error(`  ✗ [${destSlug}] ${data.slug}: ${err.message}`);
    }
  }

  // 4. Blog Posts
  console.log('\n📝 Step 4: Seeding Blog Articles...');
  let blogOk = 0;
  for (const art of blogArticles) {
    try {
      await prisma.blogPost.upsert({
        where: { slug: art.slug },
        update: art,
        create: art,
      });
      blogOk++;
      console.log(`  ✓ ${art.title}`);
    } catch (err) {
      console.error(`  ✗ blog ${art.slug}: ${err.message}`);
    }
  }

  // Summary
  const tc = await prisma.tour.count();
  const dc = await prisma.destination.count();
  const bc = await prisma.blogPost.count();
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  ✅ Done: ${tourOk} tours + ${blogOk} blog articles seeded`);
  console.log(`  DB totals: ${dc} destinations, ${tc} tours, ${bc} blogs`);
  console.log('══════════════════════════════════════════════════');
}

main()
  .catch((e) => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());