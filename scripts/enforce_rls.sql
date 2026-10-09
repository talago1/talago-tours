-- ============================================================================
-- TALAGO PLATFORM: ROW LEVEL SECURITY (RLS) HARDENING SCRIPT
-- Enforces RLS on Tour, Destination, Zone, Booking, CustomerProfile, MediaAsset, reviews
-- ============================================================================

-- 1. Tour Table
ALTER TABLE "Tour" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON "Tour";
CREATE POLICY "tour_public_read" ON "Tour" FOR SELECT USING (true);

DROP POLICY IF EXISTS "tour_admin_manage" ON "Tour";
CREATE POLICY "tour_admin_manage" ON "Tour" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 2. Destination Table
ALTER TABLE "Destination" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dest_public_read" ON "Destination";
CREATE POLICY "dest_public_read" ON "Destination" FOR SELECT USING (true);

DROP POLICY IF EXISTS "dest_admin_manage" ON "Destination";
CREATE POLICY "dest_admin_manage" ON "Destination" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 3. Zone Table
ALTER TABLE "Zone" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zone_public_read" ON "Zone";
CREATE POLICY "zone_public_read" ON "Zone" FOR SELECT USING (true);

DROP POLICY IF EXISTS "zone_admin_manage" ON "Zone";
CREATE POLICY "zone_admin_manage" ON "Zone" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 4. Booking Table
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "booking_admin_service" ON "Booking";
CREATE POLICY "booking_admin_service" ON "Booking" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "booking_customer_read_own" ON "Booking";
CREATE POLICY "booking_customer_read_own" ON "Booking" FOR SELECT USING (
  "customerEmail" = auth.jwt() ->> 'email'
);

-- 5. CustomerProfile Table
ALTER TABLE "CustomerProfile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_profile_admin_service" ON "CustomerProfile";
CREATE POLICY "customer_profile_admin_service" ON "CustomerProfile" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "customer_profile_read_own" ON "CustomerProfile";
CREATE POLICY "customer_profile_read_own" ON "CustomerProfile" FOR SELECT USING (
  email = auth.jwt() ->> 'email'
);

DROP POLICY IF EXISTS "customer_profile_update_own" ON "CustomerProfile";
CREATE POLICY "customer_profile_update_own" ON "CustomerProfile" FOR UPDATE USING (
  email = auth.jwt() ->> 'email'
);

-- 6. MediaAsset Table
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_asset_public_read" ON "MediaAsset";
CREATE POLICY "media_asset_public_read" ON "MediaAsset" FOR SELECT USING (true);

DROP POLICY IF EXISTS "media_asset_admin_manage" ON "MediaAsset";
CREATE POLICY "media_asset_admin_manage" ON "MediaAsset" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 7. Reviews Table
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read_approved" ON "reviews";
CREATE POLICY "reviews_public_read_approved" ON "reviews" FOR SELECT USING (
  status = 'APPROVED' OR
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin'
);

DROP POLICY IF EXISTS "reviews_customer_insert" ON "reviews";
CREATE POLICY "reviews_customer_insert" ON "reviews" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_manage" ON "reviews";
CREATE POLICY "reviews_admin_manage" ON "reviews" FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin' OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
