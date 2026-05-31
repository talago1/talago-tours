# Quickstart: Booking Widget & Checkout Engine

## Prerequisites

- Node.js 18+, Next.js 14+ (App Router)
- PostgreSQL database with Prisma schema migrated
- Tour model must exist with `perPersonPrice` and `capacityPerDate` fields (add via Prisma migration if missing)
- Install `lucide-react`: `npm install lucide-react`

## Files to Create

### 1. Prisma Schema Update (`prisma/schema.prisma`)

Add `Booking` model with fields: `id`, `bookingReference` (unique), `tourId` (FK), `zoneId`, `hotelName`, `travelDate`, `guestCount`, `totalPriceUSD`, `customerName`, `customerEmail`, `customerPhone`, `status` (default: `"PENDING"`), `createdAt`, `updatedAt`.

### 2. Type Definitions (`src/types/booking.ts`)

TypeScript interfaces: `CheckoutFormData`, `Booking`, `ZoneOption`, `CheckoutResponse`.

### 3. API Endpoint (`src/app/api/bookings/checkout/route.ts`)

POST handler with validation, server-side price calculation, booking reference generation, and Prisma persist.

### 4. Booking Form Steps (`src/components/tours/BookingFormSteps.tsx`)

Two-step wizard component: Step 1 (date picker + guest counter), Step 2 (zone dropdown + hotel name + contact fields).

### 5. Booking Widget (`src/components/tours/BookingWidget.tsx`)

Responsive wrapper: sticky sidebar on desktop (`lg:sticky lg:top-28`), fixed-bottom bar on mobile (`fixed bottom-0`).

### 6. Success Page (`src/app/tours/checkout/success/page.tsx`)

Receives `ref` query param, displays booking reference and trust message.

## Data Flow

```text
Customer opens tour page
  → BookingWidget renders (sticky desktop / floating mobile)
  → Step 1: Select date + guest count → price updates live
  → Click "Continue" → Step 2: Zone, hotel, name, email, phone
  → Submit → button disables (loading spinner)
  → POST /api/bookings/checkout
  → Server validates, computes price, generates ref, persists
  → Redirects to /tours/checkout/success?ref=TLG-2026-XXXX
  → Success page shows ref + "We'll contact you via WhatsApp within 15 min"
```

## Key Design Decisions

- Server-side price recalculation prevents client tampering
- Crypto-random booking references (4-char uppercase, no ambiguous chars)
- Two-step wizard pattern (date/guests → contact) reduces form abandonment
- Native date input — no heavy third-party date libraries
- Loading spinner + disabled button prevents duplicate submissions
- Status: `PENDING` on creation, admin handles follow-up
