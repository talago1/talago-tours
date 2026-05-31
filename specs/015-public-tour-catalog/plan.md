# Implementation Plan: Viator-Style Public Tour Catalog, Interactive Search & Filtering Engine

**Branch**: `015-public-tour-catalog` | **Date**: 2026-05-30 | **Spec**: spec.md

**Input**: Feature specification from `specs/015-public-tour-catalog/spec.md` + 4-milestone implementation breakdown

## Summary

Build an unauthenticated public tour catalog page with responsive grid, client-side search/filter sidebar (destination, category, price range, keyword), and a high-performance public API endpoint. The catalog is the primary entry point for all tour discovery.

### 4 Milestones

| # | Milestone | File(s) | Core Logic |
|---|-----------|---------|------------|
| 1 | High-Efficiency Public Data Fetch Utils | `utils/publicTourQueries.ts` | Prisma queries with selective projection (id, title, slug, price, duration, rating, thumbnailUrl, status) eager-loading destination name/slug; only ACTIVE tours |
| 2 | Lightning-Fast Public Catalog Search API | `app/api/public/tours/route.ts` | GET handler parsing `?destination=slug&type=category&minPrice=X&maxPrice=Y&search=keyword` → dynamic Prisma `where` compilation |
| 3 | High-Reactivity Sidebar Filters & Search Control | `components/public/FilterSidebar.tsx` | `"use client"`: price range slider, multi-select category checkboxes, debounced keyword search (300ms), destination dropdown |
| 4 | Viator-Style Showcase Grid & Custom Product Cards | `components/public/TourGrid.tsx`, `components/public/TourCard.tsx` | Responsive grid (`grid-cols-1 sm:2 md:3 lg:4 gap-6`), 4:3 image constraint (zero CLS), coral CTAs, star rating |

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14.2+

**Primary Dependencies**: Prisma 5 (@prisma/client), next/navigation (useSearchParams, useRouter)

**Storage**: PostgreSQL via Prisma ORM (Tour model extended with catalog fields)

**Testing**: Manual — no test framework in project

**Target Platform**: Web (Next.js 14 App Router)

**Project Type**: Web application (public-facing catalog subsystem)

**Performance Goals**: Initial grid load <2s (SC-001), filter updates <100ms (SC-002), slider/checkbox response <50ms (SC-003), API response <500ms (SC-006)

**Constraints**: No authentication on public API; all filters use AND logic; keyword debounce 300ms; zero CLS on card images; server-side initial fetch with client-side filter sync

**Scale/Scope**: 50+ tours, public endpoint with rate limiting, single language (EN for catalog — multi-language out of scope)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate 1: Server-First Mindset (I.1)
- Catalog page is RSC — fetches via the public API endpoint server-side ✅
- FilterSidebar needs `"use client"` (interactive filters, debounce, URL state) ✅ justified
- TourCard/TourGrid are presentational — no client directive needed ✅
- Public API route handler is server-only ✅
- PASS

### Gate 2: Strict Type-Safety (I.2)
- `PublicTourQueryResult`, `FilterSidebarProps`, `TourCardProps`, `TourGridProps` — strict interfaces ✅
- No `any` types permitted ✅
- Tournament of typed filter state with discriminated unions ✅
- PASS

### Gate 3: Zero Tailwind Bloat (I.3)
- Grid layout uses standard responsive utilities (`grid-cols-1 sm:2 md:3 lg:4`) ✅
- TourCard is a componentized unit — no repeated utility soup ✅
- Semantic HTML: `<section>` for grid, `<article>` for cards, `<aside>` for filter sidebar ✅
- LTR layout only ✅
- PASS

### Gate 4: Performance & CLS (II.2)
- Card images use `aspect-[4/3]` — zero CLS ✅
- First-row cards use `priority={true}` on next/image ✅
- No third-party animation dependencies ✅
- Native Tailwind transitions for hover/filter interactions ✅
- PASS

### Gate 5: Conversion Palette (III.1)
- CTA buttons on cards use `primary-coral` (`#FF5B00`) ✅
- Destination badges and rating trust elements use `secondary-forest` (`#00473F`) ✅
- No coral on non-interactive elements ✅
- PASS

### Gate 6: Fail-Safe Error Handling (III.5)
- Loading skeleton on initial mount ✅
- Error state with retry button ✅
- Empty states: "No tours available" (no data) + "No tours match" (filtered out) ✅
- Debounced search prevents request storms ✅
- Button loading state on CTA click to prevent double-submit ✅
- PASS

**Status**: ALL GATES PASS ✅

## Project Structure

### Documentation (this feature)

```text
specs/015-public-tour-catalog/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — research
├── data-model.md        # Phase 1 — data model
├── quickstart.md        # Phase 1 — implementation guide
└── contracts/           # Phase 1 — API contracts
    └── public-tours-get-api.md
```

### Source Code (repository root)

```text
src/
├── utils/
│   └── publicTourQueries.ts            # [M1] Prisma query functions
├── app/
│   └── api/public/tours/
│       └── route.ts                    # [M2] GET — public catalog search API
├── components/
│   └── public/
│       ├── FilterSidebar.tsx            # [M3] Client-side filters + search
│       ├── TourGrid.tsx                 # [M4] Responsive grid component
│       └── TourCard.tsx                 # [M4] Single tour card
└── types/
    └── publicTour.ts                   # [M1] TypeScript interfaces

prisma/
└── schema.prisma                        # [prerequisite] Tour model extensions
```

## Complexity Tracking

No constitutional violations — all gates pass cleanly. Complexity tracking is N/A.
