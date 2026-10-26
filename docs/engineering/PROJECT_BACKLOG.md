# Talago Tours Engineering Backlog

Last updated: 2026-10-24

## Operating rule

Statuses are evidence-based. "Implemented, awaiting verification" does not
mean a live integration or deployment has been tested. See
`docs/engineering/PROJECT_AUDIT.md` for the execution boundary.

## Ordered work

| ID | Priority | Status | Problem and evidence | Approach and acceptance criteria | Dependencies / risk |
| --- | --- | --- | --- | --- | --- |
| TAL-001 | P1 | Implemented, awaiting verification | Booking-interest accepted weakly validated numeric fields from the browser in `src/app/api/public/booking-interest/route.ts`; values are stored and shown to staff. The route now enforces finite integer guest counts, finite non-negative estimated price, a 100-guest cap, and ISO currency format before any persistence. | Acceptance: malformed, fractional, infinite, negative, or excessive values cannot create or update a lead. Static source review confirms the guards precede database access; isolated route tests remain required. | Preserve the distinction between an estimate and final booking/payment price. No project-controlled test was executed because the required isolated sandbox is unavailable. |
| TAL-014 | P1 | Implemented, awaiting verification | Public review submission previously accepted a booking reference or id plus tour id in `src/utils/verifyBookingEligibility.ts`; a human-readable reference is not an authorization credential. | Require the matching 256-bit booking access token and internal booking id, derive the displayed reviewer name from the verified booking, and remove manual reference entry from My Bookings. Acceptance: a reference/id alone cannot create a review; a valid token must belong to the selected booking and tour; duplicate and eligibility checks remain enforced. | Static source review complete; isolated API tests required. Access tokens must remain no-store and never be persisted in Review rows. |
| TAL-015 | P2 | Implemented, awaiting verification | Admin analytics returned an explicit `public` cache directive from `src/app/api/admin/analytics/summary/route.ts`. | Use `private, no-store` for business metrics. Acceptance: the response carries no shared-cache permission; deployed CDN behavior still needs owner-observed verification. | Hardening only; no metric logic changed. |
| TAL-016 | P2 | Implemented, awaiting verification | Admin lead errors returned raw exception messages, and checkout invite logging included a customer email. | Return generic admin API errors and avoid logging the email value. Acceptance: client responses and routine logs contain no database exception details or customer email. | Internal server error logs remain available for diagnosis; deployment log retention is externally unverified. |
| TAL-017 | P1 | Implemented, awaiting verification | Checkout trusted loosely coerced guest-tier values and allowed unknown payment scheme strings to reach pricing and booking persistence in `src/app/api/checkout/initialize/route.ts`. | Validate whole bounded guest counts, reject unknown schemes before pricing, and pass the tour capacity into early validation. Acceptance: invalid tiers/schemes return 400 before persistence or gateway calls; valid requests preserve server-side pricing and transactional capacity checks. | Static source review complete; isolated checkout/database/payment-fixture tests remain required. |
| TAL-002 | P1 | Not started | Booking/availability code exists in `src/utils/bookingEngine.ts` and `src/utils/capacityEngine.ts`, but the customer checkout-to-booking API lifecycle has not been verified end-to-end. | Trace authoritative route, pricing, selected slot, capacity, lead conversion, and payment status. Add isolated tests for success, capacity conflict, and retry/serialization behavior. | Requires isolated database and sandbox. Do not run against Supabase production. |
| TAL-003 | P1 | Not started | Customer booking status/ownership is only partially evidenced. `Booking.accessToken` is designed as a secret capability, but all public access routes need a complete authorization trace. | Inventory access-token and authenticated paths; ensure references are never credentials; add negative ownership tests. | Requires isolated test data and secrets. |
| TAL-004 | P1 | Not started | Admin auth relies on `middleware.ts` protecting prefixes; deployment configuration and token lifecycle are externally unverified. | Verify Vercel matcher behavior and environment presence with owner-approved dashboard review; add regression coverage for protected API prefixes. | External dashboard and isolated browser test required. |
| TAL-005 | P1 | Not started | Webhook/payment flows are present in the project but have not been source-traced in this inventory cycle. | Review callback signature verification, idempotency, booking state transitions, and failure handling before any payment feature extension. | No provider calls; use fixtures only. |
| TAL-006 | P2 | Not started | Inbox has reading, reply, archive/reopen, and delete operations, but no search, pagination, or recovery mechanism after permanent deletion. | Decide retention policy, add server-side search/pagination, and use archive as the standard reversible workflow. Acceptance: large inbox remains usable and destructive actions report accurate results. | Preserve customer correspondence and privacy obligations. |
| TAL-007 | P2 | Not started | Lead CRM has statuses/search but no internal follow-up dates, internal notes separation, or unified lead/chat/booking timeline. | Extend existing `BookingLead` workflow rather than creating duplicate customers. Acceptance: staff can see linked booking/conversation/history and manage next follow-up. | Schema migration requires review and isolated DB validation. |
| TAL-008 | P2 | Not started | Active tour records have optional content gaps documented in `docs/TRIP_DATA_AUDIT.md`. | Complete only operator-verified data through the existing editor/import; do not generate or publish factual itinerary/pricing/policy content. | Content operation, not code work. |
| TAL-009 | P2 | Not started | Notification source paths exist but delivery, retries, and Telegram channel permissions are unverified. | Verify provider configuration with non-production credentials, record failed/sent state consistently, and define retry policy. | Requires owner-provided test channel/credentials; never commit secrets. |
| TAL-010 | P2 | Not started | Existing Playwright suite is limited to smoke tests; no CI workflow was found. | Build isolated fixtures for booking-interest, admin authorization, capacity, and customer booking status; run in a compliant sandbox. | Blocked until required execution isolation is available. |
| TAL-011 | P2 | Not started | Accessibility, mobile, performance, and SEO are not measurable through static review alone. | Establish approved browser/performance checks, then fix evidenced issues only. | Requires sandboxed local server/browser. |
| TAL-012 | P3 | Not started | Analytics dashboard exists, but metric definitions and reconciliation to authoritative booking/payment states are unverified. | Document definitions for lead, pending, confirmed, paid, cancellation, and revenue; test date filters and empty states. | Depends on TAL-002 and TAL-005. |
| TAL-013 | P3 | Not started | Review features and moderation exist; public review provenance and post-trip lifecycle need operational validation. | Verify only completed eligible bookings can review, moderation integrity, and no seeded data is presented as verified customer feedback. | Requires safe fixtures and content review. |

## Batch plan

### Batch 1 — Booking-interest input integrity

- **Task:** TAL-001.
- **Benefit:** prevents malformed lead data and misleading staff notifications without changing the booking/payment state machine.
- **Scope:** validation inside `src/app/api/public/booking-interest/route.ts`, plus backlog/audit record.
- **Acceptance criteria:** request fields are finite and within limits; guest counts are whole numbers; malformed data returns a client error; an interest remains explicitly non-binding.
- **Security/regression considerations:** retain rate limiting, server-resolved tour identity, deduplication, chat mirroring, and no secrets in responses.
- **Verification result:** implemented and source-reviewed. `git diff --check` passed; TypeScript/lint/build and route tests were not executed because the required isolated execution sandbox is unavailable.

### Next eligible batch

TAL-002: trace and verify the authoritative checkout/capacity/booking lifecycle in an isolated database environment.

### Completed source batches in this session

#### Batch 2 — Verified-review ownership

- **Tasks:** TAL-014.
- **Benefit:** prevents a human-readable booking reference from acting as a review credential and keeps public reviewer identity tied to the verified booking.
- **Files:** `src/types/review.ts`, `src/utils/verifyBookingEligibility.ts`, `src/utils/reviewSubmission.ts`, `src/components/modals/WriteReviewModal.tsx`, `src/app/(public)/my-bookings/page.tsx`, `src/app/api/public/my-bookings/route.ts`.
- **Verification result:** source-reviewed and `git diff --check` passed. Isolated negative/positive API tests remain blocked by the sandbox requirement.

#### Batch 3 — Admin analytics cache boundary

- **Tasks:** TAL-015.
- **Benefit:** prevents shared caches from retaining admin revenue and performance metrics.
- **File:** `src/app/api/admin/analytics/summary/route.ts`.
- **Verification result:** source-reviewed and `git diff --check` passed. Vercel/CDN behavior remains externally unverified.

#### Batch 4 — Admin error and log minimization

- **Tasks:** TAL-016.
- **Benefit:** reduces accidental exposure of database implementation details and customer PII through admin responses and routine logs.
- **Files:** `src/app/api/admin/leads/route.ts`, `src/app/api/admin/leads/[id]/route.ts`, `src/app/api/checkout/initialize/route.ts`.
- **Verification result:** source-reviewed and `git diff --check` passed. Provider and deployment log retention remain externally unverified.

#### Batch 5 — Checkout input integrity

- **Tasks:** TAL-017.
- **Benefit:** prevents malformed guest counts and unknown payment states from entering the booking/payment pipeline.
- **File:** `src/app/api/checkout/initialize/route.ts`.
- **Verification result:** source-reviewed and `git diff --check` passed. No database, payment provider, or project-controlled test was executed because the required isolated sandbox is unavailable.
