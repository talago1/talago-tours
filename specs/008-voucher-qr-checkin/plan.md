# Implementation Plan: Automated Digital Tour Voucher & QR Check-In Engine

**Branch**: `008-voucher-qr-checkin` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `spec.md` + 5-milestone implementation breakdown

## Summary

Digital boarding-pass voucher generator with zero-dependency client-side SVG QR codes, print-optimized Tailwind layout, secure admin check-in verification endpoint with atomic audit logging (Option A), and dual-channel voucher delivery via checkout success page and WhatsApp (Option C).

### 5 Milestones

| # | Milestone | File(s) | Core Logic |
|---|-----------|---------|------------|
| 1 | Secure Prisma Access & Audit Utility | `utils/voucherLogManager.ts` | Append-only JSON audit entries for check-in events on Booking record |
| 2 | Public Print-Optimized Voucher Page | `app/tours/voucher/[ref]/page.tsx` | RSC: fetch Booking by ref, guard on CONFIRMED status, render boarding pass with print CSS |
| 3 | Zero-Dependency SVG QR Generator | `components/vouchers/QrGeneratorCard.tsx` | Client component: pure TypeScript QR matrix encoder → SVG string, encodes admin verify URL |
| 4 | Anti-Fraud Admin Check-In Endpoint | `app/api/admin/bookings/verify/[ref]/route.ts` | PATCH handler: check existing check-in logs, atomic $transaction with audit append |
| 5 | Cross-Feature Integration (Option C) | `app/tours/checkout/success/page.tsx`, `utils/whatsappLinkBuilder.ts` | Success page CTA + WhatsApp message voucher link |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client), crypto (Node built-in)

**Storage**: PostgreSQL via Prisma ORM (Booking model extended with isCheckedIn, checkedInAt, checkInLog)

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (voucher + check-in subsystem)

**Performance Goals**: Voucher page loads in <2s (SC-001), QR renders instantly on client side (SC-006)

**Constraints**: Zero PDF generation, zero third-party QR CDN dependencies, admin auth only for verification endpoint, print CSS must strip all web UI

**Scale/Scope**: <100 bookings/day, single operator

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- Voucher page (`page.tsx`) is an RSC — fetches booking via Prisma, renders server-side HTML ✅ compliant
- QR generator component needs `"use client"` — requires browser APIs for QR matrix rendering and SVG DOM construction ✅ justified
- Verification endpoint is a Route Handler (server-only) ✅ compliant
- PASS

### Gate 2: Strict Type-Safety (I.2)
- `TicketVoucherProps`, `VerifiedVoucherPayload` interfaces are strictly typed ✅
- `checkInLog` JSON array has typed audit entry structure ✅
- No `any` types permitted ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- Boarding pass uses semantic HTML (`<main>`, `<section>`, `<article>`) ✅
- Print styles use Tailwind `print:` modifiers — no custom CSS file needed ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Voucher card has fixed dimensions and aspect ratios (zero CLS) ✅
- QR code container has reserved fixed-size box ✅
- No images to load ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- Header banner uses Forest Green `#00473F` for trust premium feel ✅
- Booking reference and pickup time use Coral `#FF5B00` for legibility ✅
- Print mode hides all CTAs — correct ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- Non-CONFIRMED bookings trigger immediate error boundary — no data leakage ✅
- Duplicate check-in detection returns 400 with original timestamp — prevents double-pass ✅
- Atomic Prisma `$transaction` for isCheckedIn + audit log write — no partial state ✅
- Generic "not found" error for invalid references — no info leakage ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/008-voucher-qr-checkin/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
└── contracts/           # Phase 1 — API contracts
    ├── voucher-page-api.md
    └── verify-checkin-api.md
```

### Source Code (repository root)

```text
src/
├── types/
│   └── voucher.ts                       # [M1] TicketVoucherProps, VerifiedVoucherPayload, CheckInLogEntry
├── components/vouchers/
│   └── QrGeneratorCard.tsx              # [M3] Client component — zero-dep SVG QR generator
├── app/
│   ├── tours/voucher/[ref]/
│   │   └── page.tsx                     # [M2] RSC — boarding pass voucher with print CSS
│   └── api/admin/bookings/verify/[ref]/
│       └── route.ts                     # [M4] PATCH — atomic check-in with anti-fraud
├── utils/
│   └── voucherLogManager.ts             # [M1] Audit log append helper for check-in events
├── tours/checkout/success/
│   └── page.tsx                         # [M5] Modified — inject voucher CTA button
└── utils/
    └── whatsappLinkBuilder.ts           # [M5] Modified — append voucher URL to templates
prisma/
└── schema.prisma                        # [M1 prerequisite] Booking model extension
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
