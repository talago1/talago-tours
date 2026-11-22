# Specification: Unified Booking Engine & Customer Flow

## 1. Existing Behavior and Actual Problem
- Competing booking forms: Continuous Booking Modal (`src/components/tours/ContinuousBookingModal.tsx`), standalone Checkout Page (`src/app/(public)/checkout/[tourId]/page.tsx`), and legacy multi-step checkout (`src/app/(public)/booking/[token]/page.tsx`).
- Inconsistent required fields: Hotel name and room number were hardcoded as mandatory across all tours, even boat trips or desert safaris meeting at public piers.
- Multiple booking endpoints created conflicting draft records and divergent validation rules.

## 2. Desired Behavior
- **One Shared Booking Engine**: A unified service layer (`src/app/api/checkout/initialize/route.ts` and `src/utils/bookingDraftStorage.ts`) handling customer resolution, date/time, guests, add-ons, pricing, and custom answers.
- **Simplified Core Customer Fields**:
  1. Full Name (mandatory)
  2. Phone / WhatsApp (mandatory, validated with international country code)
  3. Number of Guests (Adults, Children, Infants)
  4. Email (optional for guests, prefilled if signed in)
- **Tour-Specific Additional Questions**: Hotel name, room number, pickup location, dietary restrictions, and diving license details belong to each tour's configured questions (`tour.bookingQuestions`), NOT global universal fields.
- **Prefill & Seamless State**: If the traveler is logged in, their saved name, phone, and email prefill automatically. Switching between quick modal and full checkout preserves all selected values.
- **Strict Idempotency**: `idempotencyKey` enforced in database unique constraint to prevent duplicate reservations on connection drops or double clicks.

## 3. Source-of-Truth Data and Module Ownership
- **Canonical Booking API**: `POST /api/checkout/initialize` (`src/app/api/checkout/initialize/route.ts`).
- **Canonical Client State & Storage**: `src/utils/bookingDraftStorage.ts`.
- **Primary UI Components**:
  - Quick Booking Modal: `src/components/tours/ContinuousBookingModal.tsx`.
  - Full Page Checkout: `src/app/(public)/checkout/[tourId]/page.tsx`.
  - Country Code Selector: `src/components/checkout/CountryCodeSelector.tsx`.
- **Database Model**: `Booking` (`prisma/schema.prisma`).

## 4. User Journeys & Acceptance Criteria
1. Traveler selects date, guests, and add-ons on tour page -> clicks "Book Now".
2. If signed in, name and phone prefill from `CustomerProfile`.
3. If guest, traveler enters name and phone once (with country code dropdown); email is optional.
4. Only questions assigned to this tour appear (e.g. hotel pickup questions only if tour offers pickup).
5. Traveler submits -> reservation created with status `CONFIRMED` or `PENDING_CONFIRMATION` -> redirected to confirmation screen with voucher reference and WhatsApp concierge link.
6. Double-submitting the same payload with the same `idempotencyKey` returns the existing booking without creating a duplicate.

## 5. Required APIs and Database Relationships
- Models: `Tour`, `Booking`, `CustomerProfile`, `Transaction`, `LiveChatConversation`.
- Required Fields: `tourId`, `customerName`, `customerPhone`, `travelDate`, `guestCount`, `totalPriceUSD`, `currency`, `idempotencyKey`, `bookingReference`.

## 6. Validation and Security Requirements
- Canonical phone normalization (`src/utils/phoneMatch.ts`).
- Server-side price recalculation verifying guest tiers and add-ons match the database.
- Idempotency key stored and locked during creation transaction.

## 7. Required Tests
- `e2e/auth-booking-notifications.spec.ts`: Idempotency test (ensuring identical idempotencyKey cannot create multiple bookings).
- E2E journey verifying prefill for signed-in travelers and guest checkout with optional email.

## 8. Dependencies & Implementation Order
- Depends on Authentication for prefill and ownership adoption.
- Integrates directly with Booking Calendar (Phase 6).
