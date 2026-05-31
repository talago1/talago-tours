---
description: "Task list for Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine"
---

# Tasks: Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine

**Input**: Design documents from `specs/019-promo-codes-campaigns/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router project: `app/` for routes, `components/` for UI, `utils/` for shared logic, `prisma/` for schema
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and scaffolding required for all milestones.

- [ ] T001 Create `app/api/public/promo/validate/` directory with route.ts placeholder
- [ ] T002 [P] Create `app/api/admin/campaigns/` directory with route.ts placeholder
- [ ] T003 [P] Create `components/checkout/` directory structure
- [ ] T004 [P] Create `utils/` directory with index.ts barrel export

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, data model, and shared discount calculation logic that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Add `DiscountType` enum (`PERCENTAGE`, `FIXED_AMOUNT`) and `PromoCode` model with all 12 fields, indexes (`@@index([code, isActive])`), and Booking relation in `prisma/schema.prisma`
- [ ] T006 Add optional `promoCodeId String?` field and `promoCode PromoCode? @relation` to existing `Booking` model in `prisma/schema.prisma`
- [ ] T007 Run `npx prisma generate` and `npx prisma db push` to apply schema changes
- [ ] T008 Create shared discount calculation utility in `utils/promo.ts` with `calculateDiscount(promoCode, bookingValue)` and `validatePromoConstraints(promoCode, bookingValue, currency)` functions

**Checkpoint**: Foundation ready — PromoCode model exists in DB, discount math is implemented and importable.

---

## Phase 3: User Story 1 — Customers apply promo codes at checkout (Priority: P1) 🎯 MVP

**Goal**: Customers can enter a promo code on the checkout page, see instant validation feedback, and watch the discount update the total before payment.

**Independent Test**: Navigate to the checkout page, enter a valid promo code in the promo input field, click "Apply", and verify the booking total updates with the correct discount. Entering an expired, invalid, or fully used code must show a clear error message with no price change.

### Implementation for User Story 1

- [ ] T009 [US1] Implement `POST /api/public/promo/validate` route in `app/api/public/promo/validate/route.ts` with full constraint matrix: existence, isActive, expiry, usage cap, minBookingValue, currency match — return calculated discount on success, descriptive error on failure
- [ ] T010 [P] [US1] Create `PromoForm.tsx` client component in `components/checkout/PromoForm.tsx` with promo code input field, Apply button (coral `#FF5B00`), loading spinner on submit, inline error/success display (forest `#00473F` for success badge), and calls `POST /api/public/promo/validate`
- [ ] T011 [P] [US1] Create `PriceSummarySidebar.tsx` component in `components/checkout/PriceSummarySidebar.tsx` that displays original price (slashed with line-through on discount), discounted total in coral `#FF5B00 text-2xl font-black`, and accepts discount data from PromoForm via shared state or callback

**Checkpoint**: At this point, customers can enter promo codes at checkout and see validation feedback and updated pricing.

---

## Phase 4: User Story 2 — Administrators create and manage promo code campaigns (Priority: P1)

**Goal**: Operations managers can create new promo codes via an admin dashboard and monitor usage progress.

**Independent Test**: Log into the admin panel, navigate to the campaigns page, create a new promo code with a percentage discount and usage limit, then use that code at checkout and verify the admin dashboard shows the usage count increment.

### Implementation for User Story 2

- [ ] T012 [US2] Implement `POST /api/admin/campaigns/create` route in `app/api/admin/campaigns/create/route.ts` with input validation (code length, discountType enum, discountValue range, currency ISO, maxUses >= 1, future expiresAt), lowercase code before storage, return 201 with full PromoCode record
- [ ] T013 [US2] Create `app/admin/campaigns/page.tsx` server component that fetches all promo codes, renders a campaign grid with create-form modal (code, discountType, discountValue, currency, minBookingValue, maxUses, expiresAt fields), usage progress bar per code, and visual expired/inactive indicator per spec acceptance scenarios

**Checkpoint**: At this point, admins can create codes and monitor them in the dashboard grid.

---

## Phase 5: User Story 3 — Checkout backend securely validates and applies promo codes atomically (Priority: P2)

**Goal**: Promo code validation and usage-count incrementing happens within a single atomic server-side transaction during checkout initialization, preventing race conditions and client-side tampering.

**Independent Test**: Send two simultaneous checkout requests with the same promo code when only one use remains — exactly one succeeds and the other is rejected. Client-side price modifications are rejected by the server.

### Implementation for User Story 3

- [ ] T014 [US3] Refactor `POST /api/checkout/initialize` route in `app/api/checkout/initialize/route.ts` to accept optional `promoCode` field, re-run the full validation matrix server-side (using shared utils from T008), discard any client-sent computed totals, and reject with error if validation fails
- [ ] T015 [US3] Wire Prisma interactive transaction (`prisma.$transaction`) inside checkout initialize that: (a) re-validates promo within the transaction, (b) atomically increments `PromoCode.usedCount` via `{ increment: 1 }`, (c) creates Booking record with `promoCodeId` set, (d) initiates payment gateway session with server-calculated finalTotal

**Checkpoint**: At this point, the full promo system is live with atomic race-condition protection and exploit shield.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, edge case hardening, and cleanup.

- [ ] T016 [P] Verify zero/negative total clamping: confirm discount is capped at `Math.max(0, subtotal - discountAmount)` in `utils/promo.ts`
- [ ] T017 [P] Verify stacking prevention: confirm only one promo code per booking (form UX and DB constraint)
- [ ] T018 Verify end-to-end flow per `specs/019-promo-codes-campaigns/quickstart.md` — create promo via admin API, validate at checkout, confirm atomic increment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion (needs PromoCode model + promo.ts utils) — BLOCKS US3
- **US2 (Phase 4)**: Depends on Foundational completion (needs PromoCode model) — no dependency on US1
- **US3 (Phase 5)**: Depends on US1 validation logic + Foundational atomic transaction infrastructure
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational. No dependencies on other stories.
- **US2 (P1)**: Can start immediately after Foundational. Independent from US1.
- **US3 (P2)**: Depends on US1's validation logic + US2's admin-created codes to test against.

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration

### Parallel Opportunities

- T002, T003, T004 — All Setup tasks can run in parallel (different directories)
- T010, T011 — US1 UI components can run in parallel (different files, both depend on T009 API)
- US1 and US2 can be implemented in parallel after Foundational (different routes, independent features)

---

## Parallel Example: User Story 1

```bash
# Launch US1 UI components in parallel:
Task: "Create PromoForm.tsx in components/checkout/PromoForm.tsx"
Task: "Create PriceSummarySidebar.tsx in components/checkout/PriceSummarySidebar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test promo code input + validation feedback at checkout
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (schema, utils)
2. Add US1 (customer checkout promo) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (admin campaign management) → Test independently → Deploy/Demo
4. Add US3 (atomic exploit shield) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (checkout promo form + validation API)
   - Developer B: User Story 2 (admin campaigns dashboard)
3. Developer A continues to User Story 3 (exploit shield) after US1 is complete

---

## Summary

| Item | Value |
|------|-------|
| **Total Tasks** | 18 |
| **Setup (Phase 1)** | 4 tasks |
| **Foundational (Phase 2)** | 4 tasks |
| **US1 — Customer promo (P1)** | 3 tasks |
| **US2 — Admin campaigns (P1)** | 2 tasks |
| **US3 — Atomic shield (P2)** | 2 tasks |
| **Polish (Phase 6)** | 3 tasks |
| **Parallel opportunities** | 3 groups (Setup dirs, US1 UI components, US1+US2 independent) |
| **Files created** | 8 files across app/api, components, utils, prisma |
| **Files modified** | 2 files (prisma/schema.prisma) |
