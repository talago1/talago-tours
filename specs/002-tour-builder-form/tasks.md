---

description: "Task list for Universal Tour Builder & Multi-Language Form implementation"

---

# Tasks: Universal Tour Builder & Multi-Language Form

**Input**: Design documents from `/specs/002-tour-builder-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No test tasks — manual testing per spec's Independent Test scenarios

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router project at repository root
- `src/` for all source code, `prisma/` for database schema

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types and shared utilities

- [X] T001 [P] Create `src/types/tourBuilder.ts` with interfaces: `LocalizedContent` (title, description, cancellationPolicies for all 6 languages), `GlobalFields` (slug, duration, maxCapacity, basePriceUSD, tourType, zoneId), `TourFormState`, `ValidationError`
- [X] T002 Create validation utilities in `src/utils/tourValidation.ts` — validate slug (URL-safe regex), numeric fields (positive non-zero), English EN content required, slug uniqueness check (async call)
- [X] T003 Add Tour model migration fields to `prisma/schema.prisma` if missing: slug (unique), duration, maxCapacity, basePriceUSD, tourType, zoneId, translations (Json), cancellationPolicies (Json)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `src/components/admin/LanguageTabs.tsx` — tab bar with 6 tabs (EN, DE, RU, FR, IT, TR), active tab visually distinct (bg-coral text-white), tab state passed up via `onLanguageChange` callback
- [X] T005 Create `src/components/admin/GlobalFields.tsx` — shared metadata section: slug (URL-safe validation), duration (hours), max capacity, base price (USD), tour type dropdown (Shared/Private), zone dropdown. All fields above the language tab bar.
- [X] T006 Create `src/components/admin/LocalizedPanel.tsx` — per-language field panel: title input (required for EN), description textarea (required for EN), cancellation policies list (dynamic add/remove rows). Receives activeLanguage prop and current language's data.

**Checkpoint**: All UI components render independently — tabs switch, global fields show, localized panels display correct language data

---

## Phase 3: User Story 1 - Fill Global Tour Metadata (Priority: P1) 🎯 MVP

**Goal**: Admin sets base tour properties in a single shared section visible above language tabs.

**Independent Test**: Fill all global fields — they render once without duplication across language tabs.

### Implementation for User Story 1

- [X] T007 [US1] Create `src/components/admin/TourBuilderForm.tsx` — main orchestrator (`"use client"`): renders GlobalFields at top, LanguageTabs below, LocalizedPanel conditioned by active tab. Manages global state and per-language state in a single `TourFormState`.
- [X] T008 [US1] Test: GlobalFields values persist when switching language tabs — verify no duplication, no reset

**Checkpoint**: Global fields display once above tabs, unchanged by tab switches

---

## Phase 4: User Story 2 - Fill Localized Content Per Language (Priority: P1)

**Goal**: Admin enters tour details per language via tab switch; content preserved across switches.

**Independent Test**: Enter DE content, switch to FR, enter FR, switch back to DE — both preserved.

### Implementation for User Story 2

- [X] T009 [US2] Wire LocalizedPanel into TourBuilderForm — on tab switch, save current tab's edits to state, load new tab's data from state. No data reset on any switch (FR-004).
- [X] T010 [US2] Test: Enter text in all 6 language panels, cycle through all tabs 3 times, verify zero data loss

**Checkpoint**: All 6 language panels hold independent, preserved content

---

## Phase 5: User Story 3 - Set Tour Cancellation Policies (Priority: P2)

**Goal**: Admin defines cancellation policy rows independently per language.

**Independent Test**: Add 2 EN policies, switch to DE, add 3 DE policies — both languages preserve their lists.

### Implementation for User Story 3

- [X] T011 [US3] Add cancellation policy UI to LocalizedPanel — "Add Policy" button appends new text row, each row has a delete button. State per language, independent of other languages' policy lists (FR-005).
- [X] T012 [US3] Test: Verify policies in one language do not leak into another language's data

**Checkpoint**: Cancellation policies are stored and displayed per language, no cross-contamination

---

## Phase 6: User Story 4 - Submit Tour with Frontend Validation (Priority: P2)

**Goal**: Form validates all required fields before submission; invalid data blocked with inline errors.

**Independent Test**: Submit with empty slug, zero price, no EN title — all blocked with inline errors.

### Implementation for User Story 4

- [X] T013 [US4] Integrate tourValidation.ts into TourBuilderForm — validate on submit button click: slug URL-safe (FR-006), slug unique via async check (FR-006b), numeric fields positive (FR-007), EN title and description non-empty (FR-008). Show inline error messages below each invalid field.
- [X] T014 [US4] Create `src/app/api/admin/tours/create/route.ts` — POST handler: parse body, validate server-side, check slug uniqueness in DB, persist Tour with all fields including translations JSON and cancellation policies JSON, return success with tour ID
- [X] T015 [US4] Wire submit in TourBuilderForm: call POST /api/admin/tours/create, on success show confirmation (FR-011), on error show user-friendly message and re-enable button (FR-012)

**Checkpoint**: Form validation blocks invalid data; valid submissions create a tour record

---

## Phase 7: User Story 5 - Prevent Duplicate Submissions (Priority: P3)

**Goal**: Submit button disables immediately on click; no double-submission possible.

**Independent Test**: Rapidly click Submit multiple times — only one submission request sent.

### Implementation for User Story 5

- [X] T016 [US5] Add submit button loading state to TourBuilderForm — on click: `setIsSubmitting(true)`, button shows spinner with `pointer-events-none opacity-50`, re-enables on error (FR-009, FR-010, FR-012)

**Checkpoint**: Double-click produces exactly one tour record

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T017 [P] Add unsaved changes warning — detect dirty state, show browser `beforeunload` prompt on navigate-away
- [X] T018 [P] Add loading skeleton for initial form load state
- [X] T019 Verify zero CLS on tab switches (all panels in-DOM with `hidden` toggle — no layout shift)
- [X] T020 Run quickstart.md validation — manually test all 5 user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — core form orchestrator
- **US2 (Phase 4)**: Depends on US1 (needs TourBuilderForm + tabs)
- **US3 (Phase 5)**: Depends on US2 (needs LocalizedPanel)
- **US4 (Phase 6)**: Depends on US1 (form must exist to validate/submit)
- **US5 (Phase 7)**: Depends on US4 (needs submit button)
- **Polish (Phase 8)**: Depends on all stories

### Parallel Opportunities

- T001, T003: types + schema are independent
- T004, T005, T006: LanguageTabs, GlobalFields, LocalizedPanel are independent
- T017, T018: Polish tasks are independent

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — types + utilities
2. Complete Phase 2: Foundational — LanguageTabs, GlobalFields, LocalizedPanel
3. Complete Phase 3: US1 — TourBuilderForm orchestrator + global fields
4. **STOP and VALIDATE**: Global fields + tab switching works

### Full Delivery

1. Setup → Foundational → US1 → US2 → US3 → US4 → US5 → Polish
