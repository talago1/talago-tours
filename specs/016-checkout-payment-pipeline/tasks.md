---

description: "Implementation tasks for Hybrid Checkout & Payment Pipeline"
---

# Tasks: Hybrid Checkout & Payment Pipeline

**Input**: Design documents from `specs/016-checkout-payment-pipeline/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths

## Path Conventions

- **Single project**: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes for the payment pipeline

- [ ] T001 Modify `prisma/schema.prisma` — add `PaymentScheme`, `PaymentStatus`, `PaymentProvider` enums; add `Transaction` model with fields (id, bookingId @unique, provider, gatewayReference?, amountPaidOnline Decimal, amountDueOnArrival Decimal, currency @default("EGP"), scheme, status, createdAt, updatedAt); add `paymentScheme`, `amountPaidOnline Decimal?`, `amountDueOnArrival Decimal?` to `Booking` model; add `maxCapacity Int?` to `Tour` model
- [ ] T002 Run `npx prisma migrate dev --name add-payment-pipeline` to apply schema changes

**Checkpoint**: Database schema ready with Transaction model and extended Booking/Tour models

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, payment gateway helpers, and webhook crypto utilities needed by all user stories

- [ ] T003 [P] Create TypeScript interfaces in `src/types/checkout.ts`: `CheckoutFormData` (leadName, email, phone, hotelName, roomNumber?, pickupTime, paymentScheme), `InitializeRequest` (tourId, departureDate, guestCount, formData), `InitializeResponse` (bookingId, transactionId, amountPaidOnline, amountDueOnArrival, scheme, gatewayIframeUrl?), `PriceBreakdown` (total, amountPaidOnline, amountDueOnArrival, scheme)
- [ ] T004 [P] Create payment gateway utility in `src/utils/payment.ts` with `initiatePaymobSession(total: Decimal): Promise<string>` (auth → order → payment key → return iframe URL) and `initiateFawrySession(total: Decimal): Promise<string>` following their API documentation patterns
- [ ] T005 [P] Create webhook HMAC verification utility in `src/lib/webhook.ts` with `verifyHmacSignature(payload: string, signature: string, secret: string): boolean` using HMAC-SHA256, alphanumeric key sort, and `timingSafeEqual` constant-time comparison

**Checkpoint**: Foundation ready — types, payment gateways, and webhook crypto available

---

## Phase 3: User Story 1 — Tourist Completes Checkout with Any Payment Scheme (Priority: P1) 🎯 MVP

**Goal**: A responsive checkout page where tourists enter passenger/pickup details, select any payment scheme (Full Online, Deposit Online, Pay on Arrival), see a live price breakdown, and submit. Pay on Arrival bookings are created immediately with a confirmation shown on-screen.

**Independent Test**: Visit `/checkout/[tourId]` → enter passenger name, email, phone, hotel name, pickup time → select Pay on Arrival → price breakdown updates to show $0 online and full amount in Coral as due on arrival → submit → booking created → confirmation shows amount due. Also: invalid email shows validation error; sold-out date shows "Sold out" message.

- [ ] T006 [P] [US1] Create `PriceSummarySidebar` component in `src/components/checkout/PriceSummarySidebar.tsx` (`"use client"`): display tour title, guest count, "basePrice × guests" line, three scheme toggle buttons (FULL_ONLINE, DEPOSIT_ONLINE, PAY_ON_ARRIVAL), reactive price breakdown (total, amount due online, balance on arrival in Coral `text-[#FF5B00] text-xl font-bold` when >0). Sticky on desktop (`sticky top-8`). Props: `tourTitle`, `guestCount`, `basePrice`, `scheme`, `onSchemeChange`.
- [ ] T007 [P] [US1] Create checkout page in `src/app/checkout/[tourId]/page.tsx` (`"use client"`): 2-column `grid grid-cols-1 lg:grid-cols-3 gap-8` layout. Left (2 cols): form with fields for leadName, email, phone, hotelName, roomNumber (optional), pickupTime. Right (1 col): `<PriceSummarySidebar>`. On submit: POST to `/api/checkout/initialize`. For PAY_ON_ARRIVAL: show confirmation. For online: redirect to gateway iframe URL. Loading state on submit button. Mobile: single-column stack.
- [ ] T008 [US1] Create checkout initialize API in `src/app/api/checkout/initialize/route.ts`. POST handler: lookup tour (basePrice, maxCapacity), check capacity by counting CONFIRMED bookings for tourId + departureDate vs maxCapacity (return 409 if exceeded), compute splits server-side (total = basePrice × guestCount, apply scheme fraction), wrap in Prisma `$transaction`: create Booking + Transaction, for PAY_ON_ARRIVAL (Booking CONFIRMED, Transaction PENDING/CASH) return confirmation, for online (Booking PENDING, Transaction PENDING) perform gateway handshake via utility → return iframe URL. Handle validation (400) and gateway errors (502).

**Checkpoint**: At this point, User Story 1 is complete — tourists can check out with any payment scheme and submit bookings. Pay on Arrival flow works end-to-end. Online flows reach the gateway redirect step.

---

## Phase 4: User Story 2 — Tourist Pays Online via Secure Gateway (Priority: P2)

**Goal**: After submitting an online payment booking, the tourist is redirected to the payment gateway, completes payment, and returns to a confirmation page showing the booking reference, CONFIRMED status, and any balance due on arrival. Failed payments show a clear error with retry option.

**Independent Test**: Select Full Online Payment on checkout → submit → redirected to gateway → complete test card payment → returned to confirmation page → shows booking reference, CONFIRMED status, $0 due on arrival. Also: decline the payment → see failure message with retry option.

- [ ] T009 [US2] Create booking confirmation page in `src/app/booking/[id]/page.tsx` (`"use client"`): fetch booking + transaction by ID on mount, display booking reference, status (CONFIRMED/PENDING), payment scheme, amount paid online, amount due on arrival (Coral if >0), and passenger/pickup summary. Handle states: loading (skeleton), not found (404 message), pending payment ("Payment processing" with retry), confirmed (success display), failed (error with retry link).
- [ ] T010 [US2] Add gateway redirect and return handling to checkout page in `src/app/checkout/[tourId]/page.tsx`: on successful initialize response with `gatewayIframeUrl`, redirect to the gateway URL (window.location.href). Parse return URL query params for payment status. If return shows success → navigate to `/booking/[id]`. If return shows failure → show error message with "Retry payment" and "Cancel" buttons. Add "Resume payment" prompt for previously initiated but unfinished payments.

**Checkpoint**: Both US1 and US2 complete — tourists can complete the full online payment flow end-to-end with proper redirect, completion, and error handling.

---

## Phase 5: User Story 3 — System Verifies Payment Notifications and Updates Booking (Priority: P3)

**Goal**: The system receives payment confirmation notifications from Paymob/Fawry, cryptographically verifies them, and atomically updates the Transaction status to SUCCESS and Booking status to CONFIRMED. Invalid signatures are rejected without any state changes.

**Independent Test**: Simulate a valid HMAC-signed Paymob webhook payload → Transaction status changes to SUCCESS, Booking changes to CONFIRMED. Send payload with invalid signature → returns 401, no state change. Send duplicate notification → returns 200 idempotent, no duplicate processing.

- [ ] T011 [US3] Create payment webhook route in `src/app/api/webhooks/payment/route.ts`. POST handler: extract HMAC signature from `X-HMAC-Signature` header (Paymob) or `signature` field (Fawry), verify via `verifyHmacSignature` from `src/lib/webhook.ts` (return 401 if invalid). Parse provider-specific payload (by `obj.order.merchant_order_id` for Paymob, `merchantRefNum` for Fawry → map to `gatewayReference`). Check idempotency (Transaction.status already SUCCESS → return 200 `already_processed`). Use Prisma `$transaction`: update Transaction→SUCCESS, Booking→CONFIRMED. If `amountDueOnArrival > 0`: flag booking for Feature 11 manifest collection. Return 200 with bookingId and status.

**Checkpoint**: All three user stories are functional — the complete checkout-to-payment-to-webhook pipeline is operational.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T012 [P] Add downstream integration triggers after successful payment: flag `amountDueOnArrival` for Feature 11 daily manifest (update a `collectionDue` boolean or emit an event/call that the manifest query reads), and trigger QR voucher generation for Feature 12 by enqueuing a voucher creation call
- [ ] T013 Validate all error states across components: test gateway timeout (show retry option), test capacity race condition (show "Sold out" message), test invalid HMAC (401 without DB mutation), test duplicate webhook (200 idempotent), test session expiry (show resume prompt)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 (checkout page + initialize API must exist before gateway redirect can be handled)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (webhook utils) — independent of US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 — checkout page and initialize API must exist
- **User Story 3 (P3)**: Can start after Phase 2 — independent of US1/US2 (can run in parallel!)

### Within Each User Story

- Types before utilities
- Utilities before endpoints
- Components before page integration
- Core implementation before polish

### Parallel Opportunities

- `T003`, `T004`, and `T005` can run in parallel (different files, no dependencies)
- `T006` and `T007` can run in parallel (PriceSummarySidebar and checkout page are independent)
- `T012` is standalone polish
- **Critical**: US3 (Phase 5) can run in parallel with US1 + US2 since it only depends on Phase 2 utilities

---

## Parallel Example: User Story 1

```bash
# Launch all independent components together:
Task: "Create PriceSummarySidebar component in src/components/checkout/PriceSummarySidebar.tsx"
Task: "Create checkout page in src/app/checkout/[tourId]/page.tsx"
```

```bash
# After both components are done:
Task: "Create checkout initialize API in src/app/api/checkout/initialize/route.ts"
```

## Parallel Example: User Story 3 (Independent of US1/US2)

```bash
# Start after Phase 2 completes, while US1 is still in progress:
Task: "Create payment webhook route in src/app/api/webhooks/payment/route.ts"
```

## Parallel Example: User Story 2

```bash
# Start after US1 (Phase 3) completes:
Task: "Create booking confirmation page in src/app/booking/[id]/page.tsx"
Task: "Add gateway redirect and return handling to checkout page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — Prisma migration
2. Complete Phase 2: Foundational — Types + payment utils + webhook utils
3. Complete Phase 3: User Story 1 — Sidebar, checkout page, initialize API
4. **STOP and VALIDATE**: Test Pay on Arrival flow end-to-end (no gateway needed)
5. Deploy/demo if ready — Pay on Arrival bookings work

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add User Story 1 → Pay on Arrival checkout working → **Deploy/Demo (MVP!)**
3. Add User Story 3 → Webhook processing (can run in parallel with US2)
4. Add User Story 2 → Online payment full flow → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Setup + Foundational together
2. Once Phase 2 is done:
   - Developer A: User Story 1 (checkout UI + API)
   - Developer B: User Story 3 (webhook route — independent!)
3. Developer A finishes US1 → Developer C picks up User Story 2

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US3 can be implemented in parallel with US1/US2 — it only needs Phase 2 utilities
- Price calculations are ALWAYS server-side — never trust client-provided amounts
- Webhook HMAC verification uses the same approach as Feature 007 for consistency
