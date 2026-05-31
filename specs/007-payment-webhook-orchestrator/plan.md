# Implementation Plan: Secure Regional Payment Integration & Webhook Orchestrator

**Branch**: `007-payment-webhook-orchestrator` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `spec.md` + 4-milestone implementation breakdown

## Summary

Payment integration with Paymob (card + Fawry) for TALAGO tours. Includes: payment initiation API (POST /api/payments/initiate), HMAC-secured webhook handler (POST /api/payments/webhook), transitional payment page (`/tours/checkout/pay`), and Booking model extension with paymentStatus and paymentGatewayLogs.

### 4 Milestones

| # | Milestone | File | Core Logic |
|---|-----------|------|------------|
| 1 | Environment & Crypto Setup | `types/payment.ts` | TypeScript interfaces, env var verification for PAYMOB_API_KEY/INTEGRATION_ID/HMAC_SECRET |
| 2 | Gateway Initiation Route | `app/api/payments/initiate/route.ts` | POST handler: auth token → order registration → payment key → return redirect URL |
| 3 | HMAC Webhook Controller | `app/api/payments/webhook/route.ts` | POST handler: raw body → alphanumeric sort → HMAC-SHA256 → atomic Prisma update |
| 4 | Checkout Pay Transitional Screen | `app/tours/checkout/pay/page.tsx` | Client component: fetch initiate → window redirect, fallback coral button |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client), crypto (Node built-in, for HMAC-SHA256)

**Storage**: PostgreSQL via Prisma ORM (Booking model extended with paymentStatus, paymentGatewayLogs)

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (payment subsystem)

**Performance Goals**: Webhook processing <500ms (SC-002), payment redirect within 3s (SC-001)

**Constraints**: HMAC validation must happen before any database mutation; atomic Prisma transaction for status updates; env vars must be verified on boot

**Scale/Scope**: <100 bookings/day, single gateway (Paymob)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- Payment page needs `"use client"` (browser redirect, fetch) ✅ justified
- Initiate route is Route Handler (server-only) ✅ compliant
- Webhook route is Route Handler (server-only) ✅ compliant
- PASS

### Gate 2: Strict Type-Safety (I.2)
- `types/payment.ts` provides strict interfaces for Paymob requests and webhook payloads ✅
- No `any` types permitted ✅
- Webhook HMAC computation uses typed buffer comparisons ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- Payment page uses minimal layout: spinner + fallback button ✅
- No utility-class soup ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Payment page has no images ✅
- Spinner has fixed dimensions (zero CLS) ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- Fallback button uses `primary-coral` (#FF5B00) — appropriate for CTA ✅
- Forest Green (#00473F) for text hints ✅
- Correct color allocation ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- HMAC validation rejects unauthorized before DB mutation ✅
- Atomic Prisma transaction prevents partial updates ✅
- Fallback button on payment page prevents dead-end UX ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/007-payment-webhook-orchestrator/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
└── contracts/           # Phase 1 — API contracts
    ├── initiate-payment-api.md
    └── webhook-api.md
```

### Source Code (repository root)

```text
src/
├── types/
│   └── payment.ts                       # [M1] Payment interfaces + env verification
├── app/
│   ├── api/payments/
│   │   ├── initiate/
│   │   │   └── route.ts                 # [M2] POST — create Paymob session
│   │   └── webhook/
│   │       └── route.ts                 # [M3] POST — receive HMAC-signed notification
│   └── tours/checkout/pay/
│       └── page.tsx                     # [M4] Transitional payment page
├── utils/
│   └── paymob.ts                        # [M2] Paymob API helpers (auth, order, payment key)
└── lib/
    └── env.ts                           # [M1] Env var verification on boot
prisma/
└── schema.prisma                        # [M2 prerequisite] Booking model extension
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
