-- Add Booking.accessToken: the 256-bit capability that authorises customer-facing
-- access to a booking. bookingReference remains a human-readable display
-- identifier and is never an authorization credential.
--
-- `prisma migrate diff` emits a single statement for this change:
--     ALTER TABLE "Booking" ADD COLUMN "accessToken" TEXT NOT NULL;
--     CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");
-- That fails on any table that already holds rows, and this database was
-- previously managed with `prisma db push`, so it may carry existing bookings.
-- Add the column nullable, backfill, then enforce the constraint.

-- 1. Add the column without the NOT NULL constraint yet.
ALTER TABLE "Booking" ADD COLUMN "accessToken" TEXT;

-- 2. Backfill existing rows with 256 bits of randomness, encoded in the
--    base64url-safe alphabet the application validates
--    (isPlausibleAccessToken: 43-128 chars of [A-Za-z0-9_-]).
--    Two v4 UUIDs concatenated give 64 hex characters = 256 bits and use
--    gen_random_uuid(), which is core PostgreSQL since v13 (no pgcrypto needed).
UPDATE "Booking"
SET "accessToken" = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE "accessToken" IS NULL;

-- 3. Enforce NOT NULL and uniqueness exactly as the Prisma schema declares.
ALTER TABLE "Booking" ALTER COLUMN "accessToken" SET NOT NULL;
CREATE UNIQUE INDEX "Booking_accessToken_key" ON "Booking"("accessToken");
