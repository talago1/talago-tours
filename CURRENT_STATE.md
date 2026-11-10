# Talago Tours — Current Development State

## System Health & Build Status
- **Next.js:** 14.2.35
- **TypeScript:** Strict Mode (`tsconfig.json: strict: true`), 0 type errors (`npx tsc --noEmit` green)
- **Production Build:** `84/84 pages` compiled successfully with 0 errors
- **Deployment Platform:** Vercel Production (`https://talago-tours.vercel.app`)
- **Active Git Branch:** `feat/p0-auth-fix-chat-refactor` (branching from `main`)

---

## Recent Significant Upgrades (November 9–10, 2026)

### 1. Customer Account Loading & Auth Flow Stability (P0 Resolved)
- **Race Condition Guard:** [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx) uses a `loadingRef` guard to eliminate multiple concurrent calls to `loadData()`.
- **Elimination of Circular Auth Loop:** Removed redundant and recursive `supabaseClient.auth.setSession()` from inside `loadData()`, preventing infinite `SIGNED_IN` event loops that previously caused the account page to remain indefinitely stuck on "Loading account...".
- **Guarded onAuthStateChange:** Only executes `loadData()` if `!loadingRef.current`.

### 2. Streamlined Messaging & Floating WhatsApp Concierge
- **Generic Floating Bubble Removed:** Cleaned up the former floating generic chat popup in [`src/components/layout/LiveChatWidget.tsx`](file:///d:/talago-tours/src/components/layout/LiveChatWidget.tsx).
- **Floating WhatsApp Concierge:** Directly connects travelers to TALAGO Concierge via `getWhatsAppUrl`, with responsive positioning floating above the mobile sticky booking bar on tour detail pages.
- **Per-Booking Scoped Conversations (Sputnik8 Model):** Inquiries and bookings each have their own dedicated conversation via `LiveChatConversation` with `bookingReference` and `leadId` fields. The Admin BookingQueue integrates inline chat for individual bookings, and the customer `/account` page provides per-booking Chat actions.

### 3. Voucher & Boarding Pass Action Strip (Implemented)
- **WhatsApp Concierge 1-Click:** Integrated in [`src/app/(public)/tours/voucher/VoucherContent.tsx`](file:///d:/talago-tours/src/app/(public)/tours/voucher/VoucherContent.tsx), [`src/app/(public)/tours/boarding-pass/BoardingPassContent.tsx`](file:///d:/talago-tours/src/app/(public)/tours/boarding-pass/BoardingPassContent.tsx), and [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx) with pre-filled booking reference and tour name via dynamic `useContactSettings`.
- **Print / PDF Download:** One-click print-optimized voucher and boarding pass download with print CSS rules (`window.print()`).

### 4. Telegram Identity & Phone Number Persistence (Resolved)
- **OIDC Claim Handling:** [`src/app/api/auth/telegram/oidc-callback/route.ts`](file:///d:/talago-tours/src/app/api/auth/telegram/oidc-callback/route.ts) sets `phone: telegramPhone` in addition to `telegramPhone` and `telegramPhoneVerified` on `CustomerProfile`.
- **Supabase User Metadata Sync:** Propagates `phone` to `user_metadata.phone` and the root Supabase user record, guaranteeing client SDK session availability.
- **Widget & Verify Fallbacks:** Both `callback/route.ts` and `verify/route.ts` explicitly persist `telegramId`, `telegramUsername`, and photo.
- **Session Auto-Healing:** `resolveUserProfile` in [`src/app/api/auth/session/route.ts`](file:///d:/talago-tours/src/app/api/auth/session/route.ts) ensures existing Telegram profiles missing `phone` are healed with `telegramPhone`.

### 5. Historical & Cross-Identity Booking Adoption (Resolved)
- **Adoption Engine Unification:** [`src/server/customerBookings.ts`](file:///d:/talago-tours/src/server/customerBookings.ts) updated so that authenticated users claiming verified contacts adopt bookings unconditionally, preventing orphaned guest or shadow profiles from blocking linkage.
- **Same-Day Trip Visibility:** [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx) fixed to use end-of-day timestamp comparisons (`setHours(23, 59, 59, 999)`), ensuring same-day departures remain in `Upcoming Trips` until midnight.

### 6. Marketplace Conversion & Trust Signals
- **Tour Card Trust Badges:** [`src/components/tours/PublicTourCard.tsx`](file:///d:/talago-tours/src/components/tours/PublicTourCard.tsx) renders dynamic pills:
  - 💵 *Pay on Arrival* (when `tour.allowPayAtLocation` is true)
  - 📍 *Hotel Pickup* (when `tour.hotelPickupIncluded` is true)
  - ⚡ *Instant Confirmation* (when `tour.instantConfirmation !== false`)
  - 🛡️ *Free Cancellation* with exact hour window
- **Catalog Query Parity:** [`src/app/(public)/tours/page.tsx`](file:///d:/talago-tours/src/app/(public)/tours/page.tsx) retrieves all required badge attributes from Prisma.

### 7. Guest-to-Member Conversion Hardening
- [`src/app/(public)/tours/checkout/success/CheckoutSuccessContent.tsx`](file:///d:/talago-tours/src/app/(public)/tours/checkout/success/CheckoutSuccessContent.tsx) prevents premature account-linking messages before email verification is complete, syncing cookies authoritatively via `/api/public/my-bookings/link`.
