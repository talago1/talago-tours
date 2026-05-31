# Implementation Plan: Booking Widget & Checkout Engine

**Branch**: `005-booking-widget-checkout` | **Date**: 2026-05-30 | **Spec**: `specs/005-booking-widget-checkout/spec.md`

**Input**: Feature specification from `/specs/005-booking-widget-checkout/spec.md`

## Summary

Build a dual-state responsive booking widget (sticky sidebar on desktop, fixed-bottom bar on mobile) with a two-step checkout flow (date/guests → pickup/contact), a secure server-side price recalculation API endpoint, anti-duplicate-submission throttling, and a success confirmation page. Booking records are persisted to a new Booking model via Prisma with a PENDING status and a cryptographically generated reference (TLG-2026-XXXX).

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14+ (App Router)

**Primary Dependencies**: Next.js `14.x`, React `18.x`, TailwindCSS `3.4`, Prisma Client `5.x`, `lucide-react` (icons)

**Storage**: PostgreSQL via Prisma ORM — new Booking model with fields: tourId, zoneId, hotelName, travelDate, guestCount, totalPriceUSD, status, bookingReference

**Testing**: Manual testing per spec's Independent Test scenarios. No test framework detected in package.json.

**Target Platform**: Web — desktop ≥1024px (sticky sidebar) and mobile <1024px (fixed-bottom bar)

**Project Type**: Web application — client components with `"use client"` for BookingWidget, BookingFormSteps, and success page

**Performance Goals**: Zero CLS (fixed dimensions on widget), price display update <100ms on input change, spinner render <50ms of click

**Constraints**: LTR layout only; no third-party animation libraries; no payment gateway integration; no email/SMS gateways; single-day tours; desktop-first with mobile responsive

**Scale/Scope**: Single admin user; ~50 bookings/day initial volume; ~10 pickup zones; max 50 guests per tour

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality & Architecture** | ✅ PASS | `"use client"` justified (BookingWidget browser interaction, form state, API calls). Strictly typed with `CheckoutFormData`, `Booking`, `ZoneOption`. No `any`. Semantic HTML (`<form>`, `<section>`, `<article>` for success page). |
| **II. Performance & Web Vitals** | ✅ PASS | Native Tailwind transitions only. Zero CLS — fixed-width sticky sidebar on desktop, predetermined height on mobile bar. No animation deps. WebP handled by existing MediaUploader. |
| **III. UX/Conversion Architecture** | ✅ PASS | `primary-coral` (#FF5B00) on CTA button per palette. `secondary-forest` (#00473F) on trust badges. Sticky sidebar on desktop, fixed-bottom bar on mobile per spec. Loading spinner on submit. |
| **IV. Verification & Testing** | ✅ PASS | Manual testing via spec's Independent Test scenarios per Phase 0 research. Constitution's Zone Edge Calculation, Edge-Case Form Resilience, and Cross-Device Fluidity are all covered by the spec's acceptance scenarios. |
| **V. Developer's Pledge** | ✅ PASS | No placeholders, no fake code. Modular separation (widget → form steps → API → success page). |

## Project Structure

### Documentation (this feature)

```text
specs/005-booking-widget-checkout/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── bookings/
│   │       └── checkout/
│   │           └── route.ts          # M1: Secure POST endpoint
│   └── tours/
│       └── checkout/
│           └── success/
│               └── page.tsx          # M4: Success confirmation page
├── components/
│   └── tours/
│       ├── BookingWidget.tsx         # M3: Responsive widget shell (desktop + mobile)
│       └── BookingFormSteps.tsx      # M2: Two-step wizard (date/guests → pickup/contact)
└── types/
    └── booking.ts                    # CheckoutFormData, Booking, ZoneOption types
```

**Structure Decision**: Next.js App Router convention. API route under `app/api/bookings/checkout/` (matches the `POST /api/bookings/checkout` endpoint). Tour UI components under `components/tours/` (new directory for tour-facing public components). Types in `types/`. Success page under `app/tours/checkout/success/`.

## Complexity Tracking

> Not applicable — Constitution Check passed all gates (testing approach resolved as manual verification for v1).
