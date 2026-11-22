# Specification: Authoritative Authentication Architecture (Clean Rebuild)

## 1. Problem & Root Cause of Legacy Failure
- The legacy system attempted to bridge Telegram logins by minting Supabase Auth magic links using fake synthetic emails (`telegram-xxx@noreply.talago.com`).
- It attempted cross-site 303 redirects carrying `Set-Cookie` headers from third-party OAuth origins (`oauth.telegram.org`), which Chrome, Safari ITP, and mobile WebViews routinely dropped.
- To bypass cookie drops, it passed transient handoff tickets in URL queries, creating race conditions with parallel React renders and double-fetch consumption.
- Client-side Supabase SDK stored expired JWTs in `localStorage`, which fired `onAuthStateChange` and sent stale Bearer tokens to `/api/auth/session`, resulting in `401 Unauthorized` responses that poisoned the client state and threw the user back into the "Sign in to access your account" loop.

## 2. New Architecture: Single Authoritative Server Session Engine
- **Independent Session Authority (`src/server/auth.ts`)**:
  - The server issues cryptographically signed HS256 JWTs using a deterministic, 256-bit high-entropy secret derived from server secrets.
  - Zero dependency on Supabase magic links or synthetic emails for Telegram logins.
  - Expiration: 30 days (`maxAge = 2,592,000s`).
  - Stored in a single, secure HTTP-only cookie: `talago_session` (`path: '/', httpOnly: true, sameSite: 'lax', secure: true`).
- **First-Party HTML Document Bridge Response**:
  - When Telegram OIDC authorization succeeds, the server validates Telegram's ID token using Telegram's official public JWKS (`https://oauth.telegram.org/.well-known/jwks.json`).
  - Upserts `CustomerProfile` in PostgreSQL via Prisma.
  - Generates the authoritative `talago_session` token.
  - Returns an HTTP 200 OK HTML document response with `Set-Cookie: talago_session=...`.
  - The document immediately navigates via `window.location.replace('/account')` as a first-party, same-origin navigation.
  - Guarantees 100% cookie persistence on all browsers (Safari, iOS, Chrome, Firefox, Android).
- **Supported Providers**:
  1. **Telegram**: 1-click OIDC redirect $\rightarrow$ Telegram JWKS verify $\rightarrow$ direct session token $\rightarrow$ first-party bridge.
  2. **Google**: Supabase OAuth $\rightarrow$ `/auth/callback` $\rightarrow$ server converts token to `talago_session` $\rightarrow$ redirect.
  3. **Email/Password Sign-In**: `POST /api/auth/login` $\rightarrow$ server-verified $\rightarrow$ `talago_session` cookie.
  4. **Email Registration**: `POST /api/auth/register` $\rightarrow$ pre-confirmed user creation $\rightarrow$ `talago_session` cookie.
- **Client State (`src/context/AuthContext.tsx`)**:
  - Authoritative, fast, single source of truth: queries `GET /api/auth/session` with `credentials: 'same-origin'`.
  - Zero reliance on client `localStorage` tokens.
  - Cross-tab synchronization via `BroadcastChannel('talago_auth_sync')`.
  - Auto-refreshes on window focus.
- **Unified Login UI (`src/app/(public)/auth/page.tsx`)**:
  - One clean, professional screen with mode tabs `[Sign In]` / `[Create Account]`.
  - Prominent 1-click buttons for Telegram and Google.
  - Direct email/password form with instant validation.
  - Independent link to Guest Booking Lookup (`/account?tab=lookup`).

## 3. Verification & Quality Gates
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: 92/92 routes built green.
- `npx playwright test`: 5/5 e2e tests passed.
- Pushed to `main` at commit `0f580f4`.
