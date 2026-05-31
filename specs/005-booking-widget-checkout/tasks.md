---

description: "Task list for Booking Widget & Checkout Engine implementation"

---

# Tasks: Booking Widget & Checkout Engine

**Input**: Design documents from `/specs/005-booking-widget-checkout/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/checkout-api.md

**Tests**: No test tasks — manual testing per feature spec

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router project at repository root
- `src/` for all source code
- `prisma/` for database schema

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic types

- [ ] T001 [P] Create `src/types/booking.ts` with `CheckoutFormData`, `Booking`, `ZoneOption`, and `CheckoutResponse` interfaces
- [ ] T002 [P] Add `Booking` model to `prisma/schema.prisma` with fields: id, bookingReference (unique), tourId (FK to Tour), zoneId, hotelName, travelDate, guestCount, totalPriceUSD, customerName, customerEmail, customerPhone, status (default PENDING), createdAt, updatedAt
- [ ] T003 Generate Prisma migration for Booking model via `npx prisma migrate dev --name add-booking-model`
- [ ] T004 Install `lucide-react` via npm for icons used in success page and trust badges

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create server-side validation utilities in `src/utils/bookingValidation.ts` — validate travelDate (future date), guestCount (≥1), customerName (≥2 chars), customerEmail (email regex), customerPhone (E.164 regex), hotelName (≤200 chars)
- [ ] T006 [P] Create booking reference generator utility in `src/utils/bookingReference.ts` — use `crypto.randomBytes` to generate 4-char uppercase alphanumeric (excluding I/O/0/1 for readability), prefix with `TLG-2026-`
- [ ] T007 [P] Create price calculator utility in `src/utils/priceCalculator.ts` — implement formula `(perPersonPrice * guestCount) + zoneTransferFee` with floating-point precision

**Checkpoint**: Foundation ready — all shared utilities exist and can be unit-tested independently

---

## Phase 3: User Story 1 - Book a Tour from Tour Page (Priority: P1) 🎯 MVP

**Goal**: Customer can book a tour via a sticky sidebar on the tour page — select date/guests, enter pickup/contact details, submit, and see a success confirmation with booking reference.

**Independent Test**: Load any tour page, complete the two-step form with valid data, confirm redirect to success page with `TLG-2026-XXXX` reference.

### Implementation for User Story 1

- [ ] T008 [US1] Create `src/app/api/bookings/checkout/route.ts` — POST handler: parse body, run server-side validation (bookingValidation.ts), fetch Tour by tourId from DB, compute total price server-side (priceCalculator.ts), generate booking reference (bookingReference.ts), create Booking record with status PENDING, return `{ bookingReference }`
- [ ] T009 [US1] Create `src/components/tours/BookingFormSteps.tsx` — two-step client component (`"use client"`):
  - Step 1: native `<input type="date">` with `min` set to tomorrow, guest counter (min 1, increment/decrement buttons)
  - Step 2: zone dropdown (props), hotel name (text, max 200), customer name (text, min 2), email, phone (E.164)
  - Live price display that recalculates on guestCount or zone change using formula from props
  - Client-side validation before step transition and before submit
  - On submit: POST to `/api/bookings/checkout`, on success: `window.location.href = '/tours/checkout/success?ref=' + data.bookingReference`
- [ ] T010 [US1] Create `src/components/tours/BookingWidget.tsx` — responsive wrapper (`"use client"`):
  - Desktop (≥lg): sticky sidebar `lg:sticky lg:top-28 w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl p-6`
  - Renders BookingFormSteps inside
  - Passes pricing props (perPersonPrice, zones) down to form
- [ ] T011 [US1] Create `src/app/tours/checkout/success/page.tsx` — read `ref` query param, display green trust badge (`secondary-forest` #00473F), booking reference `TLG-2026-XXXX`, trust message: "Our team is preparing your pickup details and will contact you directly via WhatsApp within 15 minutes."

**Checkpoint**: At this point, User Story 1 should be fully functional — complete booking flow works on desktop

---

## Phase 4: User Story 2 - Mobile Responsive Booking (Priority: P1)

**Goal**: On mobile viewport (<lg), the widget transforms into a fixed-bottom floating action bar with price summary and checkout button.

**Independent Test**: Resize browser to <1024px width, verify widget shows as fixed-bottom bar with total on left and action button on right.

### Implementation for User Story 2

- [ ] T012 [US2] Add mobile layout to `src/components/tours/BookingWidget.tsx`:
  - Mobile (<lg): `fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]`
  - Show total price summary on left, "Checkout" button on right
  - Button opens a full-screen overlay or modal containing BookingFormSteps
- [ ] T013 [US2] Create mobile overlay/modal within BookingWidget that slides up on button tap and contains the BookingFormSteps component for the full booking flow

**Checkpoint**: Booking widget works on both desktop and mobile viewports

---

## Phase 5: User Story 3 - Input Validation Prevents Invalid Bookings (Priority: P2)

**Goal**: The system blocks bookings with invalid data and shows clear error messages for each invalid field.

**Independent Test**: Attempt to submit with past date, empty fields, invalid phone — verify each shows a targeted inline error.

### Implementation for User Story 3

- [ ] T014 [US3] Add inline error display to `src/components/tours/BookingFormSteps.tsx` — show field-specific error messages below each input in red text. Errors: "Please select a future date", "Please enter a valid phone number including country code", "Name is required", "Email is required"
- [ ] T015 [US3] Enhance server-side validation in `src/app/api/bookings/checkout/route.ts` — return `field` property in error response for inline targeting: `{ error: "...", field: "travelDate" }`
- [ ] T016 [US3] Add sold-out state to BookingWidget — if tour has no available dates, render "Sold Out" message with `secondary-forest` badge instead of the booking form
- [ ] T017 [US3] Add network error handling in BookingFormSteps — on API failure, preserve all form data, show error message with "Try Again" button

**Checkpoint**: All validation scenarios produce clear, actionable error messages — both client-side and server-side

---

## Phase 6: User Story 4 - System Prevents Duplicate Submissions (Priority: P2)

**Goal**: No duplicate booking records are created from rapid clicks or network latency.

**Independent Test**: Rapidly click submit multiple times — verify only one booking record is created.

### Implementation for User Story 4

- [ ] T018 [US4] Add submit button loading state to `src/components/tours/BookingFormSteps.tsx`:
  - On submit click: immediately set `isSubmitting = true`
  - Button renders Coral (#FF5B00) with loading spinner, `pointer-events-none opacity-50` classes
  - Re-enable on error response to allow retry
  - Use `useRef` flag to prevent concurrent submissions even if state lags
- [ ] T019 [US4] Add server-side deduplication in `src/app/api/bookings/checkout/route.ts` — generate and check a request idempotency key (optional enhancement; documented as future improvement) or rely on unique constraint on bookingReference for natural idempotency

**Checkpoint**: Double-click and rapid resubmission produce exactly one booking

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 Add loading skeleton states for initial widget render (prevents layout shift while pricing loads)
- [ ] T021 Verify and fix accessibility: add `aria-label` on guest counter buttons, `type="email"` on email input, `type="tel"` on phone input, focus management between steps
- [ ] T022 Add `meta` tags and Open Graph support for success page (shareable booking confirmation)
- [ ] T023 Verify zero CLS on desktop and mobile widget — fixed dimensions on sticky sidebar and mobile bar
- [ ] T024 Run quickstart.md validation — manually test all 4 user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion — core booking flow
- **US2 (Phase 4)**: Depends on US1 completion (widget must exist before mobile enhancements)
- **US3 (Phase 5)**: Depends on US1 completion (form must exist before validation enhancements)
- **US4 (Phase 6)**: Depends on US1 completion (submit button must exist before throttling)
- **Polish (Phase 7)**: Depends on all user stories being complete

### Within Each User Story

- Types before implementation
- Core implementation before enhancements
- Client components before API integration
- Each story complete and testable before moving to next

### Parallel Opportunities

- T001, T002: can run in parallel (types + schema are independent files)
- T005, T006, T007: all validation/reference/price utilities are independent
- Phase 7 polish tasks T020-T024: all independent

---

## Parallel Example: Foundational Phase

```bash
# All three utilities can be created simultaneously:
Task: "Create validation utilities in src/utils/bookingValidation.ts"
Task: "Create booking reference generator in src/utils/bookingReference.ts"
Task: "Create price calculator in src/utils/priceCalculator.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — types + schema
2. Complete Phase 2: Foundational — utilities
3. Complete Phase 3: User Story 1 — API + widget + form + success page
4. **STOP and VALIDATE**: Test US1 independently — complete desktop booking flow
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → MVP deployable (desktop booking works)
3. Add US2 → Verify mobile responsive → Full responsive deploy
4. Add US3 → Verify validation → Production-hardened
5. Add US4 → Verify throttling → Operations-ready
6. Add Polish → Production quality

### Notes

- US1 is the true MVP — it delivers the end-to-end booking flow on desktop
- US2 is additive mobile layout on the same BookingWidget component
- US3 and US4 harden the form against errors and duplicates
- All Coral (#FF5B00) and Forest (#00473F) color tokens are specified as Tailwind arbitrary values (`bg-[#FF5B00]`, `text-[#00473F]`)
