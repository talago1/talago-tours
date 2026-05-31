---

description: "Implementation tasks for Viator-Style Public Tour Catalog & Search"
---

# Tasks: Viator-Style Public Tour Catalog, Interactive Search & Filtering Engine

**Input**: Design documents from `specs/015-public-tour-catalog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/public-tours-get-api.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths

## Path Conventions

- **Single project**: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes for the catalog feature

- [ ] T001 Extend Tour model in `prisma/schema.prisma` with catalog fields: `status String @default("INACTIVE")`, `category String?`, `basePrice Decimal?`, `duration String?`, `rating Float @default(0)`, `thumbnailUrl String?` and index `@@index([status])`
- [ ] T002 Run `npx prisma migrate dev --name add-catalog-fields` to apply schema changes

**Checkpoint**: Database schema ready with catalog fields on Tour model

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and data access utilities needed by all user stories

- [ ] T003 [P] Create TypeScript interfaces (`PublicTour`, `PublicTourApiResponse`, `TourFilterState`) and `TOUR_CATEGORIES` constant array with `TourCategory` type in `src/types/publicTour.ts`
- [ ] T004 [P] Create `fetchActiveTours()` Prisma query function in `src/utils/publicTourQueries.ts` with selective projection (id, title, slug, basePrice, duration, rating, thumbnailUrl, category) eager-loading destination (name, slug) and filtering only ACTIVE tours

**Checkpoint**: Foundation ready — types, constants, and query utility available

---

## Phase 3: User Story 1 — Visitor Browses the Tour Catalog (Priority: P1) 🎯 MVP

**Goal**: A responsive grid of tour cards displayed on `/tours` showing active tours with destination badges, 4:3 images, titles, ratings, prices, and Coral CTAs. Layout adapts from 1 column (mobile) to 4 columns (desktop). Handles empty/loading/error states.

**Independent Test**: Visit `/tours` → grid renders with cards showing destination badges, images, titles, ratings, prices, and CTA buttons → responsive layout across mobile/tablet/desktop (1→2→3→4 columns) → zero CLS on image load → empty state when no active tours exist → error state with retry when API fails

- [ ] T005 [P] [US1] Create `TourCard` component in `src/components/public/TourCard.tsx` with `aspect-[4/3]` image container, `<Image fill objectFit="cover">`, destination badge (`#00473F`), title, star rating (5 stars with filled/half/empty based on float `rating`), duration, formatted price (or "Contact us" if null), and Coral CTA button (`bg-[#FF5B00] hover:bg-[#e05000]`). Link CTA to `/tours/[slug]`. Handle image load error with placeholder fallback. Props: `tour: PublicTour`, `priority?: boolean` for first-row LCP optimization.
- [ ] T006 [P] [US1] Create `TourGrid` component in `src/components/public/TourGrid.tsx`. Fetch tours from `GET /api/public/tours` on mount. Render responsive `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`. States: loading (8 animated pulse skeleton cards), empty ("No tours available" message), error (error message with retry button).
- [ ] T007 [US1] Create public catalog search API in `src/app/api/public/tours/route.ts`. GET handler parsing optional query params: `destination` (slug), `type` (category), `minPrice`, `maxPrice`, `search` (keyword). Build dynamic `Prisma.TourWhereInput` with `status: 'ACTIVE'` base filter and AND logic across all params. Use selective `select` projection matching the `PublicTour` interface. Return `NextResponse.json({ tours, total })` wrapped in try-catch.
- [ ] T008 [US1] Create public catalog page in `src/app/tours/page.tsx` as a React Server Component. Render `TourGrid` component. Add page metadata: title "Tours — TALAGO", description for SEO.

**Checkpoint**: At this point, User Story 1 is complete — visitors can browse the catalog, see tour cards, and experience responsive layout with proper loading/empty/error states.

---

## Phase 4: User Story 2 — Visitor Searches and Filters Tours (Priority: P2)

**Goal**: A sticky search/filter interface that lets visitors narrow tours by destination, category, price range, and keyword. All filters use AND logic and update results client-side within 100ms. Keyword input is debounced at 300ms. Filter state is mirrored to URL search params for shareable URLs.

**Independent Test**: Visit `/tours` → type keyword in search → grid filters after 300ms debounce → select destination → grid narrows → toggle category checkbox → grid narrows further → adjust price range slider → grid updates → combine all filters → AND logic applied → clear all filters → all tours return → no matches → "No tours match" message with suggestion

- [ ] T009 [P] [US2] Create `useDebounce` hook in `src/hooks/useDebounce.ts` accepting `value: T` and `delay: number` (default 300), returning debounced value via `useState` + `useEffect` with `setTimeout`/`clearTimeout` pattern
- [ ] T010 [US2] Create `FilterSidebar` component in `src/components/public/FilterSidebar.tsx` (`"use client"`). Implement: destination dropdown (receive `destinations` as prop), multi-select category checkboxes from `TOUR_CATEGORIES`, dual native price range inputs with dynamic min/max from data, keyword search input with `useDebounce` (300ms). All filter changes write to URL search params via `useRouter.replace`. States: loading skeleton for destinations, error message.
- [ ] T011 [US2] Add URL state synchronization and client-side filtering logic to `TourGrid` in `src/components/public/TourGrid.tsx`. Read `useSearchParams()` for current filter values. Apply client-side AND filter: destination (`tour.destination.slug` match), category (`tour.category` match), price (`basePrice` within range), search (title/description case-insensitive includes). Empty filtered state: "No tours match your search criteria" with suggestion to broaden filters.
- [ ] T012 [US2] Integrate `FilterSidebar` into public catalog page layout in `src/app/tours/page.tsx`. Fetch destinations server-side from Feature 014 API (`GET /api/admin/destinations` — or an empty array if unavailable). Render two-column layout: sidebar (desktop left, `w-72` sticky) + TourGrid. Mobile: sidebar hidden behind hamburger toggle or bottom sheet.

**Checkpoint**: Both user stories are functional — visitors can browse and filter tours with instant client-side responses, shareable URLs, and proper handling of empty/edge states.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T013 [P] Add basic rate limiting to public API in `src/app/api/public/tours/route.ts` — implement a simple in-memory rate limiter (100 requests/min per IP recommended) returning 429 when exceeded
- [ ] T014 [P] Add responsive sidebar toggle for mobile: implement hamburger icon that shows/hides FilterSidebar as an overlay/drawer on screens below `md` breakpoint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 + US1 (TourGrid,TourCard must exist from Phase 3 before FilterSidebar can integrate)
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 — TourGrid and catalog page must exist before FilterSidebar can be integrated

### Within Each User Story

- Types before utilities
- Utilities before endpoints
- Components before page integration
- Core implementation before polish

### Parallel Opportunities

- `T003` and `T004` can run in parallel (different files, no dependencies)
- `T005` and `T006` can run in parallel (TourCard and TourGrid are independent components)
- `T009` can run alone (standalone hook, no dependencies on other US2 tasks)
- `T013` and `T014` can run in parallel (different files, independent concerns)

---

## Parallel Example: User Story 1

```bash
# Launch all independent components together:
Task: "Create TourCard component in src/components/public/TourCard.tsx"
Task: "Create TourGrid component in src/components/public/TourGrid.tsx"
```

```bash
# After TourGrid is done:
Task: "Create public catalog API in src/app/api/public/tours/route.ts"
Task: "Create public catalog page in src/app/tours/page.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch independent work:
Task: "Create useDebounce hook in src/hooks/useDebounce.ts"
```

```bash
# After useDebounce, build FilterSidebar and enhance TourGrid in parallel:
Task: "Create FilterSidebar component in src/components/public/FilterSidebar.tsx"
Task: "Add URL state sync and client-side filtering to TourGrid in src/components/public/TourGrid.tsx"
```

```bash
# After both FilterSidebar and TourGrid enhanced:
Task: "Integrate FilterSidebar into public catalog page in src/app/tours/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — Prisma migration
2. Complete Phase 2: Foundational — Types + query utils
3. Complete Phase 3: User Story 1 — TourCard, TourGrid, API, catalog page
4. **STOP and VALIDATE**: Visit `/tours` — verify grid renders with tour cards, responsive layout, empty/loading/error states
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Catalog grid renders → **Deploy/Demo (MVP!)**
3. Add User Story 2 → Filters and search functional → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- TourCard CTA links to `/tours/[slug]` — tour detail page is out of scope for this feature, link prepares for future implementation
- Destination list for FilterSidebar: fetched server-side in catalog page RSC from Feature 014 admin API; empty array fallback if destinations unavailable
