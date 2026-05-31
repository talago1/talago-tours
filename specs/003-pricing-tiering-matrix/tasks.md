---

description: "Task list for Age-Bracket Pricing implementation"

---

# Tasks: Age-Bracket Pricing

**Input**: Design documents from `/specs/003-pricing-tiering-matrix/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks — manual testing per spec's Independent Test scenarios

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router project at repository root
- `src/` for all source code, `prisma/` for database schema

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema and types for pricing tiers

- [X] T001 [P] Define new PricingFields interface in `src/types/tourBuilder.ts`  — adultPrice, childEnabled, childPrice, childMinAge, childMaxAge, infantEnabled, infantPrice, infantMinAge, infantMaxAge, ageRestrictionsNotes
- [X] T002 [P] Add pricing fields to `prisma/schema.prisma` Tour model: adultPrice (Float, Required), childPrice (Float?), childMinAge (Int?), childMaxAge (Int?), infantPrice (Float?), infantMinAge (Int?), infantMaxAge (Int?), ageRestrictionsNotes (String?)
- [X] T003 Update `TourCreatePayload` in `src/types/tourBuilder.ts` to include all new pricing fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Validation utilities

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add pricing validation to `src/utils/tourValidation.ts` — validate adultPrice > 0 (FR-006), child price > 0 when enabled (FR-007), infant price > 0 when enabled (FR-008), childMaxAge > childMinAge (FR-009), infantMaxAge > infantMinAge (FR-010)

**Checkpoint**: All pricing validation logic works as pure functions

---

## Phase 3: User Story 1 - Set Adult Pricing (Priority: P1) 🎯 MVP

**Goal**: Admin sets required adult price for tour.

**Independent Test**: Navigate to Pricing section, enter adult price — field is always visible.

- [X] T005 [US1] Rewrite `src/components/admin/PricingSection.tsx` — Adult Price input always visible at top, required field with $ prefix and validation error display
- [X] T006 [US1] Wire PricingSection into TourBuilderForm — adultPrice saved in form state, submitted in API payload, persisted to Prisma

**Checkpoint**: Adult price can be entered, validated, saved, and persisted

---

## Phase 4: User Story 2 - Enable Child Pricing with Age Range (Priority: P1)

**Goal**: Admin optionally enables child pricing with configurable age range.

**Independent Test**: Toggle "Enable Child Pricing", enter price 50, min age 3, max age 11 — all three fields appear.

- [X] T007 [US2] Add child tier toggle and fields to PricingSection — toggle reveals 3-column grid: Child Price (USD), Min Age, Max Age. Defaults: min 3, max 11 (FR-016, FR-017)
- [X] T008 [US2] Wire child pricing validation — when enabled, childPrice > 0 and childMaxAge > childMinAge (FR-007, FR-009)

**Checkpoint**: Child pricing toggle shows/hides fields; validation catches invalid configurations

---

## Phase 5: User Story 3 - Enable Infant Pricing with Age Range (Priority: P2)

**Goal**: Admin optionally enables infant pricing with configurable age range.

**Independent Test**: Toggle "Enable Infant Pricing", enter price 0, min age 0, max age 2 — all three fields appear.

- [X] T009 [US3] Add infant tier toggle and fields to PricingSection — toggle reveals 3-column grid: Infant Price (USD), Min Age, Max Age. Defaults: min 0, max 2 (FR-016, FR-017)
- [X] T010 [US3] Wire infant pricing validation — when enabled, infantPrice > 0 and infantMaxAge > infantMinAge (FR-008, FR-010)

**Checkpoint**: Infant pricing toggle shows/hides fields; validation catches invalid configurations

---

## Phase 6: User Story 4 - Document Age & Safety Restrictions (Priority: P2)

**Goal**: Admin enters free-text age and safety restrictions.

**Independent Test**: Enter text in restrictions textarea, submit — text persists on save.

- [X] T011 [US4] Add age restrictions textarea to PricingSection — labeled "Important Age & Safety Restrictions", 3 rows, placeholder with example (FR-011)
- [X] T012 [US4] Wire textarea into TourBuilderForm submit payload and API route — saved as optional string in Prisma

**Checkpoint**: Age restrictions notes enter and persist correctly

---

## Phase 7: Polish

- [X] T013 Add server-side pricing validation in `src/app/api/admin/tours/create/route.ts` — mirrors all client-side rules (adultPrice required, child/infant age range checks when enabled)
- [X] T014 Verify toggle interactions — enabling/disabling child/infant correctly excludes fields from save payload; sensible defaults apply only on first enable
- [X] T015 Run build — verify zero type errors, all imports resolve

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup
- **US1 (Phase 3)**: Depends on Foundational — adult pricing panel
- **US2 (Phase 4)**: Depends on US1 — child tier
- **US3 (Phase 5)**: Depends on US1 — infant tier
- **US4 (Phase 6)**: Depends on US1 — restrictions textarea
- **Polish (Phase 7)**: Depends on all stories

### Parallel Opportunities

- T001, T002: types + schema are independent
- T005, T006, T011: pricing UI, wiring, and textarea are independent

---

## Implementation Strategy

All tasks completed in a single pass — Prisma schema extended, PricingSection redesigned with toggles, validation added client+server, submit payload updated, build verified clean.
