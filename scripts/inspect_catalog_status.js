const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      destination: { select: { slug: true, name: true } },
      coverImage: true,
      translations: true,
      itinerary: true,
    }
  });

  console.log('Total tours in DB:', tours.length);
  const byDest = {};
  let emptyImages = [];
  let missingTranslations = [];
  let emptyItineraries = [];
  let singleLetterTranslations = [];
  const langs = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];

  for (const t of tours) {
    const dest = t.destination?.slug || 'NO_DEST';
    byDest[dest] = (byDest[dest] || 0) + 1;
    if (!t.coverImage || t.coverImage.trim() === '') {
      emptyImages.push(t.slug);
    }
    const trans = t.translations || {};
    let missing = [];
    let dummy = [];
    for (const l of langs) {
      if (!trans[l] || !trans[l].title || typeof trans[l].title !== 'string') {
        missing.push(l);
      } else if (trans[l].title.length <= 2 || trans[l].description === 'd') {
        dummy.push(l);
      }
    }
    if (missing.length > 0) {
      missingTranslations.push({ slug: t.slug, missing });
    }
    if (dummy.length > 0) {
      singleLetterTranslations.push({ slug: t.slug, dummy });
    }

    const hasEnItin = Array.isArray(trans.en?.itinerary) && trans.en.itinerary.length > 0;
    const hasTopItin = Array.isArray(t.itinerary) && t.itinerary.length > 0;
    if (!hasEnItin && !hasTopItin) {
      emptyItineraries.push(t.slug);
    }
  }

  console.log('Tours by Destination:', JSON.stringify(byDest, null, 2));
  console.log('Empty Cover Images count:', emptyImages.length, emptyImages);
  console.log('Missing Languages count:', missingTranslations.length);
  if (missingTranslations.length > 0) console.log('Sample missing:', missingTranslations.slice(0, 5));
  console.log('Single-letter / Dummy translations count:', singleLetterTranslations.length, singleLetterTranslations);
  console.log('Empty Itineraries count:', emptyItineraries.length, emptyItineraries);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
