const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const configPath = path.join(__dirname, 'data/destinations_config.js');
let configText = fs.readFileSync(configPath, 'utf8');

const images = {
  aswan: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?w=1200&q=80',
  alexandria: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=80',
  'el-gouna': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  'makadi-bay': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  'sahl-hasheesh': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80',
  'soma-bay': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
  safaga: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1200&q=80',
  fayoum: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
  siwa: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
  'el-alamein': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80',
};

// Update empty image URLs in destinations_config.js
for (const [slug, url] of Object.entries(images)) {
  const regex = new RegExp(`(slug:\\s*['"]${slug}['"][\\s\\S]*?imageUrl:\\s*)['"]['"]`, 'm');
  configText = configText.replace(regex, `$1'${url}'`);
}

fs.writeFileSync(configPath, configText, 'utf8');
console.log('✓ Updated image URLs in scripts/data/destinations_config.js');

async function seedAllDestinations() {
  delete require.cache[require.resolve('./data/destinations_config')];
  const { DESTINATIONS } = require('./data/destinations_config');

  console.log(`Seeding ${DESTINATIONS.length} Egypt destinations...`);
  for (const d of DESTINATIONS) {
    const res = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        description: d.description,
        imageUrl: d.imageUrl,
        countryCode: d.countryCode,
        region: d.region,
        city: d.city,
        latitude: d.latitude,
        longitude: d.longitude,
        translations: d.translations,
      },
      create: d,
    });
    console.log(`  ✓ ${res.slug} (${res.name}) - ${res.city || res.region}`);
  }

  // Check if siwa-oasis exists and map to siwa or keep it synchronized
  const siwaOasis = await prisma.destination.findUnique({ where: { slug: 'siwa-oasis' } });
  const siwa = await prisma.destination.findUnique({ where: { slug: 'siwa' } });
  if (siwaOasis && siwa) {
    // If tours are tied to siwa-oasis, we can update them to siwa or sync siwa-oasis
    await prisma.tour.updateMany({
      where: { destinationId: siwaOasis.id },
      data: { destinationId: siwa.id },
    });
    console.log('  ✓ Re-linked any tours from siwa-oasis to canonical siwa');
  }

  const total = await prisma.destination.count();
  console.log(`Total destinations in DB now: ${total}`);
}

seedAllDestinations()
  .catch((e) => {
    console.error('Error seeding destinations:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
