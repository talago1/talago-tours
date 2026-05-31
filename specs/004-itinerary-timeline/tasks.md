---

description: "Task list for Dynamic Milestone Timeline Itinerary Builder & Display implementation"

---

# Tasks: Dynamic Milestone Timeline Itinerary Builder & Display

**Input**: Design documents from `/specs/004-itinerary-timeline/`

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

**Purpose**: Types, icon mapper, and validation utilities

- [ ] T001 [P] Create `src/types/itinerary.ts` with interfaces: `ItineraryMilestone` (id, timeTag, iconToken, title: LocalizedMilestoneTitle), `LocalizedMilestoneTitle` (en, de, ru, fr, it, tr), `IconToken` union type (`'boat' | 'safari' | 'swim' | 'food' | 'hotel' | 'generic'`), and `ICON_MAP` constant mapping tokens to `lucide-react` icon components
- [ ] T002 [P] Create `src/utils/itineraryValidator.ts` — validate functions: `validateMilestone(milestone)` checks timeTag non-empty, iconToken valid, title.en non-empty; `validateItinerary(milestones)` checks all milestones pass, IDs are unique
- [ ] T003 Add itinerary field to `prisma/schema.prisma` Tour model: `itinerary` (Json, nullable) — stores the ordered array of ItineraryMilestone objects
- [ ] T004 Install `lucide-react` via npm if not already installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and model setup

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Finalize ICON_MAP in `src/types/itinerary.ts` — import `Ship, Compass, Waves, Utensils, Building, MapPin` from lucide-react, map to boat, safari, swim, food, hotel, generic tokens per research.md

**Checkpoint**: Types, validation, and icon mapping ready

---

## Phase 3: User Story 1 - Build Itinerary Milestones (Priority: P1) 🎯 MVP

**Goal**: Admin can add, reorder, and delete itinerary milestones.

**Independent Test**: Add 3 milestones with time tags and icons, reorder via move buttons, delete one — remaining milestones in correct order.

### Implementation for User Story 1

- [ ] T006 [US1] Create `src/components/admin/ItineraryBuilder.tsx` — client component (`"use client"`) with milestone array state:
  - "Add New Milestone" button appends a new milestone with default values, UUID `id`, `generic` icon
  - Each milestone row displays: time tag text input, icon token dropdown (renders lucide icon + label), move up/down buttons (disabled at array boundaries or single item), delete button
  - Delete button splices milestone from array; remaining milestones close gap
  - Array index defines sort order (no separate sort field)

**Checkpoint**: Milestones can be added, reordered, and deleted in the admin builder

---

## Phase 4: User Story 2 - View Tour Itinerary Timeline (Priority: P1)

**Goal**: Customer sees chronological vertical timeline with icons, time tags, and titles.

**Independent Test**: View a tour page with 3 configured milestones — they appear as a vertical timeline.

### Implementation for User Story 2

- [ ] T007 [US2] Create `src/components/tours/TourTimeline.tsx` — client component that renders a vertical timeline:
  - Fixed-width left border track `border-l-2 border-gray-200` (zero CLS — predetermined dimensions)
  - Each node: icon bubble in `secondary-forest` (#00473F) bg with white lucide icon, time tag text, milestone title text
  - Hover: `hover:scale-105` transform (no layout shift — CSS transform operates in compositor layer)
  - Each node uses semantic HTML: `<article>` for milestone, time tag in `<time>` element
- [ ] T008 [US2] Integrate TourTimeline into tour page — receives itinerary array as prop, renders milestones in order. If empty/null, shows "No itinerary details available" message.

**Checkpoint**: Public timeline renders milestones with icons, time tags, titles; zero CLS

---

## Phase 5: User Story 3 - Enter Multi-Language Milestone Titles (Priority: P2)

**Goal**: Admin provides milestone titles in all 6 languages via language tab integration.

**Independent Test**: Switch to DE tab, enter German title, switch to FR, enter French, switch back — both preserved.

### Implementation for User Story 3

- [ ] T009 [US3] Wire ItineraryBuilder into language tab system — accept `activeLanguage` prop, display title input for that language's key (e.g., `milestone.title[currentLang]`). Store all 6 language fields in milestone object; only active language's value is editable in the input field.
- [ ] T010 [US3] Add language fallback in TourTimeline — display title in viewer's language if available, fall back to English (`title.en`) if no translation exists (FR-011)

**Checkpoint**: Milestone titles editable per language; timeline shows viewer's language with EN fallback

---

## Phase 6: User Story 4 - Save Itinerary with Tour (Priority: P2)

**Goal**: Milestones persist with the tour; validation blocks incomplete milestones.

**Independent Test**: Add 2 milestones, save tour, reload — both milestones appear in timeline.

### Implementation for User Story 4

- [ ] T011 [US4] Integrate ItineraryBuilder into tour save flow — on save, run `itineraryValidator.ts` to validate all milestones (FR-013: non-empty timeTag, non-empty EN title). Show inline errors on invalid milestones.
- [ ] T012 [US4] Wire save button in ItineraryBuilder — on save click: call tour create/update API with itinerary array in payload. Button shows loading spinner (Coral #FF5B00), disables with `pointer-events-none opacity-50`, re-enables on error (FR-014, FR-015).
- [ ] T013 [US4] Verify itinerary persisted in Tour.itinerary JSON — on tour page load, fetch itinerary array and pass to TourTimeline

**Checkpoint**: Milestones save with tour, validate required fields, persist to DB

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T014 [P] Add empty state: when no milestones exist, builder shows only "Add New Milestone" button; timeline shows "No itinerary details available"
- [ ] T015 [P] Handle long titles in milestone rows — text wraps without breaking layout (max-width on title container)
- [ ] T016 Verify zero CLS on timeline render — fixed border width, predetermined bubble dimensions (`w-10 h-10`), no layout shift from hover
- [ ] T017 Run quickstart.md validation — manually test all 4 user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — admin milestone builder
- **US2 (Phase 4)**: Depends on Foundational — public timeline display
- **US3 (Phase 5)**: Depends on US1 (needs builder for language input)
- **US4 (Phase 6)**: Depends on US1 + US2 (needs builder + timeline)
- **Polish (Phase 7)**: Depends on all stories

### Parallel Opportunities

- T001, T003, T004: types + schema + install are independent
- T006, T007: builder and timeline are independent components
- Phase 7 polish tasks: all independent

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup — types + schema
2. Complete Phase 2: Foundational — icon mapper
3. Complete Phase 3: US1 — ItineraryBuilder (add/reorder/delete)
4. Complete Phase 4: US2 — TourTimeline (public display)
5. **STOP and VALIDATE**: Builder + timeline works for English-only

### Full Delivery

1. Setup → Foundational → US1 → US2 → US3 → US4 → Polish
