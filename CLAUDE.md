# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — lint with `next lint`
- `npm run start` — start production server
- `npm run db:generate` — regenerate Prisma client after schema changes
- `npm run db:push` — push Prisma schema to database
- `npm run db:studio` — open Prisma Studio GUI

No test framework is configured.

## Project Structure

Next.js 14 App Router with two route groups under `src/app/`:
- **`(public)/`** — Customer-facing pages: tour catalog, booking flow, checkout, boarding pass, voucher, destinations, about, faq, support, privacy, etc.
- **`(admin)/admin/`** — Admin dashboard sections: bookings, tours, destinations, reviews, notifications, campaigns, operations calendar, analytics, settings
- **`api/`** — API routes (admin/, bookings/, checkout/, payments/, media/, auth/, notifications/, public/)

API routes mirror the page structure and use Prisma directly (no ORM abstraction layer).

Components live in `src/components/` organized by domain:
- **`admin/`** — TourBuilderForm, MediaManager, AnalyticsDashboard, etc.
- **`landing/`** — homepage sections (Hero, TourCatalog, PopularDestinations)
- **`tours/`** — booking flow widgets
- **`checkout/`** — checkout sidebar and price summary
- **`public/`** — shared public components (TourCard, TourGrid, ReviewSection)
- **`ui/`** — generic primitives (Button, CarouselImages, RouteLoader)
- **`modals/`** — modal overlays
- **`vouchers/`** — QR code generator

## Internationalization

Client-side i18n via `LanguageContext` (React Context, no `next-intl` or `i18next`). Locale files in `src/locales/` (en, de, es, fr, it, pl, ru — 7 languages). The Prisma `Tour` and `Destination` models store multilingual content in JSON `translations` fields. Admin pages use `LanguageTabs` components to render per-locale inputs.

## Database

PostgreSQL via Prisma ORM. Schema in `prisma/schema.prisma`. Key models: Tour, Destination, Zone, Booking, Review, Transaction, PromoCode, CustomerProfile, MediaAsset, TourTimeSlot, NotificationLog, SystemSetting, NewsletterSubscription. Supabase client in `src/lib/supabase/client.ts`.

## Coding Conventions

- TypeScript strict mode, `@/*` path alias mapped to `./src/*`
- Tailwind CSS for all styling. Custom colors: `primary-coral` (#FF5B00), `secondary-forest` (#00473F)
- Lucide React for icons
- Server components by default; add `'use client'` only when interactivity (hooks, event handlers) is needed
- Components: PascalCase filenames. Utilities: camelCase. Directories: kebab-case
- Prisma models use `@@map` for snake_case table naming
- Supabase for auth (magic link), image storage, and media uploads (signed URLs)
