# Specification: Unified Customer Authentication Architecture

## 1. Existing Behavior and Actual Problem
- **Problem**: Telegram OIDC callback, Supabase Auth, and browser cookies frequently desynchronize. In cross-site redirects (e.g. `oauth.telegram.org` -> `/api/auth/telegram/oidc-callback` -> `/account`), browsers enforce strict cookie boundaries, dropping `talago_session` cookies.
- Stale tokens in client `localStorage` (`sb-*-auth-token`) poison incoming requests, repeatedly sending invalid JWTs to `/api/auth/session`, triggering `401 Unauthorized` in DevTools and trapping users in login loops.
- Redundant intermediate routes (`/login`, `/auth/callback`, `/auth/telegram-success`) created split auth states and confusing redirection chains.

## 2. Desired Behavior
- **One Direct Auth Entry Point**: `/auth` is the single authoritative login and registration page offering immediate choice (Google, Telegram, Email Login, Email Register) without intermediary bounce screens.
- **Fail-Safe Server Session**: The server is the sole source of truth. Valid sessions emit HTTP-only, SameSite=Lax, Secure cookies (`talago_session`, `talago_refresh`).
- **Single-Use Ticket Handoff**: For cross-site OAuth redirects, a short-lived (2-minute) one-time ticket is generated, allowing the destination page (`/account` or `returnTo`) to execute a first-party, same-origin POST request to sync the session and client storage without cookie loss.
- **Auto-Eviction of Stale Tokens**: When the server reports unauthenticated, the client immediately purges stale localStorage tokens via `supabaseClient.auth.signOut()` to eliminate poisoned retry loops.
- **No Infinite Loops**: No redirects to `/login` or `/auth` if already authenticated; safe `returnTo` validation.

## 3. Source-of-Truth Data and Module Ownership
- **Canonical Server Identity**: `src/server/customerSession.ts` (`resolveRequestUser`, `applySessionCookies`, `setServerSessionCookies`, `createAuthTicket`, `consumeAuthTicket`).
- **Canonical API Endpoints**:
  - `GET /api/auth/session` (checks cookie & bearer, returns session payload without 401).
  - `POST /api/auth/session` (consumes ticket or syncs tokens, returns 200 payload, clears stale cookies on invalid).
  - `POST /api/auth/logout` (destroys cookies and invalidates session).
- **Canonical Client State**: `src/context/AuthContext.tsx` (`useAuth()`).
- **Single Auth Page**: `src/app/(public)/auth/page.tsx`.

## 4. User Journeys & Acceptance Criteria
1. **Telegram Login**: Traveler clicks "Telegram" on `/auth` -> redirected to Telegram OAuth -> confirms -> returns to `/api/auth/telegram/oidc-callback` -> server creates session & ticket -> redirects to `/account?auth_ticket=...` -> client immediately syncs -> traveler profile loads with name and photo -> URL parameter cleaned.
2. **Email Login/Register**: Traveler enters credentials on `/auth` -> authenticated via Supabase -> session synced to `/api/auth/session` -> redirected to `/account`.
3. **Session Persistence**: Page refresh on `/account` retains traveler name, phone, bookings, and unread notification counts without flashing unauthenticated screens.
4. **Clean Logout**: Traveler clicks "Sign Out" -> cookies cleared on server, localStorage cleared on client -> redirected to `/`.

## 5. Required APIs and Database Relationships
- Models: `CustomerProfile` (fields: `id`, `email`, `name`, `phone`, `telegramId`, `telegramUsername`, `telegramPhotoUrl`, `telegramPhoneVerified`, `isShadow`).
- Handlers: `/api/auth/telegram/authorize`, `/api/auth/telegram/oidc-callback`, `/api/auth/session`, `/api/auth/logout`.

## 6. Validation and Security Requirements
- PKCE with SHA-256 for Telegram OIDC.
- Constant-time state comparison to prevent CSRF.
- HTTP-only, SameSite=Lax cookies with Secure flag in production.
- Safe path validation rejecting open redirects.

## 7. Required Tests
- `e2e/auth-booking-notifications.spec.ts`: Verification of direct `/auth` navigation, no redirect loops, and server session verification.
- Unit testing of ticket creation and single-use consumption.

## 8. Dependencies & Implementation Order
- Foundation of all customer interactions (Profile, Bookings, Reviews, Chat).
- Must be verified before resetting customer test data or releasing checkout.
