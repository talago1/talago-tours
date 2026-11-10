# Talago Tours — Current Development State

## System Health & Build Status
- **Next.js:** 14.2.35
- **TypeScript:** Strict Mode (`tsconfig.json: strict: true`), 0 type errors (`npx tsc --noEmit` green)
- **Production Build:** `84/84 pages` compiled successfully with 0 errors
- **Lint:** `npm run lint` green (0 errors, only pre-existing next/image warnings)
- **Deployment Platform:** Vercel Production (`https://talago-tours.vercel.app`)
- **Active Git Branch:** `feat/clean-rebuild-account-auth` (branching from `main`)

---

## Architectural Upgrades: Clean Rebuild of Customer Account & Auth (Nov 10, 2026)

### 1. Root-Cause Fix: Account Loading Infinite Spinner
- **The Issue:** `/account` suffered an infinite "Loading account..." state due to a recursive 3-path client loader interacting with a `loadingRef` guard. When inner recursive calls finished, the outer lock release prevented `setLoading(false)` from ever executing if errors or null states occurred.
- **The Fix:** Replaced the fragile multi-path loader with a single authoritative pipeline:
  1. Primary: Direct fetch to `/api/public/my-bookings` (with client Bearer token header if available).
  2. Fallback/Sync: If unauthenticated (cookie missing/fresh OAuth), single POST to `/api/auth/session` to synchronize server cookies, followed immediately by `/api/public/my-bookings`.
  3. Clean termination: `finally { setLoading(false) }` guaranteed to execute in every execution branch.

### 2. PostgreSQL Cast Bug in Phone Lookup (Resolved)
- **The Issue:** `findIdsByNationalPhone` in `src/server/customerBookings.ts` passed raw JS integer literals into Prisma SQL queries calling PostgreSQL's `right(text, integer)` function. PostgreSQL interpreted the parameter as `bigint`, throwing `function right(text, bigint) does not exist`. This caused all phone-based booking queries to silently crash and fall back to empty booking lists.
- **The Fix:** Explicit `::int` casts added across all 3 raw SQL queries (`right(b."customerPhone", ${len}::int)`, etc.). Direct and national-variant phone matching now operates with 100% database accuracy.

### 3. Server Route Simplification & Consolidation
- **`src/app/api/auth/session/route.ts` Complete Refactor:**
  - Removed duplicate `resolveUserProfile` implementations.
  - Standardized on shared `resolveCustomerProfileForUser` and newly introduced `formatUserProfile` helper from `src/server/customerBookings.ts`.
  - Removed leaking access/refresh tokens from POST response bodies.
  - Normalized GET, POST, PATCH, and DELETE responses to uniform JSON contracts.
- **`src/app/api/public/my-bookings/route.ts`:**
  - Adopted the centralized `formatUserProfile` helper for consistent user payload serialization.

### 4. Auth Callback & Bridge Optimization
- **Telegram OIDC Callback:** Removed redundant client-side `fetch('/api/auth/session')` POST roundtrip from the HTML bridge script. Server already sets `talago_session` and `talago_refresh` cookies on the response header. Replaced navigation with `window.location.replace` to prevent back-button loops.
- **Google OAuth Callback:** Removed invalid `supabaseClient.auth.setSession` invocations on server session responses that no longer carry token bodies. Used `window.location.replace` for clean redirect to `/account`.

---

## Sputnik8-Inspired Customer Cancellation & Review Workflow (PR #24)
- **Problem Solved:** Customers had no way to cancel or request cancellation of their bookings before departure (24h/48h window). Additionally, cancellations cannot be automatically approved if they violate the tour's late cancellation policy window.
- **Customer Cancellation Modal (`src/components/modals/CancellationModal.tsx`):**
  - Displays tour title, departure date, real-time countdown to departure (`hoursRemaining`).
  - Evaluates remaining time against `tour.freeCancellationHours` (default 24h).
  - Dynamic policy banner: Green badge when within free cancellation window; Amber warning when inside late cutoff window notifying the traveler that cancellation requires operator approval.
  - Reason selector & optional notes.
- **Public Cancellation API (`src/app/api/public/bookings/cancel-request/route.ts`):**
  - Validates ownership via session or `accessToken`.
  - Calculates `hoursRemaining` and policy compliance.
  - Stores structured request under `bookingAnswers._cancellationRequest` with status `PENDING_REVIEW`.
  - Logs `[SYSTEM]` message in the booking's dedicated `LiveChatConversation` thread.
  - Records an alert in `NotificationLog`.
- **Admin Review API & Dashboard (`src/app/api/admin/bookings/[id]/cancellation/route.ts`):**
  - Integrated into `src/components/admin/BookingQueue.tsx` with prominent `Cancel Req` badge and red alert banner in expanded booking view.
  - Admin has two 1-click actions:
    - **Approve (Cancel):** Sets booking status to `CANCELLED`, marks request as `APPROVED`, logs confirmation to chat, sends customer notification.
    - **Decline:** Keeps booking active, marks request as `DECLINED`, logs review reason to chat.
- **Multi-surface Customer UI:**
  - Available on `/account` (Overview & Bookings tabs), `/my-bookings` (direct card action), and `/booking/[token]`.
  - When cancellation is pending review, the button automatically transforms into a persistent `⏳ Cancellation Pending Review` badge.
