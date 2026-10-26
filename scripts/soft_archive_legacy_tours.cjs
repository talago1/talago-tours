/**
 * scripts/soft_archive_legacy_tours.cjs
 *
 * Soft-archives qualifying legacy tours (status -> 'ARCHIVED').
 *
 * SAFETY RULES:
 *   - NEVER issues DELETE queries. ZERO rows are dropped.
 *   - Tours with active or historical Bookings (bookings.length > 0) are strictly PRESERVED and NEVER modified.
 *   - Qualifying criteria:
 *       1. Zero linked bookings.
 *       2. Status is currently not already 'ARCHIVED'.
 *       3. Uses external images (or explicitly marked legacy/unverified).
 *   - Default mode is DRY-RUN. Prints the exact list of tours and reasons.
 *   - Requires `--execute` flag to apply changes to database.
 *
 * Usage:
 *   node scripts/soft_archive_legacy_tours.cjs            # Dry-run preview
 *   node scripts/soft_archive_legacy_tours.cjs --execute  # Applies status = 'ARCHIVED'
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const isExecute = args.includes('--execute');

async function main() {
  console.log('===============================================================');
  console.log('TALAGO TOURS — SAFE CATALOG SOFT-ARCHIVAL SCRIPT (TAL-D5)');
  console.log('===============================================================');
  console.log(`Execution Mode : ${isExecute ? '⚡ LIVE EXECUTE (Writes status = ARCHIVED)' : '🛡️ DRY-RUN PREVIEW (No changes made)'}`);
  console.log(`Safety Policy  : Soft-archival only. ZERO deletions. Tours with bookings are untouched.\n`);

  try {
    const tours = await prisma.tour.findMany({
      include: {
        bookings: {
          select: { id: true, bookingReference: true, status: true },
        },
        reviewEntries: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Found ${tours.length} total tours in database.`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase.co';

    const candidates = [];
    const protectedWithBookings = [];
    const alreadyArchived = [];

    for (const tour of tours) {
      const translations = tour.translations || {};
      const en = translations.en || {};
      const title = en.title || tour.slug;

      if (tour.bookings.length > 0) {
        protectedWithBookings.push({
          id: tour.id,
          slug: tour.slug,
          title,
          bookingCount: tour.bookings.length,
          status: tour.status,
        });
        continue;
      }

      if (tour.status === 'ARCHIVED') {
        alreadyArchived.push({
          id: tour.id,
          slug: tour.slug,
          title,
        });
        continue;
      }

      // Check image source
      const cover = tour.coverImage || '';
      const isInternalCover = cover.includes(supabaseUrl) || cover.startsWith('/media');
      const gallery = tour.galleryImages || [];
      const externalGallery = gallery.filter((img) => !img.includes(supabaseUrl) && !img.startsWith('/media'));
      const isExternal = (!isInternalCover && cover.length > 0) || externalGallery.length > 0;

      const isLegacyImport = tour.slug.startsWith('egypt-gate-');

      // SAFETY: Strictly only archive legacy Egypt Gate imports (162 tours).
      // Genuine curated Talago tours without bookings must NEVER be accidentally archived.
      if (!isLegacyImport) {
        continue;
      }

      candidates.push({
        id: tour.id,
        slug: tour.slug,
        title,
        currentStatus: tour.status,
        hasExternalImages: isExternal,
        reviewCount: tour.reviewEntries.length,
      });
    }

    console.log(`\n--- SUMMARY OF CATALOG BREAKDOWN ---`);
    console.log(`🛡️  Protected (Have Bookings) : ${protectedWithBookings.length} tours (MUST NEVER BE ARCHIVED)`);
    console.log(`📁  Already Archived          : ${alreadyArchived.length} tours`);
    console.log(`🎯  Qualifying Candidates     : ${candidates.length} tours eligible for soft-archival\n`);

    if (candidates.length === 0) {
      console.log('No qualifying unarchived legacy tours without bookings found. Everything is in order.');
      return;
    }

    console.log(`--- CANDIDATE TOURS FOR SOFT-ARCHIVAL ---`);
    candidates.forEach((c, idx) => {
      console.log(
        `  ${idx + 1}. [${c.slug}] "${c.title}"` +
        ` | Current Status: ${c.currentStatus}` +
        ` | External Images: ${c.hasExternalImages ? 'YES' : 'NO'}` +
        ` | Reviews: ${c.reviewCount}`
      );
    });

    if (!isExecute) {
      console.log(`\n===============================================================`);
      console.log(`DRY-RUN COMPLETE. No database rows were changed.`);
      console.log(`To apply 'ARCHIVED' status to these ${candidates.length} tours, run:`);
      console.log(`   node scripts/soft_archive_legacy_tours.cjs --execute`);
      console.log(`===============================================================`);
      return;
    }

    console.log(`\nApplying soft-archival to ${candidates.length} tours...`);
    const candidateIds = candidates.map((c) => c.id);

    const result = await prisma.tour.updateMany({
      where: {
        id: { in: candidateIds },
        bookings: { none: {} }, // Extra defense-in-depth: Prisma constraint ensuring 0 bookings
      },
      data: {
        status: 'ARCHIVED',
      },
    });

    console.log(`\n✅ Successfully updated ${result.count} tours to status = 'ARCHIVED'.`);
    console.log(`Zero database rows were deleted. All booking associations remain intact.`);
  } catch (err) {
    console.error('Execution encountered an error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
