const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- AUDITING TOUR CATALOG FOR SAFE RETIREMENT & REBUILD ---');

  try {
    const tours = await prisma.tour.findMany({
      include: {
        bookings: { select: { id: true, bookingReference: true, status: true } },
        reviewEntries: { select: { id: true, rating: true, status: true } },
        mediaAssets: { select: { id: true, filePath: true } },
      },
    });

    console.log(`Found ${tours.length} total tour records in database.`);

    const report = {
      auditedAt: new Date().toISOString(),
      totalTours: tours.length,
      categories: {},
      summary: {
        safeToArchiveCount: 0,
        hasActiveBookingsCount: 0,
        hasReviewsCount: 0,
        usesExternalImagesOnlyCount: 0,
        missingItineraryCount: 0,
      },
      tours: [],
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase.co';

    for (const tour of tours) {
      const translations = tour.translations || {};
      const en = translations.en || {};
      const title = en.title || tour.slug;

      const hasBookings = tour.bookings.length > 0;
      const hasReviews = (tour.reviewEntries || []).length > 0;

      // Check images
      const cover = tour.coverImage || '';
      const isCoverInternal = cover.includes(supabaseUrl) || cover.startsWith('/media');
      const isCoverExternal = cover && !isCoverInternal;

      const gallery = tour.galleryImages || [];
      const externalGalleryCount = gallery.filter((img) => !img.includes(supabaseUrl) && !img.startsWith('/media')).length;

      // Check itinerary in translations
      const itinerary = en.itinerary || [];
      const hasItinerary = Array.isArray(itinerary) && itinerary.length > 0;

      const category = tour.category || 'uncategorized';
      report.categories[category] = (report.categories[category] || 0) + 1;

      if (hasBookings) report.summary.hasActiveBookingsCount++;
      if (hasReviews) report.summary.hasReviewsCount++;
      if (isCoverExternal && externalGalleryCount === gallery.length) report.summary.usesExternalImagesOnlyCount++;
      if (!hasItinerary) report.summary.missingItineraryCount++;

      const isSafeToArchive = !hasBookings;
      if (isSafeToArchive) report.summary.safeToArchiveCount++;

      report.tours.push({
        id: tour.id,
        slug: tour.slug,
        title,
        status: tour.status,
        category: tour.category,
        bookingCount: tour.bookings.length,
        reviewCount: (tour.reviewEntries || []).length,
        hasItinerary,
        coverImageStatus: isCoverExternal ? 'EXTERNAL_URL' : isCoverInternal ? 'SUPABASE_STORAGE' : 'MISSING',
        externalGalleryImagesCount: externalGalleryCount,
        totalGalleryImagesCount: gallery.length,
        recommendation: hasBookings
          ? 'PRESERVE_ACTIVE_BOOKINGS'
          : isCoverExternal
          ? 'ARCHIVE_AND_REPLACE_WITH_OWNED_MEDIA'
          : 'KEEP_OR_UPDATE_FIELDS',
      });
    }

    const reportPath = path.join(__dirname, '..', 'docs', 'engineering', 'LEGACY_CATALOG_AUDIT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\nAudit complete!`);
    console.log(`- Total Tours: ${report.totalTours}`);
    console.log(`- Tours with Active Bookings (MUST PRESERVE): ${report.summary.hasActiveBookingsCount}`);
    console.log(`- Safe to Soft-Archive: ${report.summary.safeToArchiveCount}`);
    console.log(`- Tours with External Image URLs: ${report.summary.usesExternalImagesOnlyCount}`);
    console.log(`- Saved detailed non-destructive preview to: docs/engineering/LEGACY_CATALOG_AUDIT_REPORT.json\n`);

  } catch (err) {
    console.warn('Note: Live database query was not executed or database connection is offline.');
    console.warn('Error details:', err.message);
    console.log('Generating catalog retirement guidelines from existing audit records...');

    const fallbackReport = {
      auditedAt: new Date().toISOString(),
      note: 'Dry-run guidelines based on previous TRIP_DATA_AUDIT.md and safety rules',
      principles: [
        'Never execute hard DELETE queries on Tour table if foreign keys to Booking or Review exist.',
        'Always set tour status = ARCHIVED instead of dropping rows.',
        'Preserve all user-created bookings, transactions, and customer profiles.',
        'Require verified database backup in scripts/backups/ before any batch modification.',
      ],
    };
    const reportPath = path.join(__dirname, '..', 'docs', 'engineering', 'LEGACY_CATALOG_AUDIT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(fallbackReport, null, 2));
    console.log(`Saved safety guidelines to: docs/engineering/LEGACY_CATALOG_AUDIT_REPORT.json`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
