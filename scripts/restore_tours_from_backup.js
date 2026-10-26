/**
 * scripts/restore_tours_from_backup.js
 *
 * Restores Tour (and prerequisite Destination + Zone) records from a
 * scripts/backups/db_backup_*.json file produced by backup_db.js.
 *
 * SAFETY RULES:
 *   - Only INSERTs records whose slug/id does not already exist.
 *   - NEVER deletes, NEVER truncates, NEVER touches Booking or Review rows.
 *   - Always run against an ISOLATED test environment first.
 *   - DATABASE_URL env var must be set explicitly to the target before running.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/restore_tours_from_backup.js \
 *     --file scripts/backups/db_backup_pre_consolidation_....json \
 *     [--dry-run]
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const fileArgIdx = args.indexOf("--file");
const isDryRun = args.includes("--dry-run");

if (fileArgIdx === -1 || !args[fileArgIdx + 1]) {
  console.error("Usage: node restore_tours_from_backup.js --file <backup.json> [--dry-run]");
  process.exit(1);
}

const backupFile = path.resolve(args[fileArgIdx + 1]);
if (!fs.existsSync(backupFile)) {
  console.error("Backup file not found:", backupFile);
  process.exit(1);
}

async function main() {
  console.log("--- TOUR RESTORE FROM BACKUP ---");
  console.log("File  :", backupFile);
  console.log("Mode  :", isDryRun ? "DRY-RUN (no writes)" : "EXECUTE");
  console.log("Target:", process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@") || "(DATABASE_URL not set)");
  console.log("");

  const raw = fs.readFileSync(backupFile, "utf8");
  const backup = JSON.parse(raw);
  const { destinations = [], zones = [], tours = [] } = backup.tables || {};

  console.log("Backup contains:", destinations.length, "destinations,", zones.length, "zones,", tours.length, "tours");

  let destInserted = 0, destSkipped = 0;
  for (const dest of destinations) {
    const existing = await prisma.destination.findUnique({ where: { slug: dest.slug } });
    if (existing) { destSkipped++; continue; }
    if (!isDryRun) {
      await prisma.destination.create({
        data: {
          id: dest.id, name: dest.name, slug: dest.slug,
          description: dest.description, imageUrl: dest.imageUrl,
          translations: dest.translations || {}, countryCode: dest.countryCode || "EG",
          region: dest.region, city: dest.city, latitude: dest.latitude, longitude: dest.longitude,
          timezone: dest.timezone || "Africa/Cairo", isVisible: dest.isVisible ?? true,
        },
      });
    }
    destInserted++;
  }
  console.log("Destinations:", destInserted, "inserted,", destSkipped, "skipped");

  let zoneInserted = 0, zoneSkipped = 0;
  for (const zone of zones) {
    const existing = await prisma.zone.findUnique({ where: { name: zone.name } });
    if (existing) { zoneSkipped++; continue; }
    if (!isDryRun) {
      await prisma.zone.create({
        data: {
          id: zone.id, name: zone.name, transferFee: zone.transferFee || 0,
          pickupOffset: zone.pickupOffset, destinationId: zone.destinationId,
          location: zone.location, pickupWindow: zone.pickupWindow,
          instructions: zone.instructions, isActive: zone.isActive ?? true,
        },
      });
    }
    zoneInserted++;
  }
  console.log("Zones:", zoneInserted, "inserted,", zoneSkipped, "skipped");

  let tourInserted = 0, tourSkipped = 0, tourFailed = 0;
  const failures = [];

  for (const tour of tours) {
    const existing = await prisma.tour.findUnique({ where: { slug: tour.slug } });
    if (existing) { tourSkipped++; continue; }

    const zoneExists = await prisma.zone.findUnique({ where: { id: tour.zoneId } });
    if (!zoneExists) {
      failures.push({ slug: tour.slug, reason: "zoneId " + tour.zoneId + " not found in target DB" });
      tourFailed++; continue;
    }

    if (!isDryRun) {
      try {
        await prisma.tour.create({
          data: {
            id: tour.id, slug: tour.slug, type: tour.type,
            basePriceUSD: tour.basePriceUSD || 0, basePrice: tour.basePrice,
            durationHours: tour.durationHours || 1, duration: tour.duration,
            maxCapacity: tour.maxCapacity || 10, zoneId: tour.zoneId,
            destinationId: tour.destinationId, translations: tour.translations || {},
            coverImage: tour.coverImage, galleryImages: tour.galleryImages || [],
            thumbnailUrl: tour.thumbnailUrl, status: tour.status || "DRAFT",
            category: tour.category || "uncategorized",
            adultPrice: tour.adultPrice || tour.basePriceUSD || 0,
            childEnabled: tour.childEnabled ?? false, childPrice: tour.childPrice,
            infantEnabled: tour.infantEnabled ?? false,
            itinerary: tour.itinerary || [], addons: tour.addons || [],
            bookingQuestions: tour.bookingQuestions || [], routeStops: tour.routeStops,
            isFeatured: tour.isFeatured ?? false, isBestSeller: tour.isBestSeller ?? false,
            isRecommended: tour.isRecommended ?? false, isNew: tour.isNew ?? false,
          },
        });
        tourInserted++;
      } catch (err) {
        failures.push({ slug: tour.slug, reason: err.message });
        tourFailed++;
      }
    } else {
      tourInserted++;
    }
  }

  console.log("Tours:", tourInserted, "inserted,", tourSkipped, "skipped,", tourFailed, "failed");
  if (failures.length > 0) {
    console.log("\nFailed tours:");
    failures.forEach((f) => console.log(" -", f.slug + ":", f.reason));
  }
  console.log("\n--- RESTORE COMPLETE ---");
  if (isDryRun) console.log("This was a DRY-RUN. Re-run without --dry-run to apply changes.");
}

main()
  .catch((err) => { console.error("Restore failed:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
