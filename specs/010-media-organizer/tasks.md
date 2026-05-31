---

description: "Task list for Media Organizer feature implementation"
---

# Tasks: Media Organizer (Feature 010)

**Input**: Design documents from `specs/010-media-organizer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests requested in specification — implementation-only tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `prisma/` at repository root
- All paths are project-relative

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — this feature extends an existing Next.js project with Prisma, TypeScript, and TailwindCSS already configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add MediaAsset model with Tour relation in `prisma/schema.prisma`
- [X] T002 Run Prisma migration (`npx prisma db push`) and generate client (`npx prisma generate`)
- [X] T003 Create TypeScript interfaces for MediaAsset, ReorderPayload, and API responses in `src/types/media.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Admin reorders tour media assets via drag-and-drop (Priority: P1) 🎯 MVP

**Goal**: Admin can drag any image card to a new position in the grid; on drop the order updates instantly (optimistic), persisted atomically in the background.

**Independent Test**: Open a tour's media grid with 4+ images. Drag image at index 2 to index 4. Confirm: (1) image appears at index 4 immediately, (2) images 3–4 shift up by one, (3) refresh shows persisted order.

### Implementation for User Story 1

- [X] T004 [P] [US1] Create MediaCard component with thumbnail, drag handle, and Coral drag-state overlay in `src/components/admin/MediaCard.tsx`
- [X] T005 [P] [US1] Create POST /api/admin/media/reorder endpoint with atomic `prisma.$transaction` in `src/app/api/admin/media/reorder/route.ts`
- [X] T006 [US1] Create MediaOrganizer component with responsive grid, native HTML5 drag-and-drop handlers, and optimistic state management in `src/components/admin/MediaOrganizer.tsx`

**Checkpoint**: At this point, US1 should be fully functional — admin can drag images to reorder them, position updates instantly, and persists on refresh.

---

## Phase 4: User Story 2 — Admin deletes an image from tour media (Priority: P2)

**Goal**: Admin hovers over an image card, sees a quick-action overlay with a delete button. Clicking delete removes the image immediately (optimistic), remaining images renumber.

**Independent Test**: Open a tour's media grid. Hover over an image, confirm the delete button appears with red styling. Click delete. Confirm: image disappears, remaining images shift up, refresh shows permanent removal.

### Implementation for User Story 2

- [X] T007 [P] [US2] Create DELETE /api/admin/media/[id] endpoint with atomic delete + renumber transaction in `src/app/api/admin/media/[id]/route.ts`
- [X] T008 [US2] Add delete button with red styling to MediaCard hover overlay — optimistic removal with rollback on failure in `src/components/admin/MediaCard.tsx`
- [X] T009 [US2] Wire delete handler from MediaCard up through MediaOrganizer state management in `src/components/admin/MediaOrganizer.tsx`

**Checkpoint**: At this point, both US1 and US2 work. Admin can reorder and delete images from the grid.

---

## Phase 5: User Story 3 — Admin views images grouped by tour (Priority: P3)

**Goal**: Admin can navigate to a tour-scoped media grid showing only that tour's images in display order. Empty tours show a guidance message.

**Independent Test**: Navigate to media organizer for a tour with 5 images. Confirm only that tour's 5 images appear in correct order. Navigate to a tour with 0 images. Confirm empty state message.

### Implementation for User Story 3

- [X] T010 [P] [US3] Create admin page route at `src/app/admin/tours/[tourId]/media/page.tsx` — fetch MediaAsset records by tourId, pass to MediaOrganizer
- [X] T011 [US3] Add empty state with upload guidance message in `src/components/admin/MediaOrganizer.tsx`

**Checkpoint**: All three user stories are fully functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T012 Show error toast with retry option on network failure during reorder or delete in `src/components/admin/MediaOrganizer.tsx`
- [X] T013 Handle broken-image fallback (placeholder when Supabase URL is unreachable) in `src/components/admin/MediaCard.tsx`
- [X] T014 Update AGENTS.md plan reference to `spec/010-media-organizer/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — no tasks needed
- **Foundational (Phase 2)**: Must complete before all user stories — BLOCKS US1, US2, US3
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2, US3
- **US2 (Phase 4)**: Depends on US1 (MediaOrganizer + MediaCard exist) and Foundational
- **US3 (Phase 5)**: Depends on US1 (MediaOrganizer exists) and Foundational
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — NO dependencies on other stories
- **US2 (P2)**: Starts after US1 (shares MediaCard + MediaOrganizer) but independently testable
- **US3 (P3)**: Starts after US1 (shares MediaOrganizer) but independently testable

### Parallel Opportunities

- T004 (MediaCard) and T005 (reorder API) can run in parallel
- T007 (delete API) can run in parallel with T008/T009 (delete UI)
- T010 (admin page) can run in parallel with T011 (empty state)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Reorder)
3. **STOP and VALIDATE**: Test drag-and-drop reorder independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Delete) → Test independently → Deploy/Demo
4. Add US3 (Tour-scoped view) → Test independently → Deploy/Demo

### Parallel Strategy

With multiple developers:
1. Complete Foundational together
2. Once Foundational is done:
   - Developer A: US1 (MediaOrganizer + MediaCard + reorder API)
   - Developer B: US2 (delete API — waits for MediaCard from A)
   - Developer C: US3 (admin page — waits for MediaOrganizer from A)
