const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REQUIRED_LANGS = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];

async function validateCatalog() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('       TALAGO GLOBAL CATALOG VALIDATOR & AUDIT SUITE         ');
  console.log('══════════════════════════════════════════════════════════════\n');

  let errors = [];
  let warnings = [];

  // 1. Audit Destinations
  console.log('📍 1. Auditing Destinations...');
  const destinations = await prisma.destination.findMany({
    include: { _count: { select: { tours: true } } },
  });
  console.log(`   Found ${destinations.length} destinations.`);

  if (destinations.length < 15) {
    warnings.push(`Expected at least 15 destinations, found ${destinations.length}.`);
  }

  for (const d of destinations) {
    if (!d.slug || d.slug.trim() === '') errors.push(`Destination ID ${d.id} has empty slug.`);
    if (!d.name || d.name.trim() === '') errors.push(`Destination ${d.slug} has empty name.`);
    if (!d.imageUrl || d.imageUrl.trim() === '') warnings.push(`Destination ${d.slug} missing imageUrl.`);

    const trans = d.translations || {};
    for (const lang of REQUIRED_LANGS) {
      if (!trans[lang] || !trans[lang].name) {
        warnings.push(`Destination ${d.slug} missing ${lang} name translation.`);
      }
    }
  }

  // 2. Audit Tours
  console.log('\n🎯 2. Auditing Tours...');
  const tours = await prisma.tour.findMany({
    include: {
      destination: { select: { id: true, slug: true, name: true } },
      zone: { select: { id: true, name: true } },
    },
  });
  console.log(`   Found ${tours.length} tours.`);

  const slugSet = new Set();

  for (const t of tours) {
    const prefix = `[Tour ${t.slug || t.id}]`;

    // Slugs
    if (!t.slug || t.slug.trim() === '') {
      errors.push(`${prefix} has empty slug.`);
    } else if (slugSet.has(t.slug)) {
      errors.push(`${prefix} DUPLICATE SLUG detected!`);
    } else {
      slugSet.add(t.slug);
    }

    // Destination relation
    if (!t.destinationId || !t.destination) {
      errors.push(`${prefix} has no linked destination.`);
    }

    // Cover image
    if (!t.coverImage || t.coverImage.trim() === '') {
      errors.push(`${prefix} missing cover image.`);
    } else if (!t.coverImage.startsWith('http://') && !t.coverImage.startsWith('https://') && !t.coverImage.startsWith('/')) {
      errors.push(`${prefix} has invalid cover image URL: ${t.coverImage}`);
    }

    // Pricing
    const price = Number(t.basePriceUSD ?? t.adultPrice ?? t.basePrice ?? 0);
    if (price <= 0) {
      warnings.push(`${prefix} has zero or negative price: $${price}`);
    }

    // Translations & Content
    const trans = t.translations || {};
    let hasItinerary = false;

    // Check top-level itinerary
    if (Array.isArray(t.itinerary) && t.itinerary.length > 0) {
      hasItinerary = true;
    }

    for (const lang of REQUIRED_LANGS) {
      const lData = trans[lang];
      if (!lData) {
        errors.push(`${prefix} missing translations.${lang}`);
        continue;
      }

      if (!lData.title || typeof lData.title !== 'string' || lData.title.trim().length <= 2) {
        errors.push(`${prefix} invalid or empty title in [${lang}]: "${lData.title}"`);
      }

      if (!lData.description || typeof lData.description !== 'string' || lData.description.trim().length <= 10) {
        warnings.push(`${prefix} short/empty description in [${lang}]`);
      }

      if (Array.isArray(lData.itinerary) && lData.itinerary.length > 0) {
        hasItinerary = true;
      }
    }

    if (!hasItinerary) {
      errors.push(`${prefix} has NO structured itinerary milestones!`);
    }
  }

  // 3. Audit Blog Articles
  console.log('\n📝 3. Auditing Blog Articles...');
  const blogPosts = await prisma.blogPost.findMany();
  console.log(`   Found ${blogPosts.length} blog articles.`);

  for (const b of blogPosts) {
    const prefix = `[Blog ${b.slug || b.id}]`;
    if (!b.slug || b.slug.trim() === '') errors.push(`${prefix} has empty slug.`);
    if (!b.title || b.title.trim() === '') errors.push(`${prefix} has empty title.`);
    if (!b.coverImage || b.coverImage.trim() === '') warnings.push(`${prefix} missing cover image.`);
    if (!b.content || b.content.trim().length < 50) errors.push(`${prefix} has empty or trivial content.`);
  }

  // Report
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('                      AUDIT SUMMARY                          ');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Destinations audited: ${destinations.length}`);
  console.log(`Tours audited:        ${tours.length}`);
  console.log(`Blog posts audited:   ${blogPosts.length}`);
  console.log(`Total Errors:         ${errors.length}`);
  console.log(`Total Warnings:       ${warnings.length}`);

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.slice(0, 10).forEach((w) => console.log(`   - ${w}`));
    if (warnings.length > 10) console.log(`   ... and ${warnings.length - 10} more warnings.`);
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((e) => console.log(`   - ${e}`));
    console.log('\n❌ VALIDATION FAILED!');
    process.exit(1);
  } else {
    console.log('\n✅ ALL CATALOG VALIDATIONS PASSED PERFECTLY!');
  }
}

validateCatalog()
  .catch((err) => {
    console.error('Fatal error during validation:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
