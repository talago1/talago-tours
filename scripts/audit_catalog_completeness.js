const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateCompleteness(tour) {
  const translations = tour.translations || {};
  const en = translations.en || {};

  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
  const enHighlights = Array.isArray(en.highlights) ? en.highlights : [];
  const inclusions = Array.isArray(tour.inclusions) ? tour.inclusions : [];
  const enInclusions = Array.isArray(en.inclusions) ? en.inclusions : [];
  const galleryImages = Array.isArray(tour.galleryImages) ? tour.galleryImages : [];
  const pickupTimes = Array.isArray(tour.pickupTimes) ? tour.pickupTimes : [];
  const itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
  const safetyGuidelines = Array.isArray(tour.safetyGuidelines) ? tour.safetyGuidelines : [];
  const enSafety = Array.isArray(en.safetyGuidelines) ? en.safetyGuidelines : [];

  const checks = [
    {
      name: 'Title & Slug',
      complete: Boolean((tour.slug || '').trim() && ((en.title || '').trim() || (translations.ru || {}).title || (translations.de || {}).title)),
      weight: 15,
      message: 'Provide a title and unique URL slug',
      critical: true,
    },
    {
      name: 'Destination & Zone',
      complete: Boolean(tour.zoneId || tour.destinationId),
      weight: 10,
      message: 'Select a destination and pickup zone',
      critical: true,
    },
    {
      name: 'Cover Image',
      complete: Boolean((tour.coverImage || '').trim()),
      weight: 15,
      message: 'Upload or select a primary cover image',
      critical: true,
    },
    {
      name: 'Gallery (2+ Photos)',
      complete: galleryImages.filter(Boolean).length >= 2,
      weight: 5,
      message: 'Add at least 2 gallery images for the photo slider',
      critical: false,
    },
    {
      name: 'Pricing & Capacity',
      complete: Boolean((tour.adultPrice > 0 || tour.basePriceUSD > 0) && tour.durationHours > 0 && tour.maxCapacity > 0),
      weight: 15,
      message: 'Set an adult price, tour duration, and maximum guest capacity',
      critical: true,
    },
    {
      name: 'Full Description',
      complete: Boolean(((en.description || '').trim().length > 30) || ((translations.ru || {}).description || '').trim().length > 30),
      weight: 10,
      message: 'Provide a thorough tour description (min 30 characters)',
      critical: true,
    },
    {
      name: 'Highlights & Inclusions',
      complete: Boolean(
        (highlights.length > 0 || enHighlights.length > 0) &&
        (inclusions.length > 0 || enInclusions.length > 0)
      ),
      weight: 10,
      message: 'Add at least one highlight and one inclusion',
      critical: false,
    },
    {
      name: 'Itinerary / Timeline',
      complete: Boolean(itinerary.length > 0),
      weight: 8,
      message: 'Add at least one milestone to the itinerary timeline',
      critical: false,
    },
    {
      name: 'Pickup & Logistics',
      complete: Boolean(tour.pickupDescription || en.pickupDescription || pickupTimes.length > 0 || tour.meetingPointName || tour.pickupTime),
      weight: 7,
      message: 'Configure pickup instructions, pickup times, or a meeting point',
      critical: false,
    },
    {
      name: 'Cancellation Policy',
      complete: Boolean((tour.cancellationPolicy || '').trim() || (en.cancellationPolicy || '').trim()),
      weight: 5,
      message: 'Describe the cancellation and refund policy',
      critical: false,
    },
    {
      name: 'SEO Metadata',
      complete: Boolean((en.seoTitle || '').trim() || (en.seoDescription || '').trim() || (translations.ru || {}).seoTitle),
      weight: 5,
      message: 'Add a custom SEO title and meta description for search visibility',
      critical: false,
    },
    {
      name: 'Safety Guidelines',
      complete: safetyGuidelines.length > 0 || enSafety.length > 0,
      weight: 5,
      message: 'Add at least one safety guideline or requirement for participants',
      critical: false,
    },
  ];

  const totalPossible = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.complete ? c.weight : 0), 0);
  const score = Math.round((earned / totalPossible) * 100);

  const missingChecks = checks.filter(c => !c.complete);

  return { score, checks, missingChecks };
}

async function main() {
  const tours = await prisma.tour.findMany({
    orderBy: { slug: 'asc' },
  });

  console.log(`Total tours in database: ${tours.length}`);

  const results = tours.map(tour => {
    const analysis = calculateCompleteness(tour);
    return {
      id: tour.id,
      slug: tour.slug,
      status: tour.status || 'PUBLISHED',
      score: analysis.score,
      missing: analysis.missingChecks.map(m => m.name),
      criticalMissing: analysis.missingChecks.filter(m => m.critical).map(m => m.name),
    };
  });

  // Sort by score ascending (most incomplete first)
  results.sort((a, b) => a.score - b.score);

  console.log('\n=== TOUR COMPLETENESS REPORT ===');
  results.forEach(r => {
    const statusIcon = r.score >= 85 ? '🟢' : r.score >= 60 ? '🟡' : '🔴';
    console.log(`${statusIcon} [${r.score}%] ${r.slug} (${r.status})`);
    if (r.criticalMissing.length > 0) {
      console.log(`    ⚠️ CRITICAL MISSING: ${r.criticalMissing.join(', ')}`);
    }
    if (r.missing.length > 0) {
      console.log(`    Missing: ${r.missing.join(', ')}`);
    }
  });

  console.log('\n=== SUMMARY ===');
  const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  const below70 = results.filter(r => r.score < 70);
  const below90 = results.filter(r => r.score >= 70 && r.score < 90);
  const optimal = results.filter(r => r.score >= 90);
  console.log(`Average completeness score: ${avg}%`);
  console.log(`High priority (<70%): ${below70.length}`);
  console.log(`Medium priority (70-89%): ${below90.length}`);
  console.log(`Production ready (>=90%): ${optimal.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

