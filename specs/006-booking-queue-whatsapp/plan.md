# Implementation Plan: Booking Queue & WhatsApp Automation

**Branch**: `006-booking-queue-whatsapp` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `spec.md` + 4-milestone implementation breakdown

## Summary

Admin booking queue page with status management (PENDING → CONFIRMED → COMPLETED, CANCELLED from any), WhatsApp deep-link messaging in 6 languages, optimistic UI updates, and responsive layout (desktop table, mobile cards).

### 4 Milestones

| # | Milestone | File | Core Logic |
|---|-----------|------|------------|
| 1 | Booking Status Patch | `app/api/admin/bookings/[id]/status/route.ts` | PATCH handler with Prisma status update, enum validation |
| 2 | WhatsApp Deep-Link Compiler | `utils/whatsappLinkBuilder.ts` | Multi-lingual template engine + `wa.me` URL builder |
| 3 | Mobile-First Grid & Layout | `components/admin/BookingQueue.tsx` | Responsive table/card layout with Tailwind breakpoints |
| 4 | Optimistic State & Actions | `components/admin/BookingRowActions.tsx` | Status dropdown with optimistic render + WhatsApp button trigger |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client), Supabase JS (@supabase/supabase-js), lucide-react

**Storage**: PostgreSQL via Prisma ORM

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (admin subsystem)

**Performance Goals**: Zero CLS (SC-004), status update <2s server-side (SC-002)

**Constraints**: <100 active bookings (no pagination v1), single admin operator, last-save-wins concurrency

**Scale/Scope**: ~100 bookings, single admin user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- BookingQueue and BookingRowActions need `"use client"` (interaction + optimistic state) ✅ justified
- Status endpoint is Route Handler (server-only) ✅ compliant
- WhatsApp link builder is pure utility (no component) ✅ compliant
- PASS

### Gate 2: Strict Type-Safety (I.2)
- No `any` types permitted ✅
- BookingStatus must be typed as a union or Prisma enum ✅
- 6-language templates must use structured type ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- Responsive grid uses logical `flex`/`grid` patterns ✅
- No utility-class soup: componentized StatusBadge, WhatsAppButton ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Skeleton loading prevents CLS ✅
- No raw images in scope (text-only queue) ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- WhatsApp button uses brand green (#25D366), not primary-coral ✅
- Status badges use amber/emerald/blue/gray ✅
- No misuse of coral/forest tokens ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- Optimistic updates revert on server failure ✅
- Status validation on dropdown options prevents illegal transitions ✅
- WhatsApp button disabled for missing phone ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/006-booking-queue-whatsapp/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
├── contracts/           # Phase 1 — API contracts
│   └── admin-bookings-api.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── plan/
    └── plan.md          # Initial plan outline (Phase 0)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/admin/bookings/
│       ├── route.ts                          # [M3 dependency] GET all bookings
│       └── [id]/status/
│           └── route.ts                      # [M1] PATCH booking status
├── components/admin/
│   ├── BookingQueue.tsx                      # [M3] Mobile-first responsive grid
│   ├── BookingRowActions.tsx                 # [M4] Status dropdown + WhatsApp trigger
│   ├── StatusBadge.tsx                       # [M4] Color-coded badge component
│   └── WhatsAppButton.tsx                    # [M4] WhatsApp deep-link button
├── utils/
│   └── whatsappLinkBuilder.ts                # [M2] Deep-link compiler
├── types/
│   └── booking.ts                            # ActiveQueueTicket, BookingStatus types
└── app/admin/bookings/
    └── page.tsx                              # [M3] Server component page
prisma/
└── schema.prisma                             # [M1 prerequisite] Booking model + BookingStatus enum
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
