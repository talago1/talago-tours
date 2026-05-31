---

description: "Task list for Secure Payment Integration & Webhook Orchestrator"
---

# Tasks: Secure Regional Payment Integration & Webhook Orchestrator

**Input**: Design documents from `specs/007-payment-webhook-orchestrator/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No test framework in project — all verification is manual per acceptance scenarios in spec.md.

**Organization**: Tasks are grouped by user story (US1, US2) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Single Next.js project: `src/` at repository root
- All paths are relative to repository root (e.g., `src/app/api/...`)

---

## Phase 1: Setup

**Purpose**: No new package dependencies needed — all functionality uses Node.js built-in `crypto` and native `fetch`

**Checkpoint**: Ready for foundational work

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure (Prisma schema update, types, env verification) that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `paymentStatus` (String?, null default) and `paymentGatewayLogs` (Json, default `"[]"`) fields to Booking model in `prisma/schema.prisma`
- [X] T002 [P] Create payment type definitions in `src/types/payment.ts`: PaymentStatus union, PaymentInitiationRequest, PaymentInitiationResponse, WebhookPayload interfaces, PaymentGatewayLog type
- [X] T003 [P] Create env var verification utility in `src/lib/env.ts` that checks `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_HMAC_SECRET` on boot and throws if missing
- [X] T004 Run `npx prisma db push` and `npx prisma generate` to apply Booking model changes to database

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Customer Pays for Booking via Payment Gateway (Priority: P1) 🎯 MVP

**Goal**: Customer completes checkout, lands on transitional payment page, is redirected to Paymob gateway to pay.

**Independent Test**: POST to `/api/payments/initiate` with a valid bookingReference → confirm response contains redirect URL. Navigate to the payment page → confirm auto-redirect to Paymob.

### Implementation for User Story 1

- [X] T005 [P] [US1] Create Paymob API helper functions in `src/utils/paymob.ts` (getAuthToken, registerOrder, getPaymentKey, buildRedirectUrl) using native fetch with Paymob Accept API endpoints
- [X] T006 [US1] Create POST `/api/payments/initiate` endpoint in `src/app/api/payments/initiate/route.ts` (verify env, fetch booking, call Paymob helpers, set paymentStatus=PROCESSING, return redirectUrl)
- [X] T007 [US1] Create payment transitional page in `src/app/tours/checkout/pay/page.tsx` (`"use client"`, fetch initiate on mount, `window.location.href` redirect, coral fallback button, forest green spinner text)

**Checkpoint**: Customer can initiate payment and reach Paymob gateway — independently testable

---

## Phase 4: User Story 2 — Payment Webhook Updates Booking Status (Priority: P1)

**Goal**: Paymob sends webhook, system validates HMAC, atomically updates paymentStatus and booking status.

**Independent Test**: Send a valid signed webhook POST to `/api/payments/webhook` → confirm booking transitions to PAID/CONFIRMED. Send invalid HMAC → confirm 401 rejection.

### Implementation for User Story 2

- [X] T008 [P] [US2] Create POST `/api/payments/webhook` endpoint in `src/app/api/payments/webhook/route.ts` (parse raw body, alphanumeric sort, HMAC-SHA256 with crypto module, constant-time comparison, atomic Prisma $transaction for PAID+CONFIRMED or FAILED, append paymentGatewayLogs entry, return 200/401)

**Checkpoint**: Webhook securely processes payment confirmations — independently testable

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final configuration, integration, and verification

- [X] T009 Configure Paymob sandbox environment variables in `.env.local` (PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_HMAC_SECRET)
- [X] T010 Verify end-to-end flow per quickstart.md: initiate payment, webhook success, HMAC rejection, duplicate idempotency, payment page fallback button

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Foundational (T001–T004)
- **User Story 2 (Phase 4)**: Depends on Foundational (T001–T004). Independent of US1.
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — No dependencies on other stories
- **US2 (P1)**: Can start after Foundational — No dependencies on other stories

### Within Each User Story

- Types before services
- Services before endpoints
- Endpoints before pages
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different files, no conflicts)
- T005 can start alongside T004 (Paymob utils only need types T002 and env T003)
- T006 depends on T005 (needs Paymob helpers)
- T007 depends on T006 (needs initiate endpoint)
- T008 is independent of US1 entirely (can start after Foundational)

---

## Parallel Example: All Stories After Foundational

```bash
# Developer A — US1
Task: "Create Paymob API helpers in src/utils/paymob.ts" [T005]
Task: "Create initiate endpoint in src/app/api/payments/initiate/route.ts" [T006]
Task: "Create payment page in src/app/tours/checkout/pay/page.tsx" [T007]

# Developer B — US2 (independent track)
Task: "Create webhook endpoint in src/app/api/payments/webhook/route.ts" [T008]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational → Schema, types, env verification
2. Complete Phase 3: User Story 1 → Payment initiation works
3. **STOP and VALIDATE**: POST initiate endpoint → get redirect URL → reach Paymob
4. Deploy/demo if ready (manual payment confirmation via Paymob dashboard)

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (initiate endpoint + payment page)
   - Developer B: User Story 2 (webhook endpoint)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No new npm packages needed — `crypto` is Node built-in, `fetch` is native
