# Implementation Plan: Media Organizer (Feature 010)

## Technical Context

- **Stack**: Next.js App Router, TypeScript, TailwindCSS, Prisma Client (PostgreSQL)
- **Storage**: Supabase Storage (Feature 001) — MediaAsset records reference existing uploads
- **Database**: PostgreSQL via Prisma — new MediaAsset model with FK to Tour
- **Drag-and-drop**: Native HTML5 — no third-party libraries (per constitution §II)
- **Auth**: Existing admin middleware — no new auth mechanism
- **API**: Next.js App Router route handlers — POST reorder, DELETE asset
- **Optimistic updates**: Client-side state array with rollback on API failure

## Constitution Check

### I. Code Quality & Architecture Principles
- ✅ Server-First Mindset: Data fetching via RSC for grid load; `"use client"` only for drag/delete interactions
- ✅ Strict Type-Safety: Full TypeScript interfaces for MediaAsset, reorder payloads, API responses
- ✅ Zero Tailwind Bloat: Componentized MediaCard, MediaOrganizer with reusable styles
- ✅ Semantic HTML: `<main>`, `<section>`, `<article>` for grid structure

### II. Performance Requirements
- ✅ CLS = 0: Fixed aspect-square containers prevent layout shift
- ✅ LCP ≤ 1.5s: Next.js Image priority loading for visible images
- ✅ Zero Third-Party Animation: Native Tailwind transitions for drag states
- ✅ Media Treatment: Assets pre-compressed via Feature 001 WebP pipeline

### III. UX Consistency & Conversion
- ✅ Coral #FF5B00: Drag ghost overlay border (spec FR-003)
- ✅ Red #DC2626: Delete button (spec FR-007)

### IV. Verification & Testing Standards
- ✅ Drag-drop reorder validation: optimistic update + server confirm
- ✅ Edge-case resilience: network failure toast + retry, concurrent delete handling

**Gate status**: ✅ All checks pass — no violations or unjustified deviations.

## Scope

### In Scope
- MediaAsset Prisma model + migration
- POST /api/admin/media/reorder endpoint (atomic transaction)
- DELETE /api/admin/media/[id] endpoint (atomic delete + renumber)
- MediaOrganizer client component (drag-drop grid)
- MediaCard client component (thumbnail, drag handle, delete button)
- Tour-scoped media grid view
- Optimistic UI updates with rollback
- Error toast on network failure

### Out of Scope
- Image upload (handled by Feature 001)
- Global "all images" view (tour-scoped only per spec)
- Image editing/cropping
- Bulk operations (multi-select, batch delete)
- Image search/filter

## Milestones

### M1: Database Entity & Migration
- **Files**: `prisma/schema.prisma`
- **Action**: Append MediaAsset model with @id, filename, filePath, displayOrder, tourId, mimeType, createdAt, updatedAt
- **Details**: UUID id, CUID FK to Tour, cascade delete, @@index([tourId])

### M2: Reorder API Endpoint
- **Files**: `src/app/api/admin/media/reorder/route.ts`
- **Action**: POST handler accepting `{ tourId: string, orderedAssetIds: string[] }`
- **Details**: Admin auth check, prisma.$transaction updating displayOrder sequentially, error handling

### M3: Delete API Endpoint
- **Files**: `src/app/api/admin/media/[id]/route.ts`
- **Action**: DELETE handler accepting asset ID from route params
- **Details**: Admin auth check, delete record, renumber remaining within transaction

### M4: MediaOrganizer Component
- **Files**: `src/components/admin/MediaOrganizer.tsx`
- **Action**: Client component with responsive grid, drag-drop handlers, state management
- **Details**: `grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4`, native HTML5 events, optimistic updates

### M5: MediaCard Component
- **Files**: `src/components/admin/MediaCard.tsx`
- **Action**: Individual image card with drag handle, hover overlay, delete button
- **Details**: `aspect-square relative rounded-xl border overflow-hidden group`, Coral drag state, red delete button

### M6: Agent Context Update
- **Files**: `AGENTS.md`
- **Action**: Update plan reference to point to 010-media-organizer/plan.md

## Dependencies
- Feature 001: Supabase storage bucket + upload flow must exist
- Prisma schema migration: Database must be running + migration applied
- Admin auth middleware: Must reject unauthenticated requests

## Risks
- **Concurrent drag operations**: Browser prevents multi-drag natively — low risk
- **Network failure during reorder**: Handled by optimistic UI + error toast + retry
- **Concurrent delete from multiple admins**: Second delete returns 404 — handled gracefully
- **Large image payloads**: Thumbnails via Supabase transforms — acceptable for <50 images
