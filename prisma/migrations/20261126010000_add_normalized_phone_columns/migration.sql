-- Add normalized phone columns + indexes for My Bookings phone lookups.
--
-- WHY
-- Phone matching used regexp_replace() on the raw customerPhone column in
-- every My Bookings request, which no B-tree index can serve: each lookup
-- was a full-table scan of Booking / booking_leads / CustomerProfile, once
-- per phone key. The application now matches on normalized columns
-- (src/server/customerBookings.ts), populated from the same rule as
-- phoneMatchKey() in src/utils/phoneMatch.ts (national key, 8-12 digits).
--
-- WHAT THIS MIGRATION DOES
-- 1. Adds nullable normalized columns (Booking, BookingLead, CustomerProfile).
-- 2. Backfills them for existing rows (single pass; see note below).
-- 3. Creates the indexes the schema declares — including the
--    Booking.customerProfileId / customerEmail indexes from PR #27, which
--    were added to schema.prisma without a migration file.
-- 4. Installs a trigger that keeps the normalized columns in sync on every
--    future INSERT/UPDATE of a phone column, so no application write path
--    (checkout, lead capture, profile updates) has to remember to set them.
--    Prisma does not manage the functions/triggers below; they are extra DB
--    objects owned by this migration.
--
-- APPLYING TO THE LIVE DATABASE (REQUIRED — read this)
-- vercel-build is only `prisma generate && next build`; it does NOT run
-- `prisma migrate deploy`. After this PR merges, apply the migration to the
-- production (Supabase) database manually, BEFORE deploying the new code
-- (the new code reads the normalized columns; until the backfill runs,
-- phone matching finds nothing for un-backfilled rows):
--     npx prisma migrate deploy
-- or with psql against the DIRECT_URL connection string:
--     psql "$DIRECT_URL" -f prisma/migrations/20261126010000_add_normalized_phone_columns/migration.sql
-- The statements are idempotent (IF NOT EXISTS / OR REPLACE / backfill only
-- touches rows whose normalized column is still NULL), so re-running the
-- file is safe. The backfill UPDATEs are single-pass; on a very large
-- Booking table they can be run in id-range batches instead — the trigger
-- keeps new writes correct either way.
-- No data is deleted or rewritten: the raw phone columns are untouched,
-- and the new columns are purely derived. Rollback = drop the columns,
-- indexes, triggers and functions (see bottom of this file).

-- 1. Columns (nullable: existing rows get their value from the backfill).
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "customerPhoneNormalized" TEXT;
ALTER TABLE "booking_leads" ADD COLUMN IF NOT EXISTS "customerPhoneNormalized" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "phoneNormalized" TEXT;
ALTER TABLE "CustomerProfile" ADD COLUMN IF NOT EXISTS "telegramPhoneNormalized" TEXT;

-- 2. Normalization function. Mirrors phoneMatchKey() in
-- src/utils/phoneMatch.ts — keep the two in sync:
--   digits only -> strip leading "00" -> strip "20" country prefix when the
--   remaining number is >= 12 digits -> strip trunk "0" when >= 10 digits
--   -> keep only 8-12 digit keys, otherwise NULL.
CREATE OR REPLACE FUNCTION normalize_phone_key(raw TEXT) RETURNS TEXT AS $$
DECLARE
  digits TEXT;
BEGIN
  IF raw IS NULL THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(raw, '[^0-9]', '', 'g');
  IF digits = '' THEN
    RETURN NULL;
  END IF;
  IF left(digits, 2) = '00' THEN
    digits := substr(digits, 3);
  END IF;
  IF digits LIKE '20%' AND length(digits) >= 12 THEN
    digits := substr(digits, 3);
  END IF;
  IF left(digits, 1) = '0' AND length(digits) >= 10 THEN
    digits := substr(digits, 2);
  END IF;
  IF length(digits) < 8 OR length(digits) > 12 THEN
    RETURN NULL;
  END IF;
  RETURN digits;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Backfill existing rows (only rows not normalized yet).
UPDATE "Booking"
SET "customerPhoneNormalized" = normalize_phone_key("customerPhone")
WHERE "customerPhone" IS NOT NULL AND "customerPhoneNormalized" IS NULL;

UPDATE "booking_leads"
SET "customerPhoneNormalized" = normalize_phone_key("customerPhone")
WHERE "customerPhone" IS NOT NULL AND "customerPhoneNormalized" IS NULL;

UPDATE "CustomerProfile"
SET "phoneNormalized" = normalize_phone_key("phone"),
    "telegramPhoneNormalized" = normalize_phone_key("telegramPhone")
WHERE ("phone" IS NOT NULL AND "phoneNormalized" IS NULL)
   OR ("telegramPhone" IS NOT NULL AND "telegramPhoneNormalized" IS NULL);

-- 4. Indexes. Names match what Prisma generates for the @@index entries
-- in schema.prisma. The first two were declared in PR #27 without a
-- migration file, so they are created here too.
CREATE INDEX IF NOT EXISTS "Booking_customerProfileId_idx" ON "Booking"("customerProfileId");
CREATE INDEX IF NOT EXISTS "Booking_customerEmail_idx" ON "Booking"("customerEmail");
CREATE INDEX IF NOT EXISTS "Booking_customerPhoneNormalized_idx" ON "Booking"("customerPhoneNormalized");
CREATE INDEX IF NOT EXISTS "BookingLead_customerEmail_idx" ON "booking_leads"("customerEmail");
CREATE INDEX IF NOT EXISTS "BookingLead_customerPhoneNormalized_idx" ON "booking_leads"("customerPhoneNormalized");
CREATE INDEX IF NOT EXISTS "CustomerProfile_phoneNormalized_idx" ON "CustomerProfile"("phoneNormalized");
CREATE INDEX IF NOT EXISTS "CustomerProfile_telegramPhoneNormalized_idx" ON "CustomerProfile"("telegramPhoneNormalized");

-- 5. Trigger: keep normalized columns in sync on every write, so no
-- application code path has to set them (checkout, lead capture, profile
-- updates, admin edits all write through the same columns).
CREATE OR REPLACE FUNCTION sync_normalized_phone() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'CustomerProfile' THEN
    NEW."phoneNormalized" := normalize_phone_key(NEW."phone");
    NEW."telegramPhoneNormalized" := normalize_phone_key(NEW."telegramPhone");
  ELSE
    NEW."customerPhoneNormalized" := normalize_phone_key(NEW."customerPhone");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_booking_normalized_phone ON "Booking";
CREATE TRIGGER sync_booking_normalized_phone
  BEFORE INSERT OR UPDATE OF "customerPhone" ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION sync_normalized_phone();

DROP TRIGGER IF EXISTS sync_booking_lead_normalized_phone ON "booking_leads";
CREATE TRIGGER sync_booking_lead_normalized_phone
  BEFORE INSERT OR UPDATE OF "customerPhone" ON "booking_leads"
  FOR EACH ROW EXECUTE FUNCTION sync_normalized_phone();

DROP TRIGGER IF EXISTS sync_customer_profile_normalized_phone ON "CustomerProfile";
CREATE TRIGGER sync_customer_profile_normalized_phone
  BEFORE INSERT OR UPDATE OF "phone", "telegramPhone" ON "CustomerProfile"
  FOR EACH ROW EXECUTE FUNCTION sync_normalized_phone();

-- ROLLBACK (only if this migration must be reverted; revert the new
-- application code first — it reads these columns):
-- DROP TRIGGER IF EXISTS sync_booking_normalized_phone ON "Booking";
-- DROP TRIGGER IF EXISTS sync_booking_lead_normalized_phone ON "booking_leads";
-- DROP TRIGGER IF EXISTS sync_customer_profile_normalized_phone ON "CustomerProfile";
-- DROP FUNCTION IF EXISTS sync_normalized_phone();
-- DROP FUNCTION IF EXISTS normalize_phone_key(TEXT);
-- DROP INDEX IF EXISTS "Booking_customerPhoneNormalized_idx";
-- DROP INDEX IF EXISTS "BookingLead_customerPhoneNormalized_idx";
-- DROP INDEX IF EXISTS "CustomerProfile_phoneNormalized_idx";
-- DROP INDEX IF EXISTS "CustomerProfile_telegramPhoneNormalized_idx";
-- ALTER TABLE "Booking" DROP COLUMN IF EXISTS "customerPhoneNormalized";
-- ALTER TABLE "booking_leads" DROP COLUMN IF EXISTS "customerPhoneNormalized";
-- ALTER TABLE "CustomerProfile" DROP COLUMN IF EXISTS "phoneNormalized";
-- ALTER TABLE "CustomerProfile" DROP COLUMN IF EXISTS "telegramPhoneNormalized";
-- (The PR #27 indexes are intentionally left in place on rollback.)
