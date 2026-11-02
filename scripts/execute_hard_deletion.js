const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function executeHardDeletion() {
  console.log('=== STARTING PERMANENT HARD DELETION AUDIT & EXECUTION ===');

  const allTours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      _count: {
        select: {
          bookings: true
        }
      }
    }
  });

  const genuineReviews = await prisma.review.findMany({
    where: { isSeeded: false },
    select: { tourId: true }
  });

  const toursWithGenuineReviews = new Set(genuineReviews.map(r => r.tourId));

  const toRetain = [];
  const toDelete = [];

  for (const tour of allTours) {
    const bookingCount = tour._count.bookings;
    const hasGenuineReview = toursWithGenuineReviews.has(tour.id);

    if (bookingCount > 0 || hasGenuineReview) {
      toRetain.push({
        id: tour.id,
        slug: tour.slug,
        bookingCount,
        hasGenuineReview
      });
    } else {
      toDelete.push({
        id: tour.id,
        slug: tour.slug
      });
    }
  }

  console.log(`Total tours found in DB: ${allTours.length}`);
  console.log(`Retained tours (booking > 0 OR genuine review > 0): ${toRetain.length}`);
  console.log(`Eligible for permanent hard deletion (0 bookings AND 0 genuine reviews): ${toDelete.length}`);

  if (toRetain.length !== 38 || toDelete.length !== 193) {
    throw new Error(`Integrity check failed: Expected 38 retain and 193 delete, found ${toRetain.length} retain and ${toDelete.length} delete`);
  }

  const deleteIds = toDelete.map((t) => t.id);
  console.log(`\nPreparing to delete ${deleteIds.length} tours...`);

  // Step 1: Detach tourId on any matching BookingLead records to preserve customer lead CRM history
  const leadsUpdated = await prisma.bookingLead.updateMany({
    where: { tourId: { in: deleteIds } },
    data: { tourId: null }
  });
  console.log(`[PRE-CLEANUP] Detached tourId on ${leadsUpdated.count} BookingLead records.`);

  // Step 2: Delete seeded dummy reviews attached to the 193 deleted tours
  const deletedSeededReviews = await prisma.review.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${deletedSeededReviews.count} seeded dummy reviews from deleted tours.`);

  // Step 3: Delete any dependent records if present
  const timeSlotsDeleted = await prisma.tourTimeSlot.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${timeSlotsDeleted.count} TourTimeSlot records.`);

  const mediaDeleted = await prisma.mediaAsset.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${mediaDeleted.count} MediaAsset records.`);

  const availDeleted = await prisma.tourAvailability.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${availDeleted.count} TourAvailability records.`);

  const schedDeleted = await prisma.tourScheduleRule.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${schedDeleted.count} TourScheduleRule records.`);

  const abandonedDeleted = await prisma.abandonedCheckout.deleteMany({
    where: { tourId: { in: deleteIds } }
  });
  console.log(`[PRE-CLEANUP] Deleted ${abandonedDeleted.count} AbandonedCheckout records.`);

  // Step 4: Hard delete the 193 tours in safe batches
  const batchSize = 25;
  let totalDeletedTours = 0;

  for (let i = 0; i < deleteIds.length; i += batchSize) {
    const chunk = deleteIds.slice(i, i + batchSize);
    const deleteResult = await prisma.tour.deleteMany({
      where: { id: { in: chunk } }
    });
    totalDeletedTours += deleteResult.count;
    console.log(`[BATCH] Deleted ${deleteResult.count} tours (Progress: ${totalDeletedTours}/${deleteIds.length})`);
  }

  // Step 5: Post-deletion verification
  const remainingCount = await prisma.tour.count();
  const totalBookingsAfter = await prisma.booking.count();
  const totalReviewsAfter = await prisma.review.count();
  const genuineReviewsAfter = await prisma.review.count({ where: { isSeeded: false } });

  console.log('\n=== POST-DELETION VERIFICATION ===');
  console.log(`Tours remaining in DB: ${remainingCount} (Expected: 38)`);
  console.log(`Bookings in DB: ${totalBookingsAfter} (Expected: 818)`);
  console.log(`Total reviews in DB: ${totalReviewsAfter} (Expected: 797)`);
  console.log(`Genuine customer reviews in DB: ${genuineReviewsAfter} (Expected: 651)`);

  if (remainingCount !== 38) {
    throw new Error(`Verification failed: Expected 38 tours, got ${remainingCount}`);
  }
  if (totalBookingsAfter !== 818) {
    throw new Error(`Verification failed: Expected 818 bookings, got ${totalBookingsAfter}`);
  }
  if (genuineReviewsAfter !== 651) {
    throw new Error(`Verification failed: Expected 651 genuine reviews, got ${genuineReviewsAfter}`);
  }

  console.log('\nSUCCESS: 193 unused tours permanently deleted. 38 active tours preserved with 100% data integrity.');
}

executeHardDeletion()
  .catch((err) => {
    console.error('Hard deletion failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
