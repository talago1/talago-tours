---

description: "Task list for Operations Calendar & Daily Tour Manifest feature implementation"
---

# Tasks: Operations Calendar & Daily Tour Manifest (Feature 011)

**Input**: Design documents from `specs/011-operations-calendar-manifest/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/manifest-api.md

**Tests**: No tests requested in specification — implementation-only tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `prisma/`, `utils/` at repository root
- All paths are project-relative

---

## Phase 1: Setup (Shared Infrastructure)

No setup tasks needed — this feature extends an existing Next.js project with Prisma, TypeScript, and TailwindCSS already configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add optional `roomNumber` field to Booking model in `prisma/schema.prisma`
- [X] T002 Run Prisma migration (`npx prisma db push`) and generate client (`npx prisma generate`)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Operator views daily manifest grouped by tour type (Priority: P1) 🎯 MVP

**Goal**: Operator selects a date and sees all confirmed bookings grouped by tour type with per-row details: passenger name, hotel, room number, pax, payment status, channel, check-in status.

**Independent Test**: Call `GET /api/admin/operations/manifest?date=2026-06-15` directly — verify grouped JSON response with correct structure. Then open the admin page, select a date with bookings, verify the grid renders grouped sections.

### Implementation for User Story 1

- [X] T003 [P] [US1] Create manifestQueryBuilder with date-indexed Prisma query, eager-loaded tour relation, and server-side sorting in `src/utils/manifestQueryBuilder.ts`
- [X] T004 [P] [US1] Create GET /api/admin/operations/manifest endpoint with admin auth, date query param validation, and server-side grouping by tourId in `src/app/api/admin/operations/manifest/route.ts`
- [X] T005 [US1] Create DailyManifestSheet component with grouped tour sections, skeleton loading placeholders, and per-row columns in `src/components/admin/DailyManifestSheet.tsx`

**Checkpoint**: At this point, US1 should be fully functional — operator can see a grouped manifest for any date.

---

## Phase 4: User Story 2 — Operator filters and searches the manifest (Priority: P2)

**Goal**: Operator types a passenger or hotel name into a search field and the manifest filters instantly. Operator can toggle the manifest to show only a specific tour type.

**Independent Test**: Load a manifest with 20+ bookings. Type part of a passenger name — only matching rows remain. Select a single tour type filter — only that tour type's section appears.

### Implementation for User Story 2

- [X] T006 [US2] Add client-side search input that filters manifest rows by passenger name and hotel name in real-time in `src/components/admin/DailyManifestSheet.tsx`
- [X] T007 [US2] Add tour type filter toggle that shows/hides manifest groups by selected tour type in `src/components/admin/DailyManifestSheet.tsx`

**Checkpoint**: At this point, both US1 and US2 work. Operator can view and filter the manifest.

---

## Phase 5: User Story 3 — Operator uses calendar to navigate between dates (Priority: P3)

**Goal**: Operator sees an interactive date strip with Coral badges on departure days, switches between weekly/monthly views, clicks a date to load its manifest.

**Independent Test**: Open calendar in monthly view — departure days show Coral badges. Switch to weekly view — layout updates. Click a date — manifest loads for that date.

### Implementation for User Story 3

- [X] T008 [P] [US3] Create OperationsCalendarHeader with responsive date strip, weekly/monthly view toggle, Coral departure badges, and URL search param sync in `src/components/admin/OperationsCalendarHeader.tsx`
- [X] T009 [US3] Wire calendar date selection from OperationsCalendarHeader to trigger manifest data fetch in DailyManifestSheet

**Checkpoint**: All three user stories are fully functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T010 Create admin operations page composing OperationsCalendarHeader and DailyManifestSheet with data fetching in `src/app/admin/operations/page.tsx`
- [X] T011 Add error state with retry button on API failure in `src/components/admin/DailyManifestSheet.tsx`
- [X] T012 Embed Tailwind `print:` modifiers for A4-optimized hardcopy output in `src/components/admin/DailyManifestSheet.tsx`
- [X] T013 Update AGENTS.md plan reference to `spec/011-operations-calendar-manifest/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — no tasks needed
- **Foundational (Phase 2)**: Must complete before all user stories — BLOCKS US1, US2, US3
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2, US3
- **US2 (Phase 4)**: Depends on US1 (DailyManifestSheet exists) and Foundational
- **US3 (Phase 5)**: Depends on US1 (DailyManifestSheet exists) and Foundational
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — NO dependencies on other stories
- **US2 (P2)**: Starts after US1 (shares DailyManifestSheet) — independently testable via filtering
- **US3 (P3)**: Starts after US1 (shares DailyManifestSheet) — independently testable via calendar clicks

### Parallel Opportunities

- T003 (manifestQueryBuilder) and T004 (API endpoint) can run in parallel
- T006 (search input) and T007 (tour type filter) can run in parallel (both in same file)
- T008 (calendar header) can run in parallel with T006/T007

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (View Manifest)
3. **STOP and VALIDATE**: Test manifest API + grid rendering independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Filter/Search) → Test independently → Deploy/Demo
4. Add US3 (Calendar Navigation) → Test independently → Deploy/Demo

### Parallel Strategy

With multiple developers:
1. Complete Foundational together
2. Once Foundational is done:
   - Developer A: US1 (query builder + API + manifest sheet)
   - Developer B: US2 (search + filter — waits for DailyManifestSheet)
   - Developer C: US3 (calendar header — waits for DailyManifestSheet)
