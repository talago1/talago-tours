---
description: "Task list for Automated Digital Tour Voucher & QR Check-In Engine"
---

# Tasks: Automated Digital Tour Voucher & QR Check-In Engine

**Input**: Design documents from `specs/008-voucher-qr-checkin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual verification only — no test framework in project

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

No setup tasks required — project is already initialized with Next.js 14, TypeScript, Prisma, and TailwindCSS. All dependencies exist from prior feature implementations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prisma schema extension, type definitions, and audit utility — MUST complete before any user story

- [ ] T001 Extend Booking model with isCheckedIn, checkedInAt, and checkInLog fields in prisma/schema.prisma
- [ ] T002 [P] Create voucher and check-in TypeScript interfaces in src/types/voucher.ts
- [ ] T003 [P] Create voucher audit log manager utility in src/utils/voucherLogManager.ts

**Checkpoint**: Foundation ready — Booking model has voucher/check-in fields, types defined, audit helper available

---

## Phase 3: User Story 1 - Tourist views and prints digital boarding pass (P1) 🎯 MVP

**Goal**: A tourist with a confirmed booking navigates to their voucher page and sees a premium digital boarding pass with all tour details and a scannable QR code. They can print the voucher via the browser's native print dialog. Unconfirmed bookings (PENDING/CANCELLED) and invalid references show secure error screens.

**Independent Test**: Create a confirmed booking, navigate to `/tours/voucher/[ref]`, confirm full boarding pass renders with QR code. Navigate to print, confirm clean A4 output. Test PENDING and CANCELLED bookings — confirm error screens with no data leakage. Test invalid ref — confirm 404.

- [ ] T004 [P] [US1] Create zero-dependency client-side SVG QR code generator component in src/components/vouchers/QrGeneratorCard.tsx
- [ ] T005 [US1] Create voucher boarding pass page with RSC data fetching, status guard (CONFIRMED/PENDING/CANCELLED), print styles, and window.print() button in src/app/tours/voucher/[ref]/page.tsx

**Checkpoint**: US1 complete — full boarding pass renders with QR code, print works, error states for unconfirmed bookings

---

## Phase 4: User Story 2 - Staff verifies tourist via QR code scan (P2)

**Goal**: Staff (already logged into admin on mobile) scans the QR code from the tourist's voucher. The verification page displays booking details with a single-action confirm button. Duplicate scan attempts are detected and display an alert with the original check-in timestamp.

**Independent Test**: Navigate to the admin verification page for a confirmed booking. Confirm booking details show with a "Confirm Check-In" action. Submit — confirm isCheckedIn=true, checkInLog populated. Submit again — confirm 400 "already claimed" error with original timestamp.

- [ ] T006 [P] [US2] Create admin verify check-in API endpoint (PATCH) with atomic Prisma $transaction in src/app/api/admin/bookings/verify/[ref]/route.ts
- [ ] T007 [US2] Create admin verify page (GET) with mobile-optimized booking summary, confirm button, and duplicate alert in src/app/admin/bookings/verify/[ref]/page.tsx

**Checkpoint**: US2 complete — staff can scan QR, verify booking, complete check-in atomically with audit logging; duplicate detection works

---

## Phase 5: Cross-Feature Integration (Option C)

**Purpose**: Dual-channel voucher delivery — checkout success page CTA and WhatsApp message link

- [ ] T008 Inject voucher CTA button (Coral #FF5B00) linking to `/tours/voucher/[ref]` on checkout success page in src/app/tours/checkout/success/page.tsx
- [ ] T009 [P] Append localized voucher URL line to WhatsApp message templates in src/utils/whatsappLinkBuilder.ts

**Checkpoint**: Voucher accessible from both success page and WhatsApp confirmation

---

## Phase 6: Polish & Verification

**Purpose**: Database migration, end-to-end verification

- [ ] T010 Run Prisma db push and generate to apply Booking model changes
- [ ] T011 Perform end-to-end verification per quickstart.md (test all voucher states, QR scan, print, duplicate detection, integration points)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies on user stories — BLOCKS all stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational completion; independent of US1
- **Cross-Feature (Phase 5)**: Depends on US1 (voucher page must exist for the CTA and WhatsApp links to point to)
- **Polish (Phase 6)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start first
- **US2 (P2)**: No dependencies on US1 — can start in parallel with US1
- **Cross-Feature**: Depends on US1

### Parallel Opportunities

| Tasks | Reason |
|-------|--------|
| T002, T003 | Different files, no dependencies |
| T004, T005 | Different files (QR component vs page) |
| T006, T007 | Different files (API route vs admin page) |
| T008, T009 | Different files (success page vs whatsappLinkBuilder) |
| US1 (Phase 3) + US2 (Phase 4) | Independent user stories, can proceed in parallel |

### Parallel Execution Examples

```bash
# Phase 2: Foundation (T002 + T003 in parallel)
Task: "Create voucher types in src/types/voucher.ts"
Task: "Create audit log manager in src/utils/voucherLogManager.ts"

# Phase 3: US1 (T004 + T005 in parallel)
Task: "Create QR generator in src/components/vouchers/QrGeneratorCard.tsx"
Task: "Create voucher page in src/app/tours/voucher/[ref]/page.tsx"

# Phase 4: US2 (T006 + T007 in parallel)
Task: "Create verify API route in src/app/api/admin/bookings/verify/[ref]/route.ts"
Task: "Create admin verify page in src/app/admin/bookings/verify/[ref]/page.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (T001–T003)
2. Complete Phase 3: US1 (T004–T005)
3. **STOP and VALIDATE**: Test voucher page independently — full boarding pass with QR code + print, error screens for unconfirmed bookings
4. Deploy/demo voucher feature

### Incremental Delivery

1. **Foundation** (T001–T003) → Prisma schema, types, audit helper ready
2. **+ US1** (T004–T005) → Tourist can view and print voucher (MVP!)
3. **+ US2** (T006–T007) → Staff can scan QR and complete check-in
4. **+ Cross-Feature** (T008–T009) → Voucher accessible from success page and WhatsApp
5. **+ Polish** (T010–T011) → Verified end-to-end

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Quickstart.md provides detailed test scenarios for Phase 6 verification
- The voucher page at Phase 3 includes all three status outcomes (CONFIRMED renders full pass, PENDING/CANCELLED renders error, not-found renders 404) as specified in the data model
- No new npm packages needed — QR encoder is pure TypeScript, `crypto` is built-in
