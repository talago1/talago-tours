# Implementation Plan: Universal Tour Builder & Multi-Language Form Engine

**Branch**: `002-tour-builder-form` | **Date**: 2026-05-30 | **Spec**: `specs/002-tour-builder-form/spec.md`

**Input**: Feature specification from `/specs/002-tour-builder-form/spec.md`

## Summary

Build an administrative tabbed form for creating tours with multi-language content across 6 languages (EN, DE, RU, FR, IT, TR). A single global section handles shared metadata (slug, price, duration, capacity, type, zone) while each language tab provides independent localized fields (title, description, cancellation policies). Client-side validation enforces URL-safe slug, non-zero numerics, and required English content. Server-side slug uniqueness check prevents duplicates. The submit button disables on click to prevent double-submission.

## Technical Context

**Language/Version**: TypeScript 5.4+, Next.js 14+ (App Router)

**Primary Dependencies**: Next.js `14.x`, TailwindCSS `3.4`, Prisma Client `5.x`, React `18.x`

**Storage**: PostgreSQL via Prisma ORM — `Tour` model with `Json` fields for localized content

**Testing**: NEEDS CLARIFICATION — no test framework detected in `package.json`

**Target Platform**: Web — desktop browser ≥1024px (per spec assumptions)

**Project Type**: Web application — admin panel page with form (`"use client"` component)

**Performance Goals**: Tab switches instant (<100ms), validation errors <100ms, submission feedback <5s, zero layout shift on tab switch

**Constraints**: 6 languages (EN, DE, RU, FR, IT, TR); LTR-only layout; no auto-save/draft recovery; no third-party animation libraries

**Scale/Scope**: Single admin user form; 6 language workspaces; ~50 tours/year initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality & Architecture** | ✅ PASS | `"use client"` justified (form interaction/browser APIs). `LocalizedContent` typed for all 6 languages. No `any`. Semantic HTML (form, label, section). |
| **II. Performance & Core Web Vitals** | ✅ PASS | No heavy animation deps. Native Tailwind transitions only. Zero CLS — all tabs in-DOM with `hidden` toggle. No images/assets in this form. |
| **III. UX/Conversion Architecture** | ✅ PASS | `#FF5B00` on submit button only (per conversion palette). Button disables on click (FR-009/FR-010). Fail-safe validation (FR-007, FR-008, FR-006b). |
| **IV. Verification & Testing** | ⚠️ GATE: NEEDS RESEARCH | Constitution requires systematic verification. No test framework detected. Research Phase 0 must determine testing approach. |
| **V. Developer's Pledge** | ✅ PASS | No placeholders, no fake code, modular enterprise structure. |

## Project Structure

### Documentation (this feature)

```text
specs/002-tour-builder-form/
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
├── app/
│   ├── admin/
│   │   └── tours/
│   │       └── new/
│   │           └── page.tsx        # Master workspace page (M4)
│   └── api/
│       └── admin/
│           └── tours/
│               └── create/
│                   └── route.ts    # POST create endpoint (M1)
├── components/
│   └── admin/
│       ├── LanguageTabs.tsx         # Tab navigator component (M3)
│       ├── TourBuilderForm.tsx      # Main form orchestrator
│       ├── GlobalFields.tsx         # Shared metadata fields section
│       └── LocalizedPanel.tsx       # Per-language field panel
├── types/
│   └── tourBuilder.ts               # Type system definitions (M2)
└── lib/
    └── prisma.ts                    # Prisma client (existing)
```

**Structure Decision**: Next.js App Router convention — pages in `app/` directory, shared components in `components/`, types in `types/`. Matches existing feature 001 structure.

## Phase 0: Research

All technical decisions resolved in research.md — see consolidated decisions:

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Testing approach | Manual validation via spec's Independent Test scenarios | No test framework in project; adding scope beyond feature |
| Prisma schema | Expand `Tour` model, create `Zone` model, use `Json` for translations | Natural fit for fixed 6-language schema |
| Zone data source | Minimal `Zone` model in Prisma | No existing zone system found |
| Cancellation policy storage | `string[]` within each language's translation block | Variable rows per language |
| Slug uniqueness | Server-side check before insert → 409 conflict | Defense in depth |
| Form state architecture | Single React state with all 6 language panels in-DOM (`hidden` toggle) | Preserves input state per FR-004 |
| Submit flow | Client validate → disable button → POST → server validate → create | Double-submission prevention |

### Research Report

Generated at `research.md` — see detailed decision records with alternatives considered.

## Phase 1: Design & Contracts

### Data Model

Generated at `data-model.md`:
- `TourType` enum (SHARED, PRIVATE)
- `Tour` model with slug, type, pricing, duration, capacity, zoneId, translations (Json), images
- `Zone` model with id, name, timestamps
- `Translations` JSON structure: `Record<LanguageCode, TranslationEntry>` with title, description, cancellationPolicies per language

### API Contract

Generated at `contracts/create-tour-api.md`:
- `POST /api/admin/tours/create` — creates a new tour with full 6-language translation block
- 10 server-side validation rules including slug uniqueness, English content required, all language keys present

### Quickstart

Generated at `quickstart.md` — 8 files to create with data flow documentation.

### Agent Context

AGENTS.md updated with plan reference.

## Complexity Tracking

> **Not applicable** — Constitution Check passed all gates (testing approach resolved in Phase 0 research; no violations to justify).
