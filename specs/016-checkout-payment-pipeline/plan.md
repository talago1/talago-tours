# Implementation Plan: Hybrid Checkout & Payment Pipeline

**Branch**: `016-checkout-payment-pipeline` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `specs/016-checkout-payment-pipeline/spec.md` + 4-milestone implementation breakdown

## Summary

Build a complete checkout-to-payment pipeline with three payment schemes (Full Online, Deposit Online, Pay on Arrival), Paymob/Fawry gateway integration, and HMAC-secured webhook processing with downstream integration to the daily operations manifest and QR voucher system.

### 4 Milestones

| # | Milestone | File(s) | Core Logic |
|---|-----------|---------|------------|
| 1 | Prisma Hybrid Financial Ledger Migration | `prisma/schema.prisma` | Transaction model with PaymentScheme/PaymentStatus/PaymentProvider enums; Booking extended with paymentScheme, amountPaidOnline (Decimal), amountDueOnArrival (Decimal) |
| 2 | Secure Pre-Routing & Gateway Initialization API | `app/api/checkout/initialize/route.ts` | POST handler: capacity check → pricing split → PAY_ON_ARRIVAL: persist PENDING transaction → online: Paymob/Fawry handshake → return iframe URL |
| 3 | Viator-Style Checkout Canvas & Sticky Math Sidebar | `app/checkout/[tourId]/page.tsx`, `components/checkout/PriceSummarySidebar.tsx` | 2-column client-side layout: passenger/pickup form + sticky reactive pricing sidebar with Coral cash-due display |
| 4 | Cryptographic Webhook Route & Operational Manifest Integration | `app/api/webhooks/payment/route.ts` | POST listener: HMAC signature verification → atomic Transaction→SUCCESS + Booking→CONFIRMED → trigger QR voucher + pipe cash balances to Feature 11 manifest |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client), crypto (Node built-in, for HMAC-SHA256), next/navigation

**Storage**: PostgreSQL via Prisma ORM (Transaction model + Booking extensions)

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (checkout/payment subsystem)

**Performance Goals**: Price breakdown update <200ms (SC-003), webhook processing <10s (SC-004), checkout form submission with capacity check <2s

**Constraints**: Server-side price calculation only; HMAC must validate before any DB mutation; atomic Prisma transaction for status updates; no raw payment credential storage

**Scale/Scope**: <100 bookings/day, dual gateway (Paymob + Fawry), single currency (EGP), fixed 20% deposit rate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- Checkout page needs `"use client"` (form interaction, dynamic pricing, gateway redirect) ✅ justified
- PriceSummarySidebar needs `"use client"` (reactive scheme state, sticky scroll) ✅ justified
- Initialize API is Route Handler (server-only) ✅
- Webhook route is Route Handler (server-only) ✅
- PASS

### Gate 2: Strict Type-Safety (I.2)
- PaymentScheme, PaymentStatus, PaymentProvider — Prisma enums provide strict typing ✅
- Transaction model fields strictly typed (Decimal for financial fields) ✅
- Booking extended with paymentScheme, amountPaidOnline, amountDueOnArrival — strongly typed ✅
- No `any` types permitted ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- 2-column layout: `grid grid-cols-1 lg:grid-cols-3 gap-8` ✅
- PriceSummarySidebar is componentized — no utility soup ✅
- Semantic HTML: `<form>` for inputs, `<aside>` for sidebar ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Price breakdown has fixed bounding box — zero CLS when values change ✅
- Sidebar locks cleanly on scroll without micro-stuttering ✅
- No third-party animation dependencies ✅
- Native Tailwind transitions for scheme toggle ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- Submit/CTA buttons use `primary-coral` (`#FF5B00`) ✅
- Cash due on arrival uses `text-[#FF5B00] text-xl font-bold` ✅
- Forest green (`#00473F`) for trust badges and validation indicators ✅
- Correct color allocation ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- Client-side form validation before submit ✅
- Button loading state on click to prevent duplicate submissions ✅
- Capacity check prevents overbooking ✅
- HMAC verification blocks unauthorized webhooks before DB mutation ✅
- Atomic Prisma transaction prevents partial status updates ✅
- Payment failure → retry option preserves booking draft ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/016-checkout-payment-pipeline/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
└── contracts/           # Phase 1 — API contracts
    ├── checkout-initiate-api.md
    └── webhook-payment-api.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── checkout/initialize/
│   │   │   └── route.ts                    # [M2] POST — order gate initialization
│   │   └── webhooks/payment/
│   │       └── route.ts                    # [M4] POST — payment callback webhook
│   └── checkout/[tourId]/
│       └── page.tsx                        # [M3] Checkout page (client component)
├── components/
│   └── checkout/
│       └── PriceSummarySidebar.tsx         # [M3] Sticky pricing sidebar
├── types/
│   └── checkout.ts                         # [M3] TypeScript interfaces
├── utils/
│   └── payment.ts                          # [M2] Paymob/Fawry API helpers
└── lib/
    └── webhook.ts                          # [M4] HMAC verification utility

prisma/
└── schema.prisma                           # [M1] Transaction model + Booking extensions
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
