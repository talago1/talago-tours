---

description: "Task list for Digital Booking Voucher & Mobile QR Scanner feature implementation"
---

# Tasks: Digital Booking Voucher & Mobile QR Scanner (Feature 012)

**Input**: Design documents from `specs/012-voucher-qr-scanner/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/verify-qr-api.md

**Tests**: No tests requested in specification — implementation-only tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `prisma/`, `utils/` at repository root
- All paths are project-relative

---

## Phase 1: Setup (Shared Infrastructure)

No setup tasks needed — this feature extends an existing Next.js project with Prisma, crypto, and TypeScript already configured. No new Prisma fields or DB migration needed (uses existing Booking model from Feature 008).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Create HMAC-SHA256 token signing and verification utilities using Node `crypto` in `src/utils/qrTokenCrypto.ts`

**Checkpoint**: Foundation ready — crypto utility can generate and verify tokens. User story implementation can now begin.

---

## Phase 3: User Story 1 — Tourist views and prints digital boarding pass (Priority: P1) 🎯 MVP

**Goal**: Tourist with a confirmed booking opens a voucher page showing a premium boarding pass with tour details and a scannable QR code. The page is print-optimized for A4.

**Independent Test**: Create a confirmed booking, navigate to `/tours/boarding-pass/[id]` — verify all details render correctly, QR code is scannable, and print layout hides web chrome.

### Implementation for User Story 1

- [X] T002 [P] [US1] Create pure TypeScript SVG QR code generator utility with zero dependencies in `src/utils/qrCodeGenerator.ts` (reused existing `src/utils/qrEncoder.ts` from Feature 008)
- [X] T003 [US1] Create public boarding pass page with CONFIRMED status check, boarding pass layout, and QR rendering in `src/app/tours/boarding-pass/[id]/page.tsx`

**Checkpoint**: At this point, US1 should be fully functional — tourist can view and print their boarding pass with scannable QR code.

---

## Phase 4: User Story 2 — Guide scans QR code with mobile camera to check in (Priority: P2)

**Goal**: Guide opens scanner on mobile, camera activates with targeting reticle and animated scan line. Scanning a valid QR triggers haptic feedback, shows booking details, and one-tap marks check-in.

**Independent Test**: Open scanner on mobile, point at valid QR from a test booking — confirm decode + vibration + details display + check-in success (green card).

### Implementation for User Story 2

- [X] T004 [P] [US2] Create POST /api/admin/operations/verify-qr endpoint with admin auth, HMAC verification, and atomic check-in transaction in `src/app/api/admin/operations/verify-qr/route.ts`
- [X] T005 [P] [US2] Create QRScannerTerminal component with getUserMedia camera stream, targeting reticle, animated scan line, BarcodeDetector decode loop, and haptic vibration in `src/components/admin/QRScannerTerminal.tsx`
- [X] T006 [US2] Create admin scanner page composing QRScannerTerminal with result display (green success card) in `src/app/admin/operations/scan/page.tsx`

**Checkpoint**: At this point, both US1 and US2 work. Full scan-to-check-in flow is operational.

---

## Phase 5: User Story 3 — Scanner handles errors gracefully (Priority: P3)

**Goal**: Scanner shows clear error messages for camera denial, invalid tokens, expired codes, and duplicate check-ins. Each error has a retry path.

**Independent Test**: Deny camera permission (error message shown). Scan an invalid QR code (error + retry option). Scan a QR from an already-checked-in booking (duplicate alert).

### Implementation for User Story 3

- [X] T007 [US3] Add camera permission denial error state, invalid/expired token error display, and duplicate check-in alert with retry option to `src/components/admin/QRScannerTerminal.tsx`

**Checkpoint**: All three user stories are fully functional with graceful error handling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T008 Add Tailwind `print:` modifiers to hide navigation, buttons, and shadows on A4 print output in `src/app/tours/boarding-pass/[id]/page.tsx`
- [X] T009 Update AGENTS.md plan reference to `spec/012-voucher-qr-scanner/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — no tasks needed
- **Foundational (Phase 2)**: Must complete before all user stories — BLOCKS US1, US2, US3
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2
- **US2 (Phase 4)**: Depends on US1 (needs QR code generation from T002) and Foundational
- **US3 (Phase 5)**: Depends on US2 (error handling built into QRScannerTerminal)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — NO dependencies on other stories
- **US2 (P2)**: Starts after US1 (shares QR code from T002) — independently testable via API
- **US3 (P3)**: Starts after US2 (components from T005/T006 need error states)

### Parallel Opportunities

- T002 (QR generator) and T004 (verify API) can run in parallel
- T004 (verify API) and T005 (scanner component) can run in parallel
- T006 (admin page) depends on T005 completion but can start alongside T007

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (crypto utility)
2. Complete Phase 3: US1 (Voucher page with QR code)
3. **STOP and VALIDATE**: Test voucher page renders correctly with scannable QR
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Scanner + Verify API) → Test independently → Deploy/Demo
4. Add US3 (Error handling) → Test independently → Deploy/Demo

### Parallel Strategy

With multiple developers:
1. Complete Foundational together
2. Once Foundational is done:
   - Developer A: US1 (QR generator + voucher page)
   - Developer B: US2 (verify API + scanner terminal + admin page — waits for QR code format)
