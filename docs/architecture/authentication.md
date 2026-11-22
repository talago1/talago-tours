# Talago Tours — Authentication & Session Architecture

## 1. Authentication Strategies

Talago supports three primary authentication channels for customers:

1. **Telegram Login (OIDC PKCE):**
   - Standard OpenID Connect flow using Telegram bot authorization.
   - Generates a verified synthetic email `telegram-<id>@noreply.talago.com`.
   - Syncs Telegram photo URL, username, and verified phone number into `CustomerProfile`.
2. **Google OAuth (Supabase Auth):**
   - Direct OAuth redirect with offline access to retrieve name and email.
   - Redirects to `/auth/callback?next=/account`.
3. **Email (Magic Link / Password):**
   - Passwordless magic link sent via Brevo / Supabase Auth.
   - Optional password mode for existing registered users.

---

## 2. Session Architecture & Persistence (`src/server/customerSession.ts`)

To avoid race conditions and client SDK cold-start delays, session validation uses a **dual-path resolution pattern**:

```
Client Request
      │
      ├─► Cookie: talago_session (JWT, httpOnly, 7 days)
      │      └─► Validated against Supabase Admin getUser(token)
      │
      ├─► Header: Authorization: Bearer <token>
      │      └─► Used as secondary fallback if cookie absent
      │
      └─► Cookie: talago_refresh (Refresh Token, httpOnly, 30 days)
             └─► Auto-refreshes session silently if access token expired
```

### Key Principles:
1. **Cookie Identity Supremacy:** The `talago_session` cookie is authoritative. A stale bearer token in browser memory cannot override an active cookie session.
2. **Auto-Refresh:** When `talago_session` expires, the server uses `talago_refresh` to mint a fresh token seamlessly without logging the customer out.
3. **Client SDK Hydration:** Whenever `/api/auth/session` is fetched, the frontend synchronizes `supabaseClient.auth.setSession(...)` to ensure client libraries and realtime channels share the credentials.

---

## 3. Customer Profile Resolution & Adoption (`src/server/customerBookings.ts`)

### Profile Types:
- **Verified Member Profile (`isShadow: false`):** Created when a customer signs up or logs in via Google, Telegram, or Email.
- **Shadow Profile (`isShadow: true`):** Created during checkout when a guest books without being logged in. Holds their name, email, and phone.

### Adoption Engine (`adoptOwnedBookings`):
When a member logs in, visits `/account`, or completes checkout, the system automatically runs adoption:
1. Gathers all email variants (e.g. `user.email`, `guest-<phone>@noreply.talago.com`).
2. Gathers normalized phone keys via `phoneMatchKey` (`01...`, `+20...`).
3. Searches all bookings and booking leads matching these identifiers.
4. If a matching booking belongs to `null` or a shadow profile, its `customerProfileId` is updated to the member's profile ID.
5. Preserves data integrity: bookings already claimed by a different verified member are never overwritten.

---

## 4. Manual Guest Booking Claim (`POST /api/public/my-bookings/link`)
Authenticated customers can manually link past guest bookings inside `/account`:
- **Input:** `{ bookingReference: "TAL-12345678", phone: "010..." }`.
- **Validation:** Rate-limited (10 requests / 10 min), verifies `phonesEquivalent(booking.customerPhone, providedPhone)`.
- **Action:** Reassigns `booking.customerProfileId = profile.id` and syncs the customer's phone if missing.

