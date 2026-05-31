# Implementation Plan: Crew Assignment, Fleet Dispatch & Trip Expense Tracker (Feature 013)

## Technical Context

- **Stack**: Next.js App Router, TypeScript, TailwindCSS, Prisma Client (PostgreSQL)
- **Currency Precision**: PostgreSQL Decimal type — eliminates floating-point errors for financial computations
- **Atomic Transactions**: `prisma.$transaction` for all dispatch save operations — guarantees all-or-nothing
- **Multi-Currency**: Static exchange rate config (`config/exchangeRates.ts`) for USD↔EGP conversion
- **Analytics Bridge**: Feature 009 analytics pipeline extended to query TripExpense records for net margin calculation
- **Auth**: Existing admin session middleware — all dispatch endpoints require authentication
- **UI Pattern**: Interactive client component (`"use client"`) with searchable dropdown selects and dynamic tabular input grid

## Constitution Check

### I. Code Quality & Architecture Principles
- ✅ Server-First Mindset: Dispatch data fetched server-side via API route; `"use client"` only for TripDispatcher interactive component
- ✅ Strict Type-Safety: Full TypeScript interfaces for TripDispatchPayload, ExpenseRow, Assignment types; `any` prohibited
- ✅ Zero Tailwind Bloat: Componentized TripDispatcher with reusable dropdown and table row styles
- ✅ Semantic HTML: `<section>`, `<table>`, `<form>` with proper labels and ARIA attributes

### II. Performance Requirements
- ✅ CLS = 0: Expense table with fixed column widths, skeleton placeholder during load (SC-005)
- ✅ LCP ≤ 1.5s: Server-rendered shell, client hydration for interactive parts only
- ✅ Zero Third-Party Animation: Native Tailwind transitions for dropdown open/close, row highlight
- ✅ Media Treatment: No media processing — this is a data-entry interface

### III. UX Consistency & Conversion
- ✅ Coral #FF5B00: Total cost summary card text uses `text-[#FF5B00]` per user requirement
- ✅ Forest #00473F: Success badges on saved dispatch state
- ✅ Fail-Safe: Save button transforms to disabled loading state; network error shows inline alert

### IV. Verification & Testing Standards
- ✅ Atomic DB transaction prevents partial saves (FR-003)
- ✅ Negative amount rejection on expense rows (edge case)
- ✅ Scheduling conflict warnings for double-booked crew/fleet
- ✅ Net margin calculation integrates TripExpense totals into analytics pipeline

**Gate status**: ✅ All checks pass — no violations or unjustified deviations.

## Scope

### In Scope
- `prisma/schema.prisma` — CrewMember, FleetAsset, CrewAssignment, FleetAssignment, TripExpense models
- `src/config/exchangeRates.ts` — Static exchange rate config (if not yet created by Feature 009)
- `src/app/api/admin/operations/dispatch/route.ts` — POST endpoint for atomic dispatch save
- `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts` — GET endpoint for pre-population
- `src/components/admin/TripDispatcher.tsx` — Interactive dispatch center with searchable dropdowns + expense ledger
- `src/app/admin/operations/dispatch/page.tsx` — Admin page hosting TripDispatcher
- `src/app/api/admin/analytics/summary/route.ts` — Extended to include TripExpense in net margin computation

### Out of Scope
- CrewMember/FleetAsset CRUD interfaces (management assumed done via separate admin UI or direct DB)
- Conflict resolution enforcement (warning only — operator can override)
- Bulk dispatch operations (multi-day batch assignment)
- Offline dispatch (requires server for $transaction)
- Email/SMS notifications for assignments

## Milestones

### M1: Prisma Schema Extension
- **File**: `prisma/schema.prisma`
- **Action**: Append CrewMember, FleetAsset, CrewAssignment, FleetAssignment, TripExpense models with UUID PKs, Decimal for amounts, proper indices

### M2: Config & Directory Scaffold
- **Files**: `src/config/exchangeRates.ts`, `src/app/api/admin/operations/dispatch/route.ts`, `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts`
- **Action**: Create exchange rate config, GET and POST dispatch API routes

### M3: TripDispatcher Component
- **Files**: `src/components/admin/TripDispatcher.tsx`, `src/app/admin/operations/dispatch/page.tsx`
- **Action**: Build reactive dispatch interface with searchable crew/fleet assignment grids, dynamic expense ledger table, live total cost summary, save/saved state

### M4: Analytics Bridge
- **Files**: `src/app/api/admin/analytics/summary/route.ts`
- **Action**: Extend analytics endpoint to aggregate TripExpense records per date range, subtract from gross revenue for net margin

### M5: Agent Context Update
- **Files**: `AGENTS.md`
- **Action**: Update plan reference to point to 013-crew-fleet-expense/plan.md

## Dependencies
- Feature 009: Analytics summary route must exist (extended in M4)
- Feature 009: `config/exchangeRates.ts` must exist (created in M2 if missing)
- Admin auth middleware: Must reject unauthenticated requests
- Tour model: Must exist in Prisma schema (created in Feature 001 baseline)

## Risks
- **Analytics route not yet implemented**: Mitigated by analytics route being part of this feature's M4 — implement after base analytics exists from Feature 009.
- **Exchange rate config missing**: Mitigated by creating it in M2 with hardcoded default, falling back to hardcoded rate with warning per spec edge case.
- **Concurrent dispatch saves on same departure**: Mitigated by atomic Prisma $transaction — no partial state.
- **Crew/fleet scheduling conflicts**: Mitigated by advisory warning only — operator can override (per spec assumption).
