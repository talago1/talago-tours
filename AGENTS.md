# AGENTS.md — Talago Tours Engineering Directives

Talago Tours is a high-performance Next.js 14 (App Router) tourism platform with Supabase authentication, PostgreSQL via Prisma ORM, and multi-lingual storefront (8 locales: `en`, `de`, `ru`, `uk`, `fr`, `it`, `pl`, `es`).

---

## 1. Fast Orientation (Never Rescan the Entire Codebase)

Before making any changes, future agents MUST follow this sequence:

1. **Read this file (`AGENTS.md`)** for project invariants and quality gates.
2. **Read `docs/README.md`** to locate the authoritative subsystem documentation.
3. **Check Graphify knowledge graph** (`graphify-out/`):
   - Run `graphify query "<feature or component>"` for scoped dependency exploration.
   - Run `graphify path "<ComponentA>" "<ComponentB>"` for relationship tracing.
4. **Never scan the codebase file-by-file**: Use targeted search, Grep, or Graphify. Do not reinstall existing skills or recreate existing modules.

---

## 2. Core Subsystem Ownership (Single Source of Truth)

Every major responsibility has exactly one canonical owner:

| Responsibility | Canonical Owner | Key Path |
|---|---|---|
| **Authentication State** | Central `AuthContext` + JWT verified server cookie | `src/context/AuthContext.tsx`, `src/app/api/auth/session/route.ts` |
| **Booking Engine** | Unified Booking API + DB unique idempotencyKey | `src/app/api/checkout/initialize/route.ts`, `src/utils/bookingDraftStorage.ts` |
| **UI Components** | Modular Domain Components (`ContinuousBookingModal`, `PublicTourCard`) | `src/components/tours/`, `src/components/landing/` |
| **Taxonomy & Translations** | Canonical destination & category maps | `src/utils/destinationTranslations.ts`, `src/locales/` |
| **Database Access** | Authoritative Prisma client & schema | `src/lib/prisma.ts`, `prisma/schema.prisma` |
| **Notification Center** | Portal-mounted notification component (`z-[9999]`) | `src/components/admin/AdminNotificationCenter.tsx` |

**Rules:**
- **Never create competing duplicate booking or auth engines.**
- **Never invent fields** that do not exist in `prisma/schema.prisma`.
- **Never bypass server-side validation or idempotency.**

---

## 3. Standard Commands & Quality Gates

Run these commands to verify changes:

- **Type Check:** `npx tsc --noEmit` (Must be 0 errors)
- **Production Build:** `npm run build` (All 93+ routes must be green)
- **End-to-End Tests:** `npx playwright test` (Must pass without failures)
- **Prisma DB Sync:** `npx prisma db push` (Only after verifying schema changes)
- **Graphify Update:** `graphify update .` (After modifying code)

---

## 4. Code Standards & Patterns

- **Language:** TypeScript Strict (`strict: true`), `@/*` alias for `./src/*`.
- **Styling:** Tailwind CSS only. Use design tokens defined in `src/styles/` or standard Tailwind classes.
- **Components:** Server Components by default; add `'use client'` only when interactive state, hooks, or browser events are required.
- **Data Fetching:** Server-side queries where possible; API routes for client mutations.
- **Idempotency:** All payment and reservation initialization requests must submit and enforce an `idempotencyKey`.
- **Localization:** 8 supported locales (`en`, `de`, `es`, `fr`, `it`, `pl`, `ru`, `uk`). Always test that non-English languages do not leak hardcoded English strings.

---

## 5. Security & Data Protection

- **Production Data is Sacred:** Never delete real customer accounts, bookings, transactions, or reviews.
- **Fail-Closed Auth:** Server-side API routes must verify JWT or session tokens before exposing customer or admin data.
- **Secrets:** Never commit `.env` or API keys. Always use environment variables.

---

## 6. Documentation Index

Detailed engineering documentation is organized under `docs/`:
- `docs/README.md` — Master documentation index.
- `docs/architecture/` — System architecture, authentication, booking, and database specifications.
- `docs/development/` — Developer setup, TDD workflow, and debugging guides.
- `docs/operations/` — Deployment, migrations, email, and incident runbooks.
- `docs/design-system/` — Visual philosophy, design tokens, and UI/UX guidelines.
- `docs/archive/` — Historical project audits, closure reports, and legacy roadmaps.
