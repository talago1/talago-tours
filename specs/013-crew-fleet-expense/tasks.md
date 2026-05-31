# Tasks: Crew Assignment, Fleet Dispatch & Trip Expense Tracker (Feature 013)

**Input**: Design documents from `/specs/013-crew-fleet-expense/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `prisma/` at repository root
- Paths shown follow the plan.md and quickstart.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory scaffolding and configuration files

- [ ] T001 Create `src/config/exchangeRates.ts` with static USD_TO_EGP rate (48.50) and fallback warning

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema extension with all new models and enums — MUST be complete before any user story can proceed

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Append `enum CrewRole { CAPTAIN GUIDE DRIVER }` and `enum FleetType { BOAT SPEEDBOAT VEHICLE QUAD }` to `prisma/schema.prisma`
- [ ] T003 [P] Append `enum ExpenseCategory { FUEL CREW_PAYROLL CATERING PERMITS MISC }` and `enum ExpenseCurrency { USD EGP }` to `prisma/schema.prisma`
- [ ] T004 [P] Add `model CrewMember` with fields (id, name, role, phone?, isActive, createdAt, updatedAt) to `prisma/schema.prisma`
- [ ] T005 [P] Add `model FleetAsset` with fields (id, name, type, capacity?, isActive, createdAt, updatedAt) to `prisma/schema.prisma`
- [ ] T006 Add `model CrewAssignment` with fields (id, crewMemberId, tourId, departureDate, createdAt) and indices `@@index([departureDate, tourId])` and `@@index([crewMemberId, departureDate])` to `prisma/schema.prisma`
- [ ] T007 Add `model FleetAssignment` with fields (id, fleetAssetId, tourId, departureDate, createdAt) and indices `@@index([departureDate, tourId])` and `@@index([fleetAssetId, departureDate])` to `prisma/schema.prisma`
- [ ] T008 Add `model TripExpense` with fields (id, departureDateGroup, tourId, category, amount Decimal, currency, notes?, createdAt) and index `@@index([departureDateGroup, tourId])` to `prisma/schema.prisma`
- [ ] T009 Run `npx prisma migrate dev --name add-crew-fleet-expense` to generate and apply the database migration
- [ ] T010 Create seed script or Prisma admin entries for at least 6 CrewMember records (2 captains, 2 guides, 2 drivers) and 4 FleetAsset records (1 boat, 1 speedboat, 1 vehicle, 1 quad) for development/testing

**Checkpoint**: Foundation ready — all Prisma models migrated, config exists, seed data available. User story implementation can now begin.

---

## Phase 3: User Story 1 — Operator assigns crew and fleet to a tour departure (Priority: P1) 🎯 MVP

**Goal**: An operations manager opens the trip dispatcher for a specific tour departure date, uses searchable dropdowns to assign crew members and fleet assets, saves atomically, and the assignments persist on reload.

**Independent Test**: Open the trip dispatcher for a tour date, select a crew member and a fleet asset from dropdowns, save, reload the page, and confirm the assignments are pre-populated.

### Implementation for User Story 1

- [ ] T011 [US1] Create TypeScript type/interface file at `src/types/dispatch.ts` with all interfaces from data-model.md (TripDispatchPayload, ExpenseRowInput, TripDispatchResponse, SchedulingConflict, DispatchPreloadData, and type aliases)
- [ ] T012 [US1] Create POST endpoint at `src/app/api/admin/operations/dispatch/route.ts` with admin auth guard, payload validation (positive amounts, YYYY-MM-DD format), scheduling conflict detection query, and atomic `prisma.$transaction` delete-then-create save
- [ ] T013 [P] [US1] Create GET endpoint at `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts` with admin auth guard, query existing assignments + active crew/fleet pool, return DispatchPreloadResponse with server-computed total
- [ ] T014 [US1] Create TripDispatcher client component at `src/components/admin/TripDispatcher.tsx` with `"use client"` directive, `useEffect` to fetch GET preload data, searchable dropdown grids for crew (role-filtered: captain/guide/driver) and fleet (type-filtered: boat/speedboat/vehicle/quad), pre-population of assigned items on mount, save button with disabled loading state, success/error feedback, and skeleton loading state for zero CLS
- [ ] T015 [US1] Create admin dispatch page at `src/app/admin/operations/dispatch/page.tsx` as a server component reading `?tourId=xxx&date=YYYY-MM-DD` from URL search params, rendering TripDispatcher with params (or showing a tour/date selector if params missing)

**Checkpoint**: User Story 1 complete — operator can assign crew and fleet to a tour departure, save, and verify persistence on reload.

---

## Phase 4: User Story 2 — Operator logs trip expenses (Priority: P2)

**Goal**: An operator adds expense entries for a specific trip using a dynamic table with category, amount, currency, and notes. The total cost updates in real-time as rows change. Mixed currencies convert via exchange rates.

**Independent Test**: Add 3 expense rows with different categories and currencies (USD + EGP), verify the live total updates correctly with EGP→USD conversion, save, reload, and confirm all rows persist.

### Implementation for User Story 2

- [ ] T016 [P] [US2] Add expense ledger section to TripDispatcher at `src/components/admin/TripDispatcher.tsx` with dynamic table — add row button (appends blank row with category dropdown, amount input, currency toggle, notes input), edit-in-place for all fields, remove row button per row, and inline validation (amount > 0, category required)
- [ ] T017 [US2] Add live total cost computation to TripDispatcher at `src/components/admin/TripDispatcher.tsx` using `useMemo` — iterate expense rows, convert EGP to USD via `config/exchangeRates.ts`, sum to total, display in `text-[#FF5B00]` summary card that updates under 100ms per edit
- [ ] T018 [US2] Extend the POST dispatch save in `src/app/api/admin/operations/dispatch/route.ts` to validate and persist expense rows alongside crew/fleet assignments (expenses array is already in the contract — ensure server-side validation of positive amounts, valid categories, valid currencies, and proper Decimal storage)
- [ ] T019 [US2] Extend the GET preload endpoint at `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts` to include expense records and server-computed total in the response (contract already defines expenses array — ensure TripExpense records are queried and returned)
- [ ] T020 [US2] Wire expense pre-population in TripDispatcher at `src/components/admin/TripDispatcher.tsx` — on mount, populate expense table rows from GET response `expenses[]` array, display server-computed total after save

**Checkpoint**: User Story 2 complete — operator can log expenses with multi-currency support, live total updates, save, and verify persistence on reload.

---

## Phase 5: User Story 3 — Saved costs feed into analytics net margin (Priority: P3)

**Goal**: A manager views the analytics dashboard and sees net operating margins that reflect trip expenses logged via the dispatcher. Fuel costs, crew payroll, and other line items are subtracted from tour revenue automatically.

**Independent Test**: Log expenses for a tour via the dispatcher, then check the analytics dashboard summary endpoint to confirm those costs appear in `totalExpensesUSD` and net margin reflects the subtraction.

### Implementation for User Story 3

- [ ] T021 [US3] Extend the analytics summary endpoint at `src/app/api/admin/analytics/summary/route.ts` — add TripExpense aggregation using `groupBy` on `departureDateGroup` within the query date range, convert EGP amounts to USD via exchange rate config, compute `totalExpensesUSD`, and subtract from net margin
- [ ] T022 [US3] Add `totalExpensesUSD` field to the analytics response contract — ensure `ExecutiveDashboardStats` type includes the new field and the route returns it alongside existing fields

**Checkpoint**: User Story 3 complete — analytics dashboard reflects trip expenses in net margin calculations.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 Handle edge case: negative amount validation in TripDispatcher at `src/components/admin/TripDispatcher.tsx` — disable save button and show inline error if any expense row has amount <= 0
- [ ] T024 Handle edge case: exchange rate config missing or zero — TripDispatcher at `src/components/admin/TripDispatcher.tsx` falls back to hardcoded 48.50 and logs warning to console
- [ ] T025 Handle edge case: scheduling conflict UI in TripDispatcher at `src/components/admin/TripDispatcher.tsx` — if POST returns 409 with warnings, display conflict list with "Override & Save" button that re-submits with `force: true`
- [ ] T026 Handle edge case: network error during save — TripDispatcher at `src/components/admin/TripDispatcher.tsx` shows inline error alert with "Retry" button, no partial data state
- [ ] T027 Update `AGENTS.md` to point plan reference to `specs/013-crew-fleet-expense/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — creates dispatch API, TripDispatcher, admin page
- **US2 (Phase 4)**: Depends on Foundational + US1 — extends TripDispatcher with expense ledger, reuses dispatch API
- **US3 (Phase 5)**: Depends on Foundational — extends analytics summary endpoint only
- **Polish (Phase 6)**: Depends on US1, US2, US3

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependencies on other stories
- **US2 (P2)**: Starts after Foundational + US1 — depends on TripDispatcher component and dispatch API from US1
- **US3 (P3)**: Starts after Foundational — depends only on Feature 009's analytics route existing (external dependency), no dependency on US1/US2

### Within Each Story

- Types before API endpoints
- API endpoints before component integration
- Core implementation before edge case handling

### Parallel Opportunities

- **Phase 2**: T002, T003, T004, T005 are marked [P] — all are independent Prisma enum/model additions (different model blocks)
- **Phase 3**: T013 is marked [P] — GET endpoint is independent of POST endpoint, can be built in parallel
- **Phase 4**: T016 is marked [P] — expense table UI can be built in parallel with pre-population wiring (T020)
- **Phase 5**: Single task — no parallelism
- **US3 can start in parallel with US1/US2** if Feature 009's analytics route already exists

---

## Parallel Example: Foundational Phase

```bash
# Launch all Prisma enum/models in parallel (different model blocks):
Task: "Append CrewRole + FleetType enums to prisma/schema.prisma"
Task: "Append ExpenseCategory + ExpenseCurrency enums to prisma/schema.prisma"
Task: "Add CrewMember model to prisma/schema.prisma"
Task: "Add FleetAsset model to prisma/schema.prisma"
```

## Parallel Example: User Story 1

```bash
# Launch GET and POST dispatch endpoints in parallel:
Task: "Create POST dispatch endpoint in src/app/api/admin/operations/dispatch/route.ts"
Task: "Create GET dispatch endpoint in src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — exchange rate config
2. Complete Phase 2: Foundational — Prisma schema + migration + seed data
3. Complete Phase 3: User Story 1 — TripDispatcher with crew/fleet assignment + save/reload
4. **STOP and VALIDATE**: Test US1 independently — assign crew/fleet, save, reload, verify
5. Deploy/demo if ready — core logistics function works

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001–T010)
2. Add User Story 1 → US1 complete → Deploy (MVP — crew/fleet assignment works!)
3. Add User Story 2 → US2 complete → Deploy (expense logging with live total!)
4. Add User Story 3 → US3 complete → Deploy (full financial integration!)
5. Add Polish → Edge cases handled → Final

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001–T010)
2. Once Foundational is done:
   - Developer A: User Story 1 (T011–T015) — dispatch API + TripDispatcher
   - Developer B: User Story 3 (T021–T022) — analytics bridge (no dependency on US1)
3. After US1 is complete:
   - Developer A: User Story 2 (T016–T020) — expense ledger on TripDispatcher
   - Developer B: Polish (T023–T027) — edge cases + AGENTS.md

---

## Summary

| Phase | Tasks | Count | Story |
|-------|-------|-------|-------|
| 1 — Setup | T001 | 1 | — |
| 2 — Foundational | T002–T010 | 9 | — |
| 3 — US1 (P1) | T011–T015 | 5 | Crew/Fleet Assignment |
| 4 — US2 (P2) | T016–T020 | 5 | Expense Logging |
| 5 — US3 (P3) | T021–T022 | 2 | Analytics Bridge |
| 6 — Polish | T023–T027 | 5 | Edge cases + AGENTS.md |
| **Total** | | **27** | |

- **Parallel opportunities**: 4 tasks in Phase 2, 1 task in Phase 3, 1 task in Phase 4
- **US3 independent**: Can be built in parallel with US1/US2 if analytics route exists
- **Recommended MVP**: US1 only (T001–T015) = 15 tasks
