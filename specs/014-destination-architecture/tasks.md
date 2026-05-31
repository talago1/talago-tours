# Tasks: Dynamic Multi-Destination Architecture Upgrade (Feature 014)

**Input**: Design documents from `/specs/014-destination-architecture/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `prisma/` at repository root
- Paths follow the plan.md and quickstart.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Utility functions and type definitions shared across all user stories

- [ ] T001 Create shared TypeScript types at `src/types/destination.ts` with Destination, DestinationFormData, DestinationCreateRequest, DestinationUpdateRequest, DestinationListResponse interfaces
- [ ] T002 Create shared slug generation utility at `src/utils/slug.ts` with `generateSlug(name: string): string` — lowercases, trims, strips non-alphanumeric, spaces to hyphens, collapses multiple hyphens, trims leading/trailing hyphens

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema migration — MUST be complete before any user story can proceed

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add `model Destination` with fields (id, name, slug @unique, imageUrl?, createdAt, updatedAt) and `tours Tour[]` relation to `prisma/schema.prisma`
- [ ] T004 Add `destinationId String` field, `destination Destination @relation` pointer with `onDelete: Restrict`, and `@@index([destinationId])` to existing `model Tour` in `prisma/schema.prisma`
- [ ] T005 Run `npx prisma migrate dev --name add-destination-model` to generate and apply the database migration

**Checkpoint**: Foundation ready — Destination model exists in DB, Tour has destinationId relation. User story implementation can begin.

---

## Phase 3: User Story 1 — Admin manages tour destinations (Priority: P1) 🎯 MVP

**Goal**: An operations or marketing manager opens the destination management panel, sees an alphabetical grid of destinations, can add new ones with auto-slug, edit name/thumbnail, and delete destinations with no tours assigned.

**Independent Test**: Open the destination panel, add a new city (e.g., "Marsa Alam"), verify the card appears with auto-generated slug "marsa-alam" in the grid, edit the name to "Marsa Alam City", verify slug updates to "marsa-alam-city", then delete and confirm removal.

### Implementation for User Story 1

- [ ] T006 [US1] Create GET + POST handler at `src/app/api/admin/destinations/route.ts` with admin auth guard — GET returns alphabetical list with tour counts, POST validates name + optional imageUrl, generates slug via `generateSlug()`, creates Destination via Prisma, handles duplicate slug (P2002) with friendly error
- [ ] T007 [P] [US1] Create GET by ID + PUT + DELETE handler at `src/app/api/admin/destinations/[id]/route.ts` with admin auth guard — GET returns single destination, PUT regenerates slug on name change (catch P2002), DELETE pre-checks tour count and returns descriptive error if > 0
- [ ] T008 [US1] Create DestinationManager client component at `src/components/admin/DestinationManager.tsx` with `"use client"` directive — fetches destination list on mount, renders `grid grid-cols-1 md:grid-cols-3 gap-4` card grid with name, thumbnail (or placeholder), slug, tour count badge; Add modal form with name input + thumbnail upload (reuse existing MediaUploader) + slug preview + auto-slug generation; Edit modal pre-filled with current data; Delete confirmation dialog with tour count check; loading skeleton grid matching card dimensions (zero CLS); empty state "No destinations yet"; error state with retry button
- [ ] T009 [US1] Create admin destinations page at `src/app/admin/destinations/page.tsx` as a server component rendering DestinationManager with page title and breadcrumb

**Checkpoint**: User Story 1 complete — admin can perform full CRUD on destinations, with auto-slug, restricted delete, thumbnail upload, and proper loading/empty/error states.

---

## Phase 4: User Story 2 — Tour builder uses dynamic destination selector (Priority: P2)

**Goal**: A product manager creating or editing a tour in the Admin Tour Builder Form uses a searchable destination dropdown that filters as they type and pre-populates on edit.

**Independent Test**: Open the Tour Builder, type a partial match (e.g., "mar") in the destination field, verify only "Marsa Alam" appears in filtered results, select it, save the tour, reopen, and confirm the destination is pre-populated.

### Implementation for User Story 2

- [ ] T010 [US2] Create DestinationSelect client component at `src/components/ui/DestinationSelect.tsx` with `"use client"` directive — accepts `value: string | null` and `onChange: (id: string) => void` props; fetches GET /api/admin/destinations on mount; renders search input with filtered dropdown via `useMemo` (case-insensitive substring match); shows selected name when value is set; keyboard navigation (arrow keys, enter, escape); loading skeleton state; empty state "No destinations found"; no-match state "No results for '{query}'"; zero CLS with fixed dropdown dimensions
- [ ] T011 [US2] Find the static city/region text input in Tour Builder form files (Feature 002/003) at `src/app/admin/tours/create/page.tsx` or equivalent — replace with `<DestinationSelect>` component, wire `destinationId` to form state, pre-populate from existing tour data on edit mode, ensure destinationId is submitted with the tour payload

**Checkpoint**: User Story 2 complete — Tour Builder uses dynamic DestinationSelect with search, select, and pre-population.

---

## Phase 5: User Story 3 — Analytics and daily manifest filter by destination (Priority: P3)

**Goal**: A manager viewing analytics or the daily manifest can optionally filter by destination — data scopes to tours in the selected city. No filter shows all data (backward compatible).

**Independent Test**: Open analytics dashboard without filter (all data shown), apply destination filter for "Hurghada", confirm revenue/margin/passenger count updates to reflect only Hurghada tours. Open daily manifest without filter (all tours), apply filter, confirm only filtered tours appear.

### Implementation for User Story 3

- [ ] T012 [US3] Extend the analytics summary endpoint at `src/app/api/admin/analytics/summary/route.ts` — parse optional `destinationId` from URL search params, add Prisma WHERE clause `booking.tour.destinationId = destinationId` when present, no changes to response shape
- [ ] T013 [US3] Extend the Feature 011 manifest query pipeline at `utils/manifestQueryBuilder.ts` or equivalent — parse optional `destinationId` from URL search params, filter tours by destinationId when present, return scoped manifest rows

**Checkpoint**: User Story 3 complete — analytics and manifest accept optional destination filter with backward-compatible default.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and completeness tasks

- [ ] T014 Handle edge case: duplicate slug on POST — DestinationManager at `src/components/admin/DestinationManager.tsx` displays inline error message from API (409 slug conflict), allows user to modify name and retry
- [ ] T015 Handle edge case: restricted delete with tour count — DestinationManager at `src/components/admin/DestinationManager.tsx` displays the error message from API with specific tour count and destination name, delete button remains disabled
- [ ] T016 Handle edge case: no image placeholder — DestinationManager at `src/components/admin/DestinationManager.tsx` shows a consistent placeholder card (gray background with location icon) when `imageUrl` is null
- [ ] T017 Update `AGENTS.md` to point plan reference to `specs/014-destination-architecture/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001–T002 can start immediately
- **Foundational (Phase 2)**: Depends on Setup — T003–T005 BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — creates Destination API, DestinationManager, admin page
- **US2 (Phase 4)**: Depends on Foundational + US1 — DestinationSelect depends on GET endpoint from US1; Tour Builder integration depends on existing form files
- **US3 (Phase 5)**: Depends on Foundational — analytics/manifest endpoints exist independently of US1/US2
- **Polish (Phase 6)**: Depends on US1 (T014–T016), T017 is independent

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependencies on other stories
- **US2 (P2)**: Starts after Foundational + US1 — requires the GET /api/admin/destinations endpoint from US1
- **US3 (P3)**: Starts after Foundational — independent of US1/US2, only depends on existing Feature 009/011 endpoints
- **US3 can be built in parallel with US1** if the Feature 009 analytics endpoint already exists

### Within Each Story

- Types and utilities before API endpoints (Setup phase)
- API endpoints before component integration
- Component before page integration

### Parallel Opportunities

- **Phase 1**: T001 and T002 are independent files — can be built in parallel
- **Phase 2**: T003 and T004 are independent model blocks — T003 (Destination model) can be parallel with T004 (Tour extension)
- **Phase 3**: T006 (main route) and T007 ([id] route) are independent endpoints — can be built in parallel
- **Phase 5**: T012 (analytics) and T013 (manifest) are independent endpoints — can be built in parallel
- **Phase 6**: T014–T016 are independent edge case handlers for DestinationManager — can be built in parallel
- **US3 can start in parallel with US1** if Feature 009/011 endpoints already exist

---

## Parallel Example: Foundational Phase

```bash
# Launch Destination model and Tour extension in parallel (different model blocks):
Task: "Add Destination model to prisma/schema.prisma"
Task: "Add destinationId field + relation + index to Tour model in prisma/schema.prisma"
```

## Parallel Example: User Story 1

```bash
# Launch main route and [id] route in parallel:
Task: "Create GET+POST destinations route in src/app/api/admin/destinations/route.ts"
Task: "Create GET+PUT+DELETE destination route in src/app/api/admin/destinations/[id]/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — types + slug utility
2. Complete Phase 2: Foundational — Prisma schema + migration
3. Complete Phase 3: User Story 1 — DestinationManager with full CRUD
4. **STOP and VALIDATE**: Test US1 independently — add, edit, delete destinations in the grid
5. Deploy/demo if ready — destination management works standalone

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001–T005)
2. Add User Story 1 → US1 complete → Deploy (MVP — manage destinations!)
3. Add User Story 2 → US2 complete → Deploy (Tour Builder selector!)
4. Add User Story 3 → US3 complete → Deploy (analytics/manifest filtering!)
5. Add Polish → Edge cases handled → Final

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T005)
2. Once Foundational is done:
   - Developer A: User Story 1 (T006–T009) — API + DestinationManager
   - Developer B: User Story 3 (T012–T013) — analytics/manifest filter (no dependency on US1)
3. After US1 is complete:
   - Developer A: User Story 2 (T010–T011) — DestinationSelect + Tour Builder integration
   - Developer B: Polish (T014–T017) — edge cases + AGENTS.md

---

## Summary

| Phase | Tasks | Count | Story |
|-------|-------|-------|-------|
| 1 — Setup | T001–T002 | 2 | — |
| 2 — Foundational | T003–T005 | 3 | — |
| 3 — US1 (P1) | T006–T009 | 4 | Destination CRUD |
| 4 — US2 (P2) | T010–T011 | 2 | Tour Builder Selector |
| 5 — US3 (P3) | T012–T013 | 2 | Analytics/Manifest Filter |
| 6 — Polish | T014–T017 | 4 | Edge cases + AGENTS.md |
| **Total** | | **17** | |

- **Parallel opportunities**: 4 tasks in Phases 1/2, 1 per user story phase
- **US3 independent**: Can be built in parallel with US1 if analytics/manifest endpoints exist
- **Recommended MVP**: US1 only (T001–T009) = 9 tasks
