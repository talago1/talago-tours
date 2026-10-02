-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingChannel" AS ENUM ('VIATOR', 'GETYOURGUIDE', 'WHATSAPP', 'HOTEL_DIRECT', 'WEBSITE');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('SHARED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "CrewRole" AS ENUM ('CAPTAIN', 'GUIDE', 'DRIVER');

-- CreateEnum
CREATE TYPE "FleetType" AS ENUM ('BOAT', 'SPEEDBOAT', 'VEHICLE', 'QUAD');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FUEL', 'CREW_PAYROLL', 'CATERING', 'PERMITS', 'MISC');

-- CreateEnum
CREATE TYPE "ExpenseCurrency" AS ENUM ('USD', 'EGP');

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "minBookingValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "countryCode" TEXT NOT NULL DEFAULT 'EG',
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "transferFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickupOffset" DOUBLE PRECISION,
    "destinationId" TEXT,
    "location" TEXT,
    "pickupWindow" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TourType" NOT NULL,
    "basePriceUSD" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION,
    "durationHours" INTEGER NOT NULL,
    "duration" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "zoneId" TEXT NOT NULL,
    "destinationId" TEXT,
    "translations" JSONB NOT NULL,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "coverImage" TEXT,
    "galleryImages" TEXT[],
    "thumbnailUrl" TEXT,
    "highlights" TEXT[],
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "category" TEXT,
    "status" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isFamilyFriendly" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "customBadge" TEXT,
    "secondaryCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "allowDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositPercentage" INTEGER NOT NULL DEFAULT 0,
    "depositType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "depositAmount" DOUBLE PRECISION,
    "allowPayAtLocation" BOOLEAN NOT NULL DEFAULT false,
    "showExcerptOnCard" BOOLEAN NOT NULL DEFAULT true,
    "cardExcerpt" TEXT,
    "displayExcerpt" BOOLEAN NOT NULL DEFAULT false,
    "itinerary" JSONB,
    "whatToBring" TEXT,
    "pickupDescription" TEXT,
    "hotelPickupIncluded" BOOLEAN NOT NULL DEFAULT false,
    "pickupTime" TEXT,
    "pickupTimes" TEXT[],
    "pickupType" TEXT NOT NULL DEFAULT 'hotel',
    "meetingPointName" TEXT,
    "meetingPointAddress" TEXT,
    "meetingPointLat" DOUBLE PRECISION,
    "meetingPointLng" DOUBLE PRECISION,
    "meetingPointLandmark" TEXT,
    "meetingPointInstructions" TEXT,
    "meetingPointMapUrl" TEXT,
    "meetingPointImageUrl" TEXT,
    "cancellationPolicy" TEXT,
    "adultPrice" DOUBLE PRECISION NOT NULL,
    "priceAdult" DOUBLE PRECISION,
    "originalPrice" DOUBLE PRECISION,
    "childPrice" DOUBLE PRECISION,
    "priceChild" DOUBLE PRECISION,
    "childMinAge" INTEGER DEFAULT 3,
    "childMaxAge" INTEGER DEFAULT 11,
    "infantPrice" DOUBLE PRECISION,
    "infantMinAge" INTEGER DEFAULT 0,
    "infantMaxAge" INTEGER DEFAULT 2,
    "pricePrivate" DOUBLE PRECISION,
    "ageRestrictionsNotes" TEXT,
    "vehicleType" TEXT,
    "boatType" TEXT,
    "airConditioned" BOOLEAN NOT NULL DEFAULT false,
    "transferNotes" TEXT,
    "fitnessLevel" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "strollerAccessible" BOOLEAN NOT NULL DEFAULT false,
    "mobilityNotes" TEXT,
    "accessibilityNotes" TEXT,
    "safetyGuidelines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "insuranceIncluded" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" TEXT,
    "freeCancellationHours" INTEGER NOT NULL DEFAULT 24,
    "instantConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "cutoffHours" INTEGER NOT NULL DEFAULT 12,
    "durationDisplay" TEXT,
    "routeStops" JSONB,
    "activityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "operatorName" TEXT,
    "operatorPhone" TEXT,
    "operatorEmail" TEXT,
    "internalNotes" TEXT,
    "variants" JSONB,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "costPerPerson" DECIMAL(65,30),
    "tourOptions" JSONB,
    "bookingQuestions" JSONB,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviews" JSONB,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "hotelName" TEXT,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "adultsCount" INTEGER NOT NULL DEFAULT 0,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "infantsCount" INTEGER NOT NULL DEFAULT 0,
    "totalPriceUSD" DOUBLE PRECISION NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT,
    "paymentGatewayLogs" JSONB NOT NULL DEFAULT '[]',
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3),
    "checkInLog" JSONB NOT NULL DEFAULT '[]',
    "channel" "BookingChannel" NOT NULL DEFAULT 'WEBSITE',
    "roomNumber" TEXT,
    "pickupDirectives" TEXT,
    "pickupType" TEXT,
    "pickupLocationName" TEXT,
    "pickupAddress" TEXT,
    "flightNumbers" TEXT,
    "bedConfiguration" TEXT,
    "bedConfig" TEXT,
    "specialRequirements" TEXT,
    "selectedAddons" JSONB,
    "bookingAnswers" JSONB,
    "promoCodeId" TEXT,
    "paymentScheme" TEXT,
    "amountPaidOnline" DOUBLE PRECISION,
    "amountDueOnArrival" DOUBLE PRECISION,
    "timeSlotId" TEXT,
    "selectedPickupTime" TEXT,
    "customerProfileId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "bookingId" TEXT,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "gatewayReference" TEXT,
    "amountPaidOnline" DOUBLE PRECISION NOT NULL,
    "amountDueOnArrival" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheme" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isShadow" BOOLEAN NOT NULL DEFAULT false,
    "invitedAt" TIMESTAMP(3),
    "lastMagicLinkAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourTimeSlot" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "maxCapacityPerSlot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "messageId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "CrewRole" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crew_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FleetType" NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_assignments" (
    "id" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_assignments" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fleet_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_expenses" (
    "id" TEXT NOT NULL,
    "departureDateGroup" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "ExpenseCurrency" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Travel Guide',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorName" TEXT NOT NULL DEFAULT 'TALAGO Editorial',
    "authorAvatar" TEXT,
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_code_isActive_idx" ON "PromoCode"("code", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_slug_idx" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");

-- CreateIndex
CREATE INDEX "Booking_tourId_idx" ON "Booking"("tourId");

-- CreateIndex
CREATE INDEX "Booking_bookingReference_idx" ON "Booking"("bookingReference");

-- CreateIndex
CREATE INDEX "Booking_tourId_travelDate_status_idx" ON "Booking"("tourId", "travelDate", "status");

-- CreateIndex
CREATE INDEX "Booking_travelDate_status_idx" ON "Booking"("travelDate", "status");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_channel_idx" ON "Booking"("channel");

-- CreateIndex
CREATE INDEX "Booking_promoCodeId_idx" ON "Booking"("promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_tourId_idx" ON "reviews"("tourId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_bookingId_key" ON "Transaction"("bookingId");

-- CreateIndex
CREATE INDEX "Transaction_bookingId_idx" ON "Transaction"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_email_key" ON "CustomerProfile"("email");

-- CreateIndex
CREATE INDEX "CustomerProfile_email_idx" ON "CustomerProfile"("email");

-- CreateIndex
CREATE INDEX "TourTimeSlot_tourId_idx" ON "TourTimeSlot"("tourId");

-- CreateIndex
CREATE INDEX "NotificationLog_bookingId_idx" ON "NotificationLog"("bookingId");

-- CreateIndex
CREATE INDEX "MediaAsset_tourId_idx" ON "MediaAsset"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "crew_members_role_isActive_idx" ON "crew_members"("role", "isActive");

-- CreateIndex
CREATE INDEX "fleet_assets_type_isActive_idx" ON "fleet_assets"("type", "isActive");

-- CreateIndex
CREATE INDEX "crew_assignments_departureDate_tourId_idx" ON "crew_assignments"("departureDate", "tourId");

-- CreateIndex
CREATE INDEX "crew_assignments_crewMemberId_departureDate_idx" ON "crew_assignments"("crewMemberId", "departureDate");

-- CreateIndex
CREATE INDEX "fleet_assignments_departureDate_tourId_idx" ON "fleet_assignments"("departureDate", "tourId");

-- CreateIndex
CREATE INDEX "fleet_assignments_fleetAssetId_departureDate_idx" ON "fleet_assignments"("fleetAssetId", "departureDate");

-- CreateIndex
CREATE INDEX "trip_expenses_departureDateGroup_tourId_idx" ON "trip_expenses"("departureDateGroup", "tourId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_isPublished_idx" ON "blog_posts"("slug", "isPublished");

-- CreateIndex
CREATE INDEX "blog_posts_category_isPublished_idx" ON "blog_posts"("category", "isPublished");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourTimeSlot" ADD CONSTRAINT "TourTimeSlot_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_assignments" ADD CONSTRAINT "crew_assignments_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "crew_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_assignments" ADD CONSTRAINT "fleet_assignments_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
