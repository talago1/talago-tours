# Implementation Plan: Operations Calendar & Daily Tour Manifest (Feature 011)

## Technical Context

- **Stack**: Next.js App Router, TypeScript, TailwindCSS (print-friendly), Prisma Client (PostgreSQL)
- **Database**: PostgreSQL via Prisma — Booking model extended with `roomNumber`
- **Data Flow**: Prisma query → server-side grouping → JSON response → client render
- **State**: URL search params (`?date=YYYY-MM-DD`) as source of truth
- **Filtering**: Client-side JavaScript native text matching
- **Print**: Tailwind `print:` utility modifiers
- **Auth**: Existing admin middleware — no new auth mechanism
- **Calendar**: React client component with native HTML date interactions

## Constitution Check

### I. Code Quality & Architecture Principles
- ✅ Server-First Mindset: Manifest data fetching via RSC/server endpoint; `"use client"` only for calendar header and manifest sheet with interactivity
- ✅ Strict Type-Safety: TypeScript interfaces for ManifestItem, DailyTourManifest, API responses (spec provided)
- ✅ Zero Tailwind Bloat: Componentized OperationsCalendarHeader, DailyManifestSheet with reusable styles
- ✅ Semantic HTML: `<main>`, `<table>`, `<section>` for manifest layout

### II. Performance Requirements
- ✅ CLS = 0: Skeleton placeholders during fetch (FR-011)
- ✅ LCP ≤ 1.5s: Manifest loads in under 3s for 200 bookings (SC-001)
- ✅ Zero Third-Party Animation: Native Tailwind transitions for calendar switch
- ✅ Print: `print:` modifiers only — no custom CSS

### III. UX Consistency & Conversion
- ✅ Coral #FF5B00: Calendar departure badge indicators per FR-002
- ✅ Fail-safe: Error state with retry button (Edge Cases)

### IV. Verification & Testing Standards
- ✅ Manifest display validation: grouped by tour type, all columns present
- ✅ Filter resilience: client-side search over 200+ rows instant

**Gate status**: ✅ All checks pass — no violations or unjustified deviations.

## Scope

### In Scope
- RoomNumber field on Booking model + migration
- `utils/manifestQueryBuilder.ts` — date-indexed Prisma query helpers
- GET /api/admin/operations/manifest endpoint (server-side grouping, admin auth)
- `components/admin/OperationsCalendarHeader.tsx` — date strip with URL sync
- `components/admin/DailyManifestSheet.tsx` — manifest grid with search + print
- Tour type filter toggle
- Passenger name + hotel name client-side search
- Skeleton loading states
- Error state with retry
- Printable manifest sheet (A4)

### Out of Scope
- Mobile responsive layout (desktop-only per spec)
- Write/edit operations from manifest (read-only)
- Booking creation or modification
- Image/photo display in manifest

## Milestones

### M1: Database Extension
- **Files**: `prisma/schema.prisma`
- **Action**: Add optional `roomNumber` field to Booking model

### M2: Backend Query & API
- **Files**: `utils/manifestQueryBuilder.ts`, `src/app/api/admin/operations/manifest/route.ts`
- **Action**: Prisma query helper + GET endpoint with auth, date param, server-side grouping

### M3: Calendar Header
- **Files**: `src/components/admin/OperationsCalendarHeader.tsx`
- **Action**: Date strip selector with Coral departure badges, weekly/monthly toggle, URL sync

### M4: Manifest Sheet
- **Files**: `src/components/admin/DailyManifestSheet.tsx`
- **Action**: Manifest grid with grouped sections, search input, tour type filter, print styles

### M5: Admin Page Integration
- **Files**: `src/app/admin/operations/page.tsx`
- **Action**: Admin operations page composing CalendarHeader + DailyManifestSheet

### M6: Agent Context Update
- **Files**: `AGENTS.md`
- **Action**: Update plan reference to point to 011-operations-calendar-manifest/plan.md

## Dependencies
- Feature 006-009: Booking model must exist with all extension fields (status, paymentStatus, isCheckedIn, channel)
- Prisma schema migration: Database must be running + migration applied
- Admin auth middleware: Must reject unauthenticated requests

## Risks
- **Large date ranges for calendar badges**: Mitigated by single aggregated count query per date range
- **Print formatting on different browsers**: Margins may vary — standardize with Tailwind `print:` utilities
- **Missing room numbers**: Handled with "—" display fallback
