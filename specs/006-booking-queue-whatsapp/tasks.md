---

description: "Task list for Booking Queue & WhatsApp Automation feature"
---

# Tasks: Booking Queue & WhatsApp Automation

**Input**: Design documents from `specs/006-booking-queue-whatsapp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/admin-bookings-api.md, quickstart.md

**Tests**: No test framework in project — all verification is manual per acceptance scenarios in spec.md.

**Organization**: Tasks are grouped by user story (US1, US2, US3) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js project: `src/` at repository root
- All paths are relative to repository root (e.g., `src/app/api/...`)

---

## Phase 1: Setup

**Purpose**: Install missing dependencies

- [X] T001 Install lucide-react package for icons (MessageCircle, icons used in status/action UI)

**Checkpoint**: Dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure (Prisma schema, types) that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add `BookingStatus` enum and `Booking` model to `prisma/schema.prisma` (fields: id, bookingReference, tourId (FK→Tour), zoneId, hotelName, travelDate, guestCount, totalPriceUSD, customerName, customerEmail, customerPhone, language, status, createdAt, updatedAt)
- [X] T003 Create TypeScript types in `src/types/booking.ts`: `BookingStatus` union type and `ActiveQueueTicket` interface with all display fields

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — View and Manage Booking Queue (Priority: P1) 🎯 MVP

**Goal**: Admin can open `/admin/bookings` and see all bookings in a responsive view — spreadsheet on desktop, action cards on mobile.

**Independent Test**: Load `/admin/bookings` with seed data → confirm all fields display correctly with color-coded status badges.

### Implementation for User Story 1

- [X] T004 [P] [US1] Create GET `/api/admin/bookings` endpoint in `src/app/api/admin/bookings/route.ts` (Prisma findMany with tour include, map to ActiveQueueTicket[], return JSON)
- [X] T005 [P] [US1] Create `StatusBadge` component in `src/components/admin/StatusBadge.tsx` (props: `{ status: BookingStatus }`, renders color-coded span: PENDING=amber, CONFIRMED=emerald, COMPLETED=blue, CANCELLED=gray)
- [X] T006 [US1] Create `BookingQueue` client component in `src/components/admin/BookingQueue.tsx` (props: `{ initialBookings: ActiveQueueTicket[] }`, responsive table at `lg:` breakpoint, stacked cards below, renders StatusBadge per row)
- [X] T007 [US1] Create admin bookings server page at `src/app/admin/bookings/page.tsx` (async server component, Prisma query with tour join, map to ActiveQueueTicket, render BookingQueue)
- [X] T008 [US1] Add skeleton loading rows to `BookingQueue` (muted gray bar placeholders matching table/card dimensions, shown while `initialBookings` is empty on first render)
- [X] T009 [US1] Add empty state to `BookingQueue` (centered "No bookings yet" message shown when `bookings.length === 0`)

**Checkpoint**: Booking queue renders with data, badges, skeleton, empty state — independently testable

---

## Phase 4: User Story 2 — Update Booking Status (Priority: P1)

**Goal**: Admin can change a booking's status via dropdown with optimistic update and revert on failure.

**Independent Test**: Change PENDING → CONFIRMED → badge updates instantly → refresh page → change persists. Disconnect network → change reverts.

### Implementation for User Story 2

- [X] T010 [P] [US2] Create PATCH `/api/admin/bookings/[id]/status` endpoint in `src/app/api/admin/bookings/[id]/status/route.ts` (validate status enum, validate legal transition per lifecycle rules, Prisma update, return updated booking or error)
- [X] T011 [US2] Create `BookingRowActions` client component in `src/components/admin/BookingRowActions.tsx` (props: `{ ticket: ActiveQueueTicket, onStatusChange: (id, status) => void }`, status `<select>` filtered to valid transitions for current status)
- [X] T012 [US2] Implement optimistic state update with revert logic in `BookingRowActions` (on select: optimistically update parent state, fire PATCH fetch, on `.catch()` revert to previous status)
- [X] T013 [US2] Integrate `BookingRowActions` into `BookingQueue` (replace hardcoded status cell with `BookingRowActions` — each row/card gets a status dropdown)

**Checkpoint**: Status changes work optimistically with revert on error — independently testable

---

## Phase 5: User Story 3 — Send WhatsApp Message to Customer (Priority: P2)

**Goal**: Admin clicks WhatsApp button on a booking row; a pre-formatted localized message opens in WhatsApp.

**Independent Test**: Click WhatsApp button on a booking with valid phone → confirm `api.whatsapp.com` opens with customer's number and localized message. Button disabled for booking with empty phone.

### Implementation for User Story 3

- [X] T014 [P] [US3] Create WhatsApp link builder in `src/utils/whatsappLinkBuilder.ts` (6-language template map EN/DE/RU/FR/IT/TR, `buildWhatsAppMessage(ticket)` interpolates template, `buildWhatsAppUrl(phone, message)` returns `https://api.whatsapp.com/send?phone=...&text=...`)
- [X] T015 [US3] Create `WhatsAppButton` client component in `src/components/admin/WhatsAppButton.tsx` (props: `{ ticket: ActiveQueueTicket }`, green `bg-[#25D366]` button with Lucide `MessageCircle` icon, disabled when phone empty/null, onClick calls `window.open(buildWhatsAppUrl(...), '_blank')`)
- [X] T016 [US3] Integrate `WhatsAppButton` into `BookingRowActions` (render WhatsAppButton alongside status dropdown in the actions cell)

**Checkpoint**: WhatsApp deep-link opens with localized message — independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, data seeding, and verification

- [X] T017 Run `npx prisma db push` to apply Booking model to database, then `npx prisma generate` to regenerate Prisma client
- [X] T018 Seed test data (3–5 bookings across different statuses, one with empty phone, one cancelled) via `prisma/seed.ts` or Prisma Studio
- [X] T019 Verify end-to-end flow per quickstart.md: load queue, update status, send WhatsApp, test responsiveness, test empty state, test disabled WhatsApp

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T002, T003)
- **User Story 2 (Phase 4)**: Depends on Foundational (T002, T003). Independent of US1 (can start after Foundational)
- **User Story 3 (Phase 5)**: Depends on Foundational (T002, T003). Independent of US1/US2 (can start after Foundational)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational — No dependencies on other stories (needs US1's BookingQueue for integration at T013, but the PATCH endpoint and the standalone BookingRowActions can be built without it)
- **US3 (P2)**: Can start after Foundational — No dependencies on other stories (WhatsAppButton needs BookingRowActions at T016 for integration, but the link builder and standalone button can be built without it)

### Within Each User Story

- Models before APIs
- APIs before components
- Components before page
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (schema file vs types file — no conflict)
- All [P] tasks within a phase can run in parallel
- T004 and T005 can run in parallel (different files: API route vs UI component)
- T010 is independent of US1 start
- T015 is independent of US1/US2 start
- Different user stories can be worked on by different team members after Foundational

---

## Parallel Example: User Story 1

```bash
# Launch independent tasks together:
Task: "Create GET endpoint in src/app/api/admin/bookings/route.ts" [T004]
Task: "Create StatusBadge component in src/components/admin/StatusBadge.tsx" [T005]

# Then when both complete:
Task: "Create BookingQueue component with responsive layout" [T006]
Task: "Create bookings server page" [T007]
Task: "Add skeleton loading state" [T008]
Task: "Add empty state" [T009]
```

## Parallel Example: All Stories After Foundational

```bash
# Developer A — US1
Task: "GET endpoint + StatusBadge + BookingQueue + page + skeleton + empty state" [T004–T009]

# Developer B — US2  
Task: "PATCH endpoint + BookingRowActions + optimistic logic" [T010–T012]
# (T013 integration with BookingQueue done after US1 is ready)

# Developer C — US3
Task: "WhatsApp link builder + WhatsAppButton" [T014–T015]
# (T016 integration with BookingRowActions done after US2 is ready)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup → Install lucide-react
2. Complete Phase 2: Foundational → Prisma schema + types
3. Complete Phase 3: User Story 1 → Queue view works
4. **STOP and VALIDATE**: Load /admin/bookings → confirm all bookings display with badges
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (queue view)
   - Developer B: User Story 2 (status patch)
   - Developer C: User Story 3 (WhatsApp)
3. Developer B integrates actions into A's queue (T013) after US1 is ready
4. Developer C integrates WhatsApp button into B's actions (T016) after US2 is ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
