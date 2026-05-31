# Implementation Plan: Dynamic Milestone Timeline Itinerary Builder & Display

**Branch**: `004-itinerary-timeline` | **Date**: 2026-05-30 | **Spec**: `specs/004-itinerary-timeline/spec.md`

**Input**: Feature specification from `/specs/004-itinerary-timeline/spec.md`

## Summary

Build a dual-component itinerary feature: an admin builder panel for creating chronological milestones with time tags, icons, and multi-language titles (6 languages), plus a public-facing vertical timeline component for the tour page. Milestones are stored as a JSON array within the Tour record. Admin builder hooks into the existing language tab system for localized title editing.

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14+ (App Router)

**Primary Dependencies**: Next.js `14.x`, TailwindCSS `3.4`, Prisma Client `5.x`, React `18.x`, `lucide-react` (icon library)

**Storage**: PostgreSQL via Prisma ORM — itinerary array stored as `Json` field on Tour model

**Testing**: NEEDS CLARIFICATION — no test framework detected in `package.json`

**Target Platform**: Web — desktop browser ≥1024px (both admin builder and public timeline)

**Project Type**: Web application — admin client component (`"use client"`) + public server component with interactive elements

**Performance Goals**: Add milestone <100ms, reorder instantly, zero CLS on timeline render, hover transitions without layout shift

**Constraints**: LTR-only layout; no third-party animation libraries; single-day itinerary only; desktop-only; no rich text in titles

**Scale/Scope**: Single admin user; ~20 milestones per tour; 6 language fields per milestone title

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality & Architecture** | ✅ PASS | `"use client"` justified on builder (form interaction). Public timeline can be a client component for hover effects. Strictly typed with `ItineraryMilestone`, `LocalizedMilestoneTitle`. No `any`. Semantic HTML (`section` for timeline, `article` for nodes). |
| **II. Performance & Web Vitals** | ✅ PASS | Native Tailwind transitions only (`hover:scale-105`). Zero CLS — fixed timeline track width, predetermined node dimensions. No animation dependencies. |
| **III. UX/Conversion Architecture** | ✅ PASS | `secondary-forest` (`#00473F`) for icon bubbles (per palette). Format validation on save. Timeline is informational — no CTA buttons needed. |
| **IV. Verification & Testing** | ⚠️ GATE: NEEDS RESEARCH | Constitution requires edge-case form resilience and cross-device fluidity verification. No test framework detected. |
| **V. Developer's Pledge** | ✅ PASS | No placeholders, no fake code. Modular component separation (builder vs display). |

## Project Structure

### Documentation (this feature)

```text
specs/004-itinerary-timeline/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── admin/
│   │   └── ItineraryBuilder.tsx        # Admin builder panel (M3)
│   └── tours/
│       └── TourTimeline.tsx            # Public timeline display (M4)
├── types/
│   └── itinerary.ts                     # Type system + icon mapper (M2)
└── utils/
    └── itineraryValidator.ts            # Validation utilities (M1)
```

**Structure Decision**: Next.js App Router convention. Builder under `components/admin/` (matches existing `MediaUploader`, `PricingMatrix`). Public display under `components/tours/` (new directory for tour-facing components). Types in `types/`, utilities in `utils/`.

## Complexity Tracking

> **Not applicable** — Constitution Check passed all gates (testing approach to be resolved in Phase 0 research).
