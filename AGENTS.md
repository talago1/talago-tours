# AGENTS.md

Talago Tours — Next.js 14 tourism booking platform with public storefront, admin dashboard, and Supabase-backed services.

## Setup commands

- Install deps: `npm install`
- Start dev:    `npm run dev`             # Next.js dev server
- Build:        `npm run build`           # `next build` (production)
- Start:        `npm run start`           # production server
- Lint:         `npm run lint`            # `next lint` (no ESLint config — Next.js defaults)
- DB generate:  `npm run db:generate`     # `prisma generate`
- DB push:      `npm run db:push`         # `prisma db push`
- DB studio:    `npm run db:studio`       # `prisma studio`

No test framework is configured — verify by build + manual smoke (`npm run build` then exercise affected flows).

## Project layout

- `src/app/(public)/`  — customer-facing routes (tours, booking, checkout, boarding pass, voucher, destinations, info pages)
- `src/app/(admin)/admin/` — admin dashboard (bookings, tours, destinations, reviews, notifications, campaigns, operations, analytics, settings)
- `src/app/api/`       — route handlers (admin/, bookings/, checkout/, payments/, media/, auth/, notifications/, public/)
- `src/components/`    — domain-grouped components: `admin/`, `landing/`, `tours/`, `checkout/`, `public/`, `ui/`, `layout/`, `modals/`, `vouchers/`
- `src/lib/`           — shared clients/services (Supabase client, system settings)
- `src/locales/`       — 7 hand-written i18n bundles (en, de, es, fr, it, pl, ru)
- `src/types/`         — shared TypeScript types
- `src/utils/`         — price calculator, booking validation, promo codes, WhatsApp notifications
- `prisma/`            — Prisma schema (PostgreSQL)

## Code style

- TypeScript strict mode (`tsconfig.json: strict: true`); `@/*` path alias → `./src/*`
- Tailwind CSS only — no CSS modules, no styled-components
- Lucide React for icons
- Server components by default; add `'use client'` only when hooks/event handlers are needed
- Components: PascalCase filenames. Utilities: camelCase. Directories: kebab-case
- Prisma models use `@@map` for snake_case table naming
- i18n via hand-written `LanguageContext` + locale files (no `next-intl` / `i18next`); multilingual content lives in JSON `translations` fields on Tour and Destination
- Run `npm run lint` before opening a PR

## Database

- PostgreSQL via Prisma ORM. Schema: `prisma/schema.prisma`
- Key models: Tour, Destination, Zone, Booking, Review, Transaction, PromoCode, CustomerProfile, MediaAsset, TourTimeSlot, NotificationLog, SystemSetting, NewsletterSubscription
- After schema changes: `npm run db:generate` (then `db:push` to apply)

## Testing instructions

- No automated tests configured. Add tests only after introducing a framework — coordinate via PR
- Manual verification: `npm run build` must succeed; smoke-test affected public + admin pages
- All builds must be green before opening a PR (project recently recovered from type errors — see commit `ae92c3c`)

## PR & commit conventions

- Branch from `feature-consolidation` (current working branch) or `main` — never push to a shared branch directly
- Conventional commits: `feat:`, `fix:`, `merge:`, `@ <message>` (see `git log`)
- Keep commits focused on a single concern
- Open PR via `gh pr create` once build is green

## Security

- Never commit secrets — `.env` is in `.gitignore` (and `.env*.local` variants)
- Supabase keys / DB URLs come from environment variables only
- Be cautious with `src/middleware.ts` — auth/redirect logic touches every request
- No telemetry or analytics calls leave the app without an explicit env flag
