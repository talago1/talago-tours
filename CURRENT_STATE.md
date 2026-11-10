# Talago Tours — Current Development State

## System Health & Build Status
- **Next.js:** 14.2.35
- **TypeScript:** Strict Mode (`tsconfig.json: strict: true`), 0 type errors (`npx tsc --noEmit` green)
- **Production Build:** `84/84 pages` compiled successfully with 0 errors
- **Lint:** `npm run lint` green (0 errors)
- **Deployment Platform:** Vercel Production (`https://talago-tours.vercel.app`)
- **Active Git Branch:** `feat/sputnik8-strict-customer-rebuild` (branching from `main`)

---

## Recent Significant Upgrades (November 10, 2026 — Sputnik8 Strict Rebuild)

### 1. Unified Telegram Identity & Booking Adoption
- **Identity Merging:** In [`src/app/api/auth/telegram/oidc-callback/route.ts`](file:///d:/talago-tours/src/app/api/auth/telegram/oidc-callback/route.ts), profile resolution first matches `telegramId`, then attempts matching by verified `phone`. If a profile with the same phone already exists (e.g. from a guest booking), the Telegram identity merges into it instead of creating a conflicting duplicate profile.
- **Immediate Booking Adoption:** The callback immediately executes `adoptOwnedBookings` with synthetic email and verified phone variants, linking all historical guest bookings directly into the account.
- **Widget & Callback Parity:** Both [`src/app/api/auth/telegram/verify/route.ts`](file:///d:/talago-tours/src/app/api/auth/telegram/verify/route.ts) and [`src/app/api/auth/telegram/callback/route.ts`](file:///d:/talago-tours/src/app/api/auth/telegram/callback/route.ts) also call `adoptOwnedBookings`.

### 2. Profile Sync & Cross-Identity Auto-Healing
- **Full-Profile Adoption in Session Handler:** In [`src/app/api/auth/session/route.ts`](file:///d:/talago-tours/src/app/api/auth/session/route.ts), both POST and PATCH handlers call `adoptOwnedBookings` for all known emails and phones.
- **Missing Phone Prompt:** In [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx), when a user logged in without a phone (e.g. Telegram scope without phone permission), a prominent "Add phone number to link your bookings" button opens the profile edit drawer to save the phone and trigger immediate adoption.

### 3. Sputnik8-Model Booking-Centered Messaging Architecture
- **Elimination of "General Concierge" Mixed Chat:** Removed the generic concierge channel button from `/account`. Conversations are strictly scoped per confirmed booking (`bookingReference`) or tour inquiry lead (`lead:${leadId}`).
- **Zero On-Mount Generic Polling:** Removed aggressive background calls to `fetchChatMessages()` on initial page load, preventing anonymous session cookie creation and conversation contamination.
- **Inquiry-to-Booking Progression:** In `/account` Bookings tab, reservation and inquiry cards now feature a direct "Book Tour" CTA linking directly to `/tours/[slug]` with date pre-filled alongside the dedicated inquiry chat button.
- **Server-Authoritative Inquiry Pre-fill:** In [`src/components/modals/AskQuestionModal.tsx`](file:///d:/talago-tours/src/components/modals/AskQuestionModal.tsx), user credentials (name, email, phone) are fetched authoritatively from `/api/auth/session` with client Supabase session fallback.

### 4. Auth Navigation & Loop Elimination
- **Session Check Hygiene:** [`src/app/(public)/auth/page.tsx`](file:///d:/talago-tours/src/app/(public)/auth/page.tsx) uses `window.location.replace` instead of `window.location.href`, preventing back-button traps and eliminating dead `supabaseClient.auth.setSession` attempts on GET responses.
