# Tasks: Verified Customer Reviews, Interactive Ratings & Admin Moderation Engine

**Input**: Design documents from `/specs/018-reviews-moderation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [ ] T001 Create directory structure: `app/api/public/reviews/submit/`, `app/api/admin/reviews/moderate/`, `components/public/`, `utils/`
- [ ] T002 Install Prisma Client dependency if not already present

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [ ] T003 Add `ReviewStatus` enum (`PENDING`, `APPROVED`, `REJECTED`) and `Review` model to `prisma/schema.prisma`
- [ ] T004 Add `ratingAverage Float @default(0.0)` and `ratingCount Int @default(0)` fields to `Tour` model in `prisma/schema.prisma`
- [ ] T005 [P] Create shared TypeScript types for Review in `src/types/review.ts` (ReviewStatus enum, Review interface, ReviewSubmissionPayload, ModerationPayload)
- [ ] T006 [P] Create `src/utils/calculateTourRatings.ts` — atomic aggregation engine that fetches all APPROVED reviews for a tourId, computes float mean, and commits to Tour.ratingAverage and Tour.ratingCount

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Customers View Viator-Style Reviews on Public Tour Pages (Priority: P1) 🎯 MVP

**Goal**: Display aggregate rating score (e.g., 4.8/5), star-by-star percentage breakdown bars, and a feed of verified customer review cards with "Verified Booking" badges on public tour pages.

**Independent Test**: Load any public tour detail page with seeded approved reviews. Verify the aggregate score, star progress bars, and customer review cards render with Coral (#FF5B00) stars and Forest (#00473F) "Verified Booking" badges.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create GET endpoint at `src/app/api/public/reviews/[tourId]/route.ts` to fetch approved reviews, aggregate score, and star distribution counts for a given tourId
- [ ] T008 [P] [US1] Create star display sub-component in `src/components/public/ReviewStars.tsx` rendering filled stars in Coral (`text-[#FF5B00]`) for 1–5 rating
- [ ] T009 [P] [US1] Create star breakdown progress bar sub-component in `src/components/public/ReviewBreakdownBars.tsx` rendering percentage bars per rating band (5-star to 1-star) with fixed height (`h-2`) containers for zero CLS
- [ ] T010 [P] [US1] Create "Verified Booking" badge sub-component in `src/components/public/VerifiedBadge.tsx` in Forest (`text-[#00473F]`)
- [ ] T011 [US1] Build `src/components/public/ReviewSection.tsx` — responsive 2-column grid (desktop) / stacked layout (mobile) wrapping aggregate score, star breakdown bars, and scrollable review card feed
- [ ] T012 [US1] Integrate ReviewSection into the tour detail page (Feature 015) with tourId prop and loading/empty state handling

**Checkpoint**: Public tour pages display aggregate ratings, star breakdown, and verified review feed.

---

## Phase 4: User Story 2 — Verified Customers Submit Reviews (Priority: P1) 🎯 MVP

**Goal**: Allow customers with confirmed, unreviewed bookings to submit a 1–5 rating and comment via a secure API endpoint.

**Independent Test**: Send a POST request to `/api/public/reviews/submit` with a valid confirmed bookingId, matching tourId, rating 1–5, and comment 10–1000 chars. Verify 201 response and review persisted as PENDING. Re-submit with same bookingId — verify 403 rejection.

### Implementation for User Story 2

- [ ] T013 [P] [US2] Create booking verification utility in `src/utils/verifyBookingEligibility.ts` — checks bookingId exists, status is CONFIRMED, tourId matches, no existing Review row for that bookingId
- [ ] T014 [US2] Implement POST handler in `src/app/api/public/reviews/submit/route.ts` calling verifyBookingEligibility and persisting the review with PENDING status
- [ ] T015 [US2] Add input validation middleware: rating must be integer 1–5, comment 10–1000 chars, customerName 2–50 chars
- [ ] T016 [US2] Implement error response handlers for 400 (validation), 403 (ineligible booking), 404 (booking not found), and 409 (duplicate submission) status codes

**Checkpoint**: Customers can submit reviews via API; duplicates and invalid bookings are rejected.

---

## Phase 5: User Story 3 — Administrators Moderate Reviews & Trigger Rating Updates (Priority: P2)

**Goal**: Provide an authenticated admin moderation queue where operators can Approve or Reject reviews, triggering automatic recalculation of the tour's aggregate rating.

**Independent Test**: Log in as admin, access moderation panel, approve a PENDING review — verify review status changes to APPROVED and the tour's ratingAverage updates immediately. Reject a review — verify it disappears from the public feed.

### Implementation for User Story 3

- [ ] T017 [P] [US3] Create admin authentication guard middleware in `src/middleware/adminAuth.ts` verifying admin session/token for moderation endpoints
- [ ] T018 [US3] Implement PATCH handler in `src/app/api/admin/reviews/moderate/route.ts` accepting reviewId and status (APPROVED or REJECTED)
- [ ] T019 [US3] Wire transactional moderation logic: update review status → if APPROVED, call calculateTourRatings.ts → return updated aggregate data
- [ ] T020 [US3] Create admin moderation UI at `src/app/admin/reviews/page.tsx` with status filter tabs (PENDING/APPROVED/REJECTED), review table, and Approve/Reject action buttons with optimistic UI updates

**Checkpoint**: Admins can moderate reviews; approved reviews trigger automatic rating recalculation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T021 [P] Add loading skeleton states to ReviewSection for aggregate score, breakdown bars, and review cards
- [ ] T022 [P] Add responsive breakpoints: below 768px stack score column above breakdown bars; below 640px show single-column review cards
- [ ] T023 Run quickstart.md validation tests (E2E moderation flow and submission guards)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 — Public View (Phase 3)**: Depends on Foundational — independent of other stories
- **US2 — Submission (Phase 4)**: Depends on Foundational — independent of other stories
- **US3 — Moderation (Phase 5)**: Depends on Foundational + US2 (needs reviews to moderate) + US1 (updates public data)
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — needs seeded/approved review data to display (can use manual DB seed before US3 exists)
- **US2 (P1)**: Can start after Foundational — fully independent
- **US3 (P2)**: Can start after Foundational + US2 — needs submitted reviews to moderate, re-computes data US1 reads

### Parallel Opportunities

- T005, T006 (Foundational) can run in parallel
- T007, T008, T009, T010 (US1 models/utilities) can run in parallel
- T013 (US2) can run in parallel with US1 tasks
- T017 (US3 auth) can run in parallel with US1/US2 tasks

### Parallel Example: User Story 1

```bash
# Launch all independent US1 components together:
Task: "Create GET endpoint for tour reviews in src/app/api/public/reviews/[tourId]/route.ts"
Task: "Create ReviewStars sub-component in src/components/public/ReviewStars.tsx"
Task: "Create ReviewBreakdownBars sub-component in src/components/public/ReviewBreakdownBars.tsx"
Task: "Create VerifiedBadge sub-component in src/components/public/VerifiedBadge.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Public review display
4. Complete Phase 4: US2 — Review submission
5. **STOP and VALIDATE**: Submit a review via US2 API, verify it appears in public US1 view after approving via DB
6. Deploy/demo if ready — US1 + US2 deliver core customer value

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (public view) + US2 (submission) → MVP: customers submit and see reviews
3. Add US3 (admin moderation) → Complete pipeline: submit → moderate → display

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Rating must be bounded to integers 1–5 at business logic layer (not relying only on DB constraints)
- All star icons use native Tailwind classes only — zero third-party icon libraries