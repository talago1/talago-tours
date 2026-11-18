/*
 * TALAGO Catalog Reset & Historical Decoupling Script
 *
 * 1. Backfills 830 Bookings with immutable historical snapshots (title, slug, destination, full JSON).
 * 2. Decouples Bookings by setting tourId = null.
 * 3. Enqueues 799 Reviews into the Legacy Review Migration Queue with legacyTourSlug, legacyTourTitle, isLegacyQueued = true.
 * 4. Decouples Reviews by setting tourId = null.
 * 5. Cleans up old tour operational rules (TourScheduleRule).
 * 6. Deletes all old Tour records from the database.
 * 7. Prunes non-core destinations, retaining exactly the 5 approved core destinations:
 *    Hurghada, Sharm El Sheikh, Marsa Alam, Cairo, Luxor.
 *
 * Usage:
 *   node scripts/execute_catalog_reset.js --dry-run
 *   node scripts/execute_catalog_reset.js --apply
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

const CORE_DESTINATION_SLUGS = [
  'hurghada',
  'sharm-el-sheikh',
  'marsa-alam',
  'cairo',
  'luxor'
];

async function main() {
  console.log(`=== TALAGO FULL PRODUCTION CATALOG RESET & DEEP CLEAN ===`);
  console.log(`Mode: ${APPLY ? '🚨 APPLY (Destructive Reset with Safe Decoupling)' : '🔍 DRY-RUN (Preview only)'}\n`);

  // 1. Initial counts
  const [
    initialTours,
    initialBookings,
    initialReviews,
    initialDestinations,
    initialTransactions,
    initialCustomers
  ] = await Promise.all([
    prisma.tour.count(),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.destination.count(),
    prisma.transaction.count(),
    prisma.customerProfile.count()
  ]);

  console.log(`CURRENT DATABASE AUDIT:`);
  console.log(` - Tours: ${initialTours}`);
  console.log(` - Bookings: ${initialBookings}`);
  console.log(` - Reviews: ${initialReviews}`);
  console.log(` - Destinations: ${initialDestinations}`);
  console.log(` - Transactions: ${initialTransactions}`);
  console.log(` - Customer Profiles: ${initialCustomers}`);

  // Fetch all tours into a map
  const allTours = await prisma.tour.findMany({
    include: {
      destination: { select: { slug: true, name: true } }
    }
  });
  const tourMap = new Map();
  allTours.forEach(t => tourMap.set(t.id, t));

  // 2. BACKFILL & DECOUPLE BOOKINGS
  console.log(`\n========================================`);
  console.log(`STEP 1: Bookings Historical Preservation`);
  console.log(`========================================`);

  const bookings = await prisma.booking.findMany({
    select: { id: true, bookingReference: true, tourId: true }
  });

  let bookingsWithTour = 0;
  let bookingsWithoutTour = 0;
  bookings.forEach(b => {
    if (b.tourId && tourMap.has(b.tourId)) bookingsWithTour++;
    else bookingsWithoutTour++;
  });

  console.log(`Total Bookings to preserve: ${bookings.length}`);
  console.log(` - Matched to current Tour rows: ${bookingsWithTour}`);
  console.log(` - Already decoupled or unlinked: ${bookingsWithoutTour}`);

  if (APPLY) {
    console.log(`Applying immutable historical snapshots to all ${bookings.length} bookings in concurrent batches...`);
    let updatedBookings = 0;
    const CHUNK_SIZE = 25;

    for (let i = 0; i < bookings.length; i += CHUNK_SIZE) {
      const chunk = bookings.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (b) => {
        const tour = b.tourId ? tourMap.get(b.tourId) : null;
        const title = tour ? (tour.translations?.en?.title || tour.slug) : 'Historical Experience';
        const slug = tour?.slug || 'historical-experience';
        const destName = tour?.destination?.name || 'Egypt';

        const snapshot = tour ? {
          id: tour.id,
          slug: tour.slug,
          title,
          category: tour.category,
          type: tour.type,
          destination: tour.destination?.name,
          destinationSlug: tour.destination?.slug,
          basePriceUSD: tour.basePriceUSD,
          adultPrice: tour.adultPrice,
          childPrice: tour.childPrice,
          durationHours: tour.durationHours,
          coverImage: tour.coverImage,
          translations: tour.translations,
          itinerary: tour.itinerary,
          inclusions: tour.inclusions,
          exclusions: tour.exclusions
        } : null;

        await prisma.booking.update({
          where: { id: b.id },
          data: {
            tourTitleSnapshot: title,
            tourSlugSnapshot: slug,
            destinationNameSnapshot: destName,
            historicalTourSnapshot: snapshot,
            tourId: null // safely decouple from Tour table
          }
        });
        updatedBookings++;
      }));
      console.log(`  Decoupled and snapshot-preserved ${updatedBookings}/${bookings.length} bookings...`);
    }
    console.log(`✅ All ${updatedBookings} bookings successfully decoupled with full immutable snapshots.`);
  } else {
    console.log(`[DRY-RUN] Would snapshot and decouple ${bookings.length} bookings.`);
  }

  // 3. BACKFILL & DECOUPLE REVIEWS (Legacy Review Migration Queue)
  console.log(`\n========================================`);
  console.log(`STEP 2: Reviews Legacy Migration Queue`);
  console.log(`========================================`);

  const reviews = await prisma.review.findMany({
    select: { id: true, tourId: true, reviewerName: true, rating: true }
  });

  console.log(`Total Reviews to preserve in Legacy Migration Queue: ${reviews.length}`);

  if (APPLY) {
    console.log(`Enqueuing all ${reviews.length} reviews into Legacy Review Migration Queue in concurrent batches...`);
    let updatedReviews = 0;
    const CHUNK_SIZE = 25;

    for (let i = 0; i < reviews.length; i += CHUNK_SIZE) {
      const chunk = reviews.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (r) => {
        const tour = r.tourId ? tourMap.get(r.tourId) : null;
        const title = tour ? (tour.translations?.en?.title || tour.slug) : 'Historical Tour';
        const slug = tour?.slug || 'historical-tour';
        const destName = tour?.destination?.name || 'Egypt';

        await prisma.review.update({
          where: { id: r.id },
          data: {
            legacyTourSlug: slug,
            legacyTourTitle: title,
            legacyTourDestination: destName,
            isLegacyQueued: true,
            tourId: null // safely decouple from Tour table
          }
        });
        updatedReviews++;
      }));
      console.log(`  Enqueued ${updatedReviews}/${reviews.length} reviews...`);
    }
    console.log(`✅ All ${updatedReviews} reviews successfully queued with legacy tour metadata.`);
  } else {
    console.log(`[DRY-RUN] Would enqueue ${reviews.length} reviews into Legacy Review Migration Queue.`);
  }

  // 4. CLEANUP OTHER TOUR-DEPENDENT ROWS
  console.log(`\n========================================`);
  console.log(`STEP 3: Tour Rules & Metadata Cleanup`);
  console.log(`========================================`);

  const scheduleRulesCount = await prisma.tourScheduleRule.count();
  const bookingLeadsCount = await prisma.bookingLead.count({ where: { tourId: { not: null } } });
  console.log(` - TourScheduleRules to remove: ${scheduleRulesCount}`);
  console.log(` - BookingLeads with tourId: ${bookingLeadsCount}`);

  if (APPLY) {
    if (scheduleRulesCount > 0) {
      await prisma.tourScheduleRule.deleteMany({});
      console.log(`✅ Removed ${scheduleRulesCount} obsolete tour schedule rules.`);
    }
    if (bookingLeadsCount > 0) {
      await prisma.bookingLead.updateMany({
        where: { tourId: { not: null } },
        data: { tourId: null }
      });
      console.log(`✅ Decoupled ${bookingLeadsCount} booking leads.`);
    }
  }

  // 5. EXECUTE CATALOG RESET (DELETE ALL TOURS)
  console.log(`\n========================================`);
  console.log(`STEP 4: Physical Tour Catalog Reset`);
  console.log(`========================================`);

  console.log(`Physical removal target: ALL ${initialTours} tours.`);

  if (APPLY) {
    const deleteResult = await prisma.tour.deleteMany({});
    console.log(`✅ PHYSICALLY DELETED: ${deleteResult.count} Tour records removed from database!`);
  } else {
    console.log(`[DRY-RUN] Would delete all ${initialTours} tour rows.`);
  }

  // 6. DESTINATION RESET (RETAIN EXACTLY 5 APPROVED CORE DESTINATIONS)
  console.log(`\n========================================`);
  console.log(`STEP 5: Destination Reset`);
  console.log(`========================================`);

  const destinations = await prisma.destination.findMany({
    select: { id: true, slug: true, name: true }
  });

  const toKeep = destinations.filter(d => CORE_DESTINATION_SLUGS.includes(d.slug));
  const toRemove = destinations.filter(d => !CORE_DESTINATION_SLUGS.includes(d.slug));

  console.log(`Approved Core Destinations to Retain (${toKeep.length}):`);
  toKeep.forEach(d => console.log(` + ${d.slug} ("${d.name}")`));

  console.log(`\nObsolete Destinations to Remove (${toRemove.length}):`);
  toRemove.forEach(d => console.log(` - ${d.slug} ("${d.name}")`));

  if (APPLY) {
    for (const d of toRemove) {
      // Disconnect any zones if present
      await prisma.zone.updateMany({
        where: { destinationId: d.id },
        data: { destinationId: null }
      });
      await prisma.destination.delete({ where: { id: d.id } });
      console.log(`  ✓ Removed destination: ${d.slug}`);
    }
    console.log(`✅ Destination catalog reset complete. Exactly 5 core destinations retained.`);
  } else {
    console.log(`[DRY-RUN] Would delete ${toRemove.length} obsolete destination records.`);
  }

  // 7. FINAL AUDIT
  const [
    finalTours,
    finalActiveTours,
    finalDraftTours,
    finalInactiveTours,
    finalBookings,
    finalReviews,
    finalQueuedReviews,
    finalDestinations,
    finalTransactions,
    finalCustomers
  ] = await Promise.all([
    prisma.tour.count(),
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.tour.count({ where: { status: 'DRAFT' } }),
    prisma.tour.count({ where: { status: 'INACTIVE' } }),
    prisma.booking.count(),
    prisma.review.count(),
    prisma.review.count({ where: { isLegacyQueued: true } }),
    prisma.destination.count(),
    prisma.transaction.count(),
    prisma.customerProfile.count()
  ]);

  console.log(`\n========================================`);
  console.log(`FINAL DATABASE STATE (AFTER EXECUTION):`);
  console.log(` - Total Tours: ${finalTours} (Target: 0)`);
  console.log(` - ACTIVE Tours: ${finalActiveTours}`);
  console.log(` - DRAFT Tours: ${finalDraftTours}`);
  console.log(` - INACTIVE Tours: ${finalInactiveTours}`);
  console.log(` - Historical Bookings Preserved: ${finalBookings} (Target: ${initialBookings})`);
  console.log(` - Historical Reviews Preserved: ${finalReviews} (Target: ${initialReviews})`);
  console.log(` - Reviews in Legacy Migration Queue: ${finalQueuedReviews}`);
  console.log(` - Approved Destinations: ${finalDestinations} (Target: 5)`);
  console.log(` - Payment Transactions: ${finalTransactions} (Target: ${initialTransactions})`);
  console.log(` - Customer Profiles: ${finalCustomers} (Target: ${initialCustomers})`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('CRITICAL RESET ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
