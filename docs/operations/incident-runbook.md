# Incident Runbook & Operational Troubleshooting — Talago Tours

## 1. Critical Production Checks

### A. Customer Stuck on "Loading Telegram Account" or "Loading Talago Account"
1. **Root Cause:** Expired session token, rate-limited Telegram API, or stuck client promise in `account/page.tsx`.
2. **Mitigation:**
   - Watchdog timer in `src/app/(public)/account/page.tsx` forces unblock after 3.5s.
   - Verify `/api/auth/session` returns valid JSON with `credentials: 'same-origin'`.
   - Inspect cookie: `talago_session` must be present with `Path=/; SameSite=Lax; HttpOnly`.

### B. Duplicate Booking on Network Flake
1. **Root Cause:** Client double-tapped or retried submission during latency spike.
2. **Mitigation:**
   - Database `@unique idempotencyKey` in `prisma/schema.prisma` guarantees atomic insertion.
   - `/api/checkout/initialize` catches Prisma error `P2002` and recovers the existing booking.

### C. Dropdowns or Modals Hidden Behind Page Headers
1. **Root Cause:** Z-index stacking context inside parent header (`z-50`).
2. **Mitigation:**
   - Mount overlays using React `createPortal(..., document.body)` with `z-[9999]`.

---

## 2. Emergency Recovery Steps

- **Database Connection Issues:** Check Supabase connection pooling mode (port 6543 for PgBouncer / transaction pooling, port 5432 for direct connection).
- **Vercel Build Failure:** Run `npm run build` locally. Verify `npx tsc --noEmit` reports 0 errors.
