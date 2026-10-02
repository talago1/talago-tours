-- Reconcile the live database with prisma/schema.prisma after an out-of-band
-- reverse migration observed at 2026-10-01 23:39:54Z (see investigation):
--   * Booking.accessToken was altered back to NULLABLE (a unique index remains)
--   * blog_posts was reverted from the new BlogPost shape to the legacy shape
--     (author/featured/publishedAt/readingMins/status; translations.*.body)
--
-- This migration is idempotent and safe to replay on a fresh database built
-- from 0_init + 20261002020000:
--   * Booking.accessToken is only touched when it is currently nullable.
--   * Every blog_posts action is skipped unless the legacy "author" column
--     exists, so a fresh database (already at schema.prisma) is a full no-op.
--   * ADD/DROP use IF (NOT) EXISTS catalog guards.
--
-- It does NOT create or regenerate tokens, and it preserves the existing
-- unique index on Booking.accessToken.

-- =========================================================================
-- 1. Booking.accessToken: enforce NOT NULL only if it is currently nullable
-- =========================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'Booking'
      AND column_name  = 'accessToken'
      AND is_nullable  = 'YES'
  ) THEN
    -- Refuse to proceed if any row would violate the constraint.
    IF EXISTS (SELECT 1 FROM "Booking" WHERE "accessToken" IS NULL) THEN
      RAISE EXCEPTION
        'Refusing to set Booking.accessToken NOT NULL: NULL value(s) present';
    END IF;

    ALTER TABLE "Booking" ALTER COLUMN "accessToken" SET NOT NULL;
  END IF;
END $$;

-- =========================================================================
-- 2. blog_posts: legacy schema -> schema.prisma (no-op on a fresh database)
-- =========================================================================
DO $$
DECLARE
  legacy_present boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'blog_posts'
      AND column_name  = 'author'
  ) INTO legacy_present;

  IF NOT legacy_present THEN
    -- Already on the schema.prisma shape; nothing to reconcile.
    RETURN;
  END IF;

  -- 2a. Introduce the new columns as nullable first; NOT NULL is applied after
  --     the backfill so the 4 existing rows are never rejected.
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "title"           TEXT;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "excerpt"         TEXT;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "content"         TEXT;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "authorName"      TEXT;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "authorAvatar"    TEXT;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "readTimeMinutes" INTEGER;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "isPublished"     BOOLEAN;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "isFeatured"      BOOLEAN;
  ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "viewsCount"      INTEGER;

  -- 2b. Backfill using the exact agreed mapping. Each UPDATE only fills rows
  --     that are still NULL so a re-run cannot overwrite existing values.
  --     translations.en.title  -> title
  UPDATE "blog_posts"
     SET "title" = COALESCE(NULLIF("translations"->'en'->>'title', ''), "slug")
   WHERE "title" IS NULL;

  -- 2b. translations.en.excerpt -> excerpt
  UPDATE "blog_posts"
     SET "excerpt" = COALESCE("translations"->'en'->>'excerpt', '')
   WHERE "excerpt" IS NULL;

  -- 2b. translations.en.body -> content
  UPDATE "blog_posts"
     SET "content" = COALESCE("translations"->'en'->>'body', '')
   WHERE "content" IS NULL;

  -- 2b. author -> authorName
  UPDATE "blog_posts"
     SET "authorName" = COALESCE("author", 'TALAGO Editorial')
   WHERE "authorName" IS NULL;

  -- 2b. readingMins -> readTimeMinutes
  UPDATE "blog_posts"
     SET "readTimeMinutes" = COALESCE("readingMins", 5)
   WHERE "readTimeMinutes" IS NULL;

  -- 2b. featured -> isFeatured
  UPDATE "blog_posts"
     SET "isFeatured" = COALESCE("featured", false)
   WHERE "isFeatured" IS NULL;

  -- 2b. status = 'PUBLISHED' -> isPublished
  UPDATE "blog_posts"
     SET "isPublished" = COALESCE(("status" = 'PUBLISHED'), false)
   WHERE "isPublished" IS NULL;

  -- 2b. authorAvatar -> NULL (leave NULL), viewsCount -> 0
  UPDATE "blog_posts"
     SET "viewsCount" = 0
   WHERE "viewsCount" IS NULL;

  -- 2c. For every language key in translations, rename body -> content while
  --     preserving title, excerpt and any other keys, and the exact content.
  --     Rows whose language objects have no "body" key are left untouched
  --     (so this is a no-op on an already-migrated database).
  UPDATE "blog_posts" b
     SET "translations" = (
       SELECT jsonb_object_agg(
                e.key,
                CASE
                  WHEN jsonb_typeof(e.value) = 'object' AND e.value ? 'body'
                  THEN (e.value - 'body') || jsonb_build_object('content', e.value->'body')
                  ELSE e.value
                END)
         FROM jsonb_each(b."translations") AS e)
   WHERE jsonb_typeof(b."translations") = 'object'
     AND EXISTS (
       SELECT 1
         FROM jsonb_each(b."translations") AS e2
        WHERE jsonb_typeof(e2.value) = 'object' AND e2.value ? 'body');

  -- 2d. Safety gate: abort before enforcing constraints if any required field
  --     is still NULL. The migration runs in a transaction, so nothing is
  --     committed if this fires.
  IF EXISTS (
    SELECT 1
      FROM "blog_posts"
     WHERE "title" IS NULL
        OR "content" IS NULL
        OR "authorName" IS NULL
        OR "readTimeMinutes" IS NULL
        OR "isPublished" IS NULL
        OR "isFeatured" IS NULL
        OR "viewsCount" IS NULL
  ) THEN
    RAISE EXCEPTION
      'blog_posts required fields still NULL after backfill; aborting';
  END IF;

  -- 2e. Enforce NOT NULL and defaults exactly as schema.prisma declares.
  ALTER TABLE "blog_posts" ALTER COLUMN "title"           SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "content"         SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "authorName"      SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "readTimeMinutes" SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "isPublished"     SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "isFeatured"      SET NOT NULL;
  ALTER TABLE "blog_posts" ALTER COLUMN "viewsCount"      SET NOT NULL;

  ALTER TABLE "blog_posts" ALTER COLUMN "authorName"      SET DEFAULT 'TALAGO Editorial';
  ALTER TABLE "blog_posts" ALTER COLUMN "readTimeMinutes" SET DEFAULT 5;
  ALTER TABLE "blog_posts" ALTER COLUMN "isPublished"     SET DEFAULT true;
  ALTER TABLE "blog_posts" ALTER COLUMN "isFeatured"      SET DEFAULT false;
  ALTER TABLE "blog_posts" ALTER COLUMN "viewsCount"      SET DEFAULT 0;
  ALTER TABLE "blog_posts" ALTER COLUMN "category"        SET DEFAULT 'Travel Guide';

  -- 2f. Drop the legacy columns only after a successful backfill. These names
  --     are the legacy-only columns; the new columns are never dropped.
  ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "author";
  ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "featured";
  ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "publishedAt";
  ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "readingMins";
  ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "status";

  -- 2g. Create the schema.prisma indexes first, then remove the obsolete legacy
  --     indexes. The unique index blog_posts_slug_key is left untouched.
  CREATE INDEX IF NOT EXISTS "blog_posts_slug_isPublished_idx"
    ON "blog_posts"("slug", "isPublished");
  CREATE INDEX IF NOT EXISTS "blog_posts_category_isPublished_idx"
    ON "blog_posts"("category", "isPublished");

  DROP INDEX IF EXISTS "blog_posts_slug_idx";
  DROP INDEX IF EXISTS "blog_posts_status_publishedAt_idx";
END $$;
