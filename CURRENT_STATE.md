# Talago Tours — Current Development State

## System Health & Build Status
- **Next.js:** 14.2.35
- **TypeScript:** Strict Mode (`tsconfig.json: strict: true`), 0 type errors (`npx tsc --noEmit` green)
- **Production Build:** `84/84 pages` compiled successfully with 0 errors
- **Deployment Platform:** Vercel Production (`https://talago-tours.vercel.app`)
- **Active Git Branch:** `main`

---

## Recent Significant Upgrades (November 9–10, 2026)

### 1. Telegram Identity & Phone Number Persistence (Resolved)
- **OIDC Claim Handling:** [`src/app/api/auth/telegram/oidc-callback/route.ts`](file:///d:/talago-tours/src/app/api/auth/telegram/oidc-callback/route.ts) now sets `phone: telegramPhone` in addition to `telegramPhone` and `telegramPhoneVerified` on `CustomerProfile`.
- **Supabase User Metadata Sync:** Propagates `phone` to `user_metadata.phone` and the root Supabase user record, guaranteeing client SDK session availability.
- **Widget & Verify Fallbacks:** Both `callback/route.ts` and `verify/route.ts` explicitly persist `telegramId`, `telegramUsername`, and photo.
- **Session Auto-Healing:** `resolveUserProfile` in [`src/app/api/auth/session/route.ts`](file:///d:/talago-tours/src/app/api/auth/session/route.ts) ensures existing Telegram profiles missing `phone` are healed with `telegramPhone`.

### 2. Historical & Cross-Identity Booking Adoption (Resolved)
- **Adoption Engine Unification:** [`src/server/customerBookings.ts`](file:///d:/talago-tours/src/server/customerBookings.ts) updated so that authenticated users claiming verified contacts adopt bookings unconditionally, preventing orphaned guest or shadow profiles from blocking linkage.
- **Same-Day Trip Visibility:** [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx) fixed to use end-of-day timestamp comparisons (`setHours(23, 59, 59, 999)`), ensuring same-day departures remain in `Upcoming Trips` until midnight.

### 3. Voucher & Account Action Strip (Implemented)
- **WhatsApp Concierge 1-Click:** Integrated in [`src/app/(public)/tours/voucher/VoucherContent.tsx`](file:///d:/talago-tours/src/app/(public)/tours/voucher/VoucherContent.tsx) and [`src/app/(public)/account/page.tsx`](file:///d:/talago-tours/src/app/(public)/account/page.tsx) with pre-filled booking reference and tour name via dynamic `useContactSettings`.
- **Print / PDF Download:** One-click print-optimized voucher download with print CSS rules (`window.print()`).

### 4. Marketplace Conversion & Trust Signals
- **Tour Card Trust Badges:** [`src/components/tours/PublicTourCard.tsx`](file:///d:/talago-tours/src/components/tours/PublicTourCard.tsx) renders dynamic pills:
  - 💵 *Pay on Arrival* (when `tour.allowPayAtLocation` is true)
  - 📍 *Hotel Pickup* (when `tour.hotelPickupIncluded` is true)
  - ⚡ *Instant Confirmation* (when `tour.instantConfirmation !== false`)
  - 🛡️ *Free Cancellation* with exact hour window
- **Catalog Query Parity:** [`src/app/(public)/tours/page.tsx`](file:///d:/talago-tours/src/app/(public)/tours/page.tsx) retrieves all required badge attributes from Prisma.

### 5. Guest-to-Member Conversion Hardening
- [`src/app/(public)/tours/checkout/success/CheckoutSuccessContent.tsx`](file:///d:/talago-tours/src/app/(public)/tours/checkout/success/CheckoutSuccessContent.tsx) prevents premature account-linking messages before email verification is complete, syncing cookies authoritatively via `/api/public/my-bookings/link`.

### 6. Permanent Reference & Knowledge Base
- Created [`SPUTNIK8_REFERENCE.md`](file:///d:/talago-tours/SPUTNIK8_REFERENCE.md) covering Sputnik8's 4-step booking funnel, phone-first registration, guest auto-account creation, and mobile UX.
- Knowledge graph synchronized via Graphify.
