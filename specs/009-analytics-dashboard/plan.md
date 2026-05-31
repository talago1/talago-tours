# Implementation Plan: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

**Branch**: `009-analytics-dashboard` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `spec.md` + 4-milestone implementation breakdown

## Summary

Admin analytics dashboard with Prisma aggregation queries: summary metrics grid (revenue, net margin, passengers, top tour), channel attribution breakdown (VIATOR/GETYOURGUIDE/WHATSAPP/HOTEL_DIRECT/WEBSITE) with Tailwind progress bars, timeframe filtering (Today/7D/Month/YTD), and 15-minute cache revalidation.

### 4 Milestones

| # | Milestone | File(s) | Core Logic |
|---|-----------|---------|------------|
| 1 | Prisma Schema & Exchange Rate Config | `prisma/schema.prisma`, `config/exchangeRates.ts` | BookingChannel enum, channel field on Booking, static USD:EGP rates |
| 2 | Secure Aggregation API Endpoint | `app/api/admin/analytics/summary/route.ts` | GET with admin guard, Prisma groupBy + _sum + _count, timeframe filtering, revalidation=900s |
| 3 | Executive Dashboard Panel | `components/admin/AnalyticsDashboard.tsx` | `"use client"` — 4-column metrics grid, channel attribution progress bars, Tailwind-only |
| 4 | Timeframe Filters & Skeleton States | `components/admin/AnalyticsTimeFilters.tsx` | Filter toggle bar (Today/7D/Month/YTD), URL query state, skeleton placeholders |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client) — aggregation operators (_sum, _count, groupBy)

**Storage**: PostgreSQL via Prisma ORM (Booking model extended with channel enum, Tour model extended with cost fields)

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (admin analytics subsystem)

**Performance Goals**: Dashboard loads in <2s (SC-001), filter changes reflect in <3s (SC-002), zero CLS (SC-003)

**Constraints**: No third-party chart libraries, no live exchange rate APIs, 15-minute cache TTL, admin-only access

**Scale/Scope**: <100 bookings/day, single operator, English-only admin UI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- Analytics endpoint is a Route Handler (server-only) with Prisma aggregation ✅ compliant
- Dashboard component needs `"use client"` — requires state management for timeframe, loading skeletons, and browser rendering ✅ justified
- Timeframe filter component is child of dashboard — also `"use client"` ✅ justified
- PASS

### Gate 2: Strict Type-Safety (I.2)
- `ExecutiveDashboardStats`, `ChannelSummary`, `BookingChannel` interfaces are strictly typed ✅
- Prisma `groupBy` returns typed results ✅
- No `any` types permitted ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- Summary cards use consistent layout classes — composable card component ✅
- Channel progress bars use native Tailwind (`bg-gray-100`, `bg-[#00473F]`, `rounded-full`) — no custom CSS ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Summary cards have fixed dimensions (skeleton matches card) ✅
- Skeleton placeholders prevent layout shift ✅
- 15-min cache prevents repeated DB load ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- Top Tour badge uses Coral `#FF5B00` accent ✅
- Channel attribution bars use Forest Green `#00473F` fill ✅
- Correct color allocation (Coral for highlights/CTAs, Forest for trust/structure) ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- Admin auth guard prevents unauthorized access ✅
- Zero-bookings state shows $0.00 / "—" gracefully ✅
- Exchange rate config missing fallback to 1:1 with warning banner ✅
- Skeleton states during loading ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/009-analytics-dashboard/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
└── contracts/           # Phase 1 — API contracts
    └── analytics-summary-api.md
```

### Source Code (repository root)

```text
src/
├── config/
│   └── exchangeRates.ts                  # [M1] Static USD:EGP rate config with precision handling
├── components/admin/
│   ├── AnalyticsDashboard.tsx            # [M3] Client component — metrics grid + channel attribution
│   └── AnalyticsTimeFilters.tsx          # [M4] Client component — timeframe toggle bar
├── app/api/admin/analytics/summary/
│   └── route.ts                          # [M2] GET — Prisma aggregation with admin guard
├── types/
│   └── analytics.ts                      # [M2] ExecutiveDashboardStats, ChannelSummary, BookingChannel
prisma/
└── schema.prisma                         # [M1] BookingChannel enum + channel field on Booking
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
