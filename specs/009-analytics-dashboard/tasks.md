---
description: "Task list for Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter"
---

# Tasks: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

**Input**: Design documents from `specs/009-analytics-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual verification only — no test framework in project

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

No setup tasks required — project already initialized.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema extension (BookingChannel enum, channel field on Booking, costPerPerson on Tour), exchange rate config, and TypeScript interfaces — MUST complete before any user story

- [ ] T001 Add BookingChannel enum, channel field on Booking model, and costPerPerson field on Tour model in prisma/schema.prisma
- [ ] T002 [P] Create static exchange rate configuration with high-precision decimal values in src/config/exchangeRates.ts
- [ ] T003 [P] Create analytics TypeScript interfaces (ExecutiveDashboardStats, ChannelSummary, BookingChannel) in src/types/analytics.ts

**Checkpoint**: Foundation ready — schema has channel enum and cost fields, types and config available

---

## Phase 3: User Story 1 - Admin views executive summary metrics + channel attribution (P1) 🎯 MVP

**Goal**: An admin user navigates to the analytics dashboard and sees a 4-column summary metrics grid (Gross Revenue in USD + EGP, Net Profit Margin, Total Settled Passengers, Top Performing Tour with Coral badge) and a channel attribution section with proportional Tailwind progress bars across all five acquisition channels.

**Independent Test**: Load the analytics dashboard with confirmed bookings across multiple channels and tours with costPerPerson set. All four metric cards display accurate aggregated values matching manual calculation. Channel attribution progress bars are proportional to booking count share.

- [ ] T004 [P] [US1] Create analytics summary API endpoint with admin auth guard, Prisma aggregation queries (_sum, _count, groupBy), timeframe filtering, and 15-minute cache revalidation in src/app/api/admin/analytics/summary/route.ts
- [ ] T005 [US1] Create AnalyticsDashboard client component with 4-column metrics grid (revenue, margin, passengers, top tour) and channel attribution section with Tailwind progress bars in src/components/admin/AnalyticsDashboard.tsx

**Checkpoint**: US1 complete — dashboard displays all metrics and channel attribution from live aggregated data

---

## Phase 4: User Story 3 - Admin filters analytics by timeframe (P3)

**Goal**: An admin uses the timeframe selector to switch between Today, Last 7 Days, Current Month, and Year-to-Date. All metrics and channels update to reflect the new date range. During loading, skeleton placeholders with matching dimensions prevent cumulative layout shift.

**Independent Test**: Select each timeframe option — confirm all metrics update to the correct date-bounded values. During data fetch, confirm skeleton cards display with identical dimensions to the rendered metric cards (zero CLS).

- [ ] T006 [P] [US3] Create AnalyticsTimeFilters client component with Today/7D/Month/YTD toggle buttons and URL query param updates in src/components/admin/AnalyticsTimeFilters.tsx
- [ ] T007 [US3] Integrate AnalyticsTimeFilters and skeleton loading states into AnalyticsDashboard in src/components/admin/AnalyticsDashboard.tsx

**Checkpoint**: US3 complete — time filters drive data refresh with skeleton placeholders

---

## Phase 5: Polish & Verification

**Purpose**: Database migration, admin page creation, end-to-end verification

- [ ] T008 Run Prisma db push and generate to apply schema changes (BookingChannel enum, channel field, costPerPerson field)
- [ ] T009 Create admin analytics page route and embed AnalyticsDashboard component
- [ ] T010 Perform end-to-end verification per quickstart.md (test all metrics, channel attribution, timeframe filters, skeleton states, auth guard, config fallback)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies on user stories — BLOCKS all stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US3 (Phase 4)**: Depends on Foundational + US1 (T005 dashboard must exist for filter integration)
- **Polish (Phase 5)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start first
- **US3 (P3)**: Depends on US1 (shares the AnalyticsDashboard component and API endpoint)

### Parallel Opportunities

| Tasks | Reason |
|-------|--------|
| T002, T003 | Different files, no dependencies |
| T004, T005 | Different files (API route vs component) |
| T006, T007 | T006 ([P]) standalone component, T007 depends on T006 + T005 |

### Parallel Execution Examples

```bash
# Phase 2: Foundation (T002 + T003 in parallel)
Task: "Create exchange rate config in src/config/exchangeRates.ts"
Task: "Create analytics types in src/types/analytics.ts"

# Phase 3: US1 (T004 + T005 in parallel)
Task: "Create analytics API endpoint in src/app/api/admin/analytics/summary/route.ts"
Task: "Create AnalyticsDashboard component in src/components/admin/AnalyticsDashboard.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (T001–T003)
2. Complete Phase 3: US1 (T004–T005)
3. **STOP and VALIDATE**: Test dashboard independently — verify all 4 metric cards and channel attribution with default (Current Month) timeframe
4. Deploy/demo analytics dashboard

### Incremental Delivery

1. **Foundation** (T001–T003) → Schema, types, exchange rates ready
2. **+ US1** (T004–T005) → Full dashboard with metrics + attribution (MVP!)
3. **+ US3** (T006–T007) → Timeframe filters + skeleton states
4. **+ Polish** (T008–T010) → Verified end-to-end

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- US2 (channel attribution) is bundled into US1 since it shares the same API endpoint and dashboard component surface
- No new npm packages needed — Prisma aggregation, Tailwind progress bars, and animate-pulse are all existing capabilities
- The API endpoint is the single data source for all dashboard metrics; US3 adds query param filtering to the same endpoint
