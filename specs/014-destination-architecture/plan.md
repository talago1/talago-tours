# Implementation Plan: Dynamic Multi-Destination Architecture Upgrade (Feature 014)

## Technical Context

- **Stack**: Next.js App Router, TypeScript, TailwindCSS, Prisma Client (PostgreSQL)
- **Slug Generation**: Client-side + server-side lowercasing, regex tokenization, hyphenation — deterministic and validated
- **Schema Migration**: Relational PostgreSQL with `onDelete: Restrict` constraint — prevents orphaned tours
- **UI Components**: Client-side `"use client"` for DestinationManager searchable grid and DestinationSelect dropdown
- **Auth**: Existing admin session middleware — all destination endpoints require authentication
- **Downstream Integration**: Feature 009 analytics and Feature 011 manifest extended with optional `destinationId` query param filter

## Constitution Check

### I. Code Quality & Architecture Principles
- ✅ Server-First Mindset: Destination grid and selector data fetched server-side via API route; `"use client"` only for interactive DestinationManager and DestinationSelect components
- ✅ Strict Type-Safety: Full TypeScript interfaces for Destination, DestinationFormData, API responses; `any` prohibited
- ✅ Zero Tailwind Bloat: Componentized DestinationManager grid cards and DestinationSelect dropdown with reusable styles
- ✅ Semantic HTML: `<nav>`, `<section>`, `<form>`, `<dialog>` for CRUD interactions, `<ul>`/`<li>` for grid cards

### II. Performance Requirements
- ✅ CLS = 0: Destination grid cards with fixed aspect ratio placeholders (SC-005), loading skeleton matching card dimensions
- ✅ LCP ≤ 1.5s: Server-rendered destination list, client hydration for search/filter interaction only
- ✅ Zero Third-Party Animation: Native Tailwind transitions for card hover states and dropdown open/close
- ✅ Media Treatment: Thumbnail uploads use existing WebP compression pipeline (Feature 001/010)

### III. UX Consistency & Conversion
- ✅ Coral #FF5B00: Add destination CTA button, primary action prompts
- ✅ Forest #00473F: Destination cards with tour count badges
- ✅ Fail-Safe: Save button disabled loading state; form validation before submit; duplicate slug inline error

### IV. Verification & Testing Standards
- ✅ Slug uniqueness enforced at DB level (unique constraint) and API level (duplicate error)
- ✅ Restricted delete prevents data loss (onDelete: Restrict)
- ✅ Downstream filter by destinationId — backward compatible when param absent
- ✅ Dropdown filter latency < 200ms (SC-002)

**Gate status**: ✅ All checks pass — no violations or unjustified deviations.

## Scope

### In Scope
- `prisma/schema.prisma` — Destination model + Tour.destinationId field with relation + index
- `src/app/api/admin/destinations/route.ts` — GET (alphabetical list) + POST (create with auto-slug)
- `src/app/api/admin/destinations/[id]/route.ts` — PUT (update name/image) + DELETE (restricted)
- `src/components/admin/DestinationManager.tsx` — CRUD grid with cards, add/edit/delete actions, thumbnail upload
- `src/components/ui/DestinationSelect.tsx` — Searchable dropdown for Tour Builder, loading/empty states
- `src/app/admin/destinations/page.tsx` — Admin page hosting DestinationManager
- Tour Builder forms (Feature 002/003) — Replace static city input with DestinationSelect
- `src/app/api/admin/analytics/summary/route.ts` — Accept optional `destinationId` query param
- Feature 011 manifest pipeline — Accept optional `destinationId` filter

### Out of Scope
- Public-facing destination pages (admin-only management)
- Bulk destination import (CSV/JSON)
- Destination-specific landing pages for the public site
- Multi-language destination names (single name per destination)
- Tour reassignment on destination delete (restricted delete prevents this)

## Milestones

### M1: Prisma Schema & Database
- **File**: `prisma/schema.prisma`
- **Action**: Add Destination model (id, name, slug @unique, imageUrl?, createdAt, updatedAt), add destinationId String + relation + index to Tour, run migration

### M2: Destination Admin API
- **Files**: `src/app/api/admin/destinations/route.ts`, `src/app/api/admin/destinations/[id]/route.ts`
- **Action**: GET alphabetical list, POST create with auto-slug, PUT update name/image with slug regeneration, DELETE with restricted check

### M3: DestinationManager Component
- **Files**: `src/components/admin/DestinationManager.tsx`, `src/app/admin/destinations/page.tsx`
- **Action**: Card grid layout, add/edit modal forms, thumbnail upload via existing pipeline, delete confirmation, slug preview

### M4: DestinationSelect Component
- **Files**: `src/components/ui/DestinationSelect.tsx`, Tour Builder form files (Feature 002/003)
- **Action**: Searchable dropdown fetching from GET endpoint, filter-as-you-type, loading skeleton, pre-population on edit

### M5: Downstream Filter Integration
- **Files**: `src/app/api/admin/analytics/summary/route.ts`, Feature 011 manifest query builder
- **Action**: Accept optional `destinationId` query param in analytics and manifest, pass through to Prisma WHERE clause on Tour.destinationId

### M6: Agent Context Update
- **Files**: `AGENTS.md`
- **Action**: Update plan reference to point to 014-destination-architecture/plan.md

## Dependencies
- Feature 001/010: Media upload pipeline for thumbnail images
- Feature 009: Analytics summary route (extended in M5)
- Feature 011: Daily manifest route (extended in M5)
- Feature 002/003: Tour Builder form (updated in M4 with DestinationSelect)
- Admin auth middleware: Must reject unauthenticated requests

## Risks
- **Existing Tour Builder uses hardcoded city input**: Mitigated by adding DestinationSelect as a drop-in replacement — the existing form structure is preserved, only the input field changes.
- **Destination used by tours cannot be deleted**: Mitigated by restricted delete + clear error message — expected behavior per spec.
- **Slug regeneration on edit could break existing URLs**: Mitigated by slug being used for admin filtering only (not public URLs) — no external links to break.
- **Analytics/manifest endpoints not yet implemented**: Mitigated by M5 assuming those endpoints exist — if not, the changes are additive query params that default to no-op.
