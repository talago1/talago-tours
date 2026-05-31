# Implementation Plan: Media & Storage Engine

**Branch**: `001-media-storage-engine` | **Date**: 2026-05-30 | **Spec**: `specs/001-media-storage-engine/spec.md`

**Input**: Feature specification from `specs/001-media-storage-engine/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build an admin drag-and-drop image uploader for TALAGO tours that compresses images to WebP on the client side (1920px max, quality 0.80), uploads them securely to Supabase Storage via time-limited signed URLs, renders previews in a Viator-style asymmetric grid (1 large cover + 4 smaller cards), and manages cover designation and removal all within local React state before persisting the final URL array.

## Technical Context

**Language/Version**: TypeScript 5.4+, Node.js 20+

**Primary Dependencies**: Next.js 14 (App Router), `@supabase/supabase-js`, `@prisma/client`, React 18

**Storage**: PostgreSQL (via Prisma ORM for Tour data), Supabase Storage bucket `talago-tour-media` (for image files)

**Testing**: Jest + React Testing Library (component tests), Playwright (integration/E2E)

**Target Platform**: Web — modern browsers (Chrome, Firefox, Safari, Edge) with HTML5 Canvas support

**Project Type**: Web application (Next.js App Router with `src/` directory convention)

**Performance Goals**:
- Image previews render within 2 seconds of file selection
- WebP compression at quality factor 0.80, max output width 1920px
- Signed URL generation completes in under 500ms
- Individual upload progress reported per-image in real time

**Constraints**:
- Strict LTR layout only
- TypeScript `any` type prohibited
- Zero server-side image processing — all compression on client device
- Zero third-party animation libraries — native Tailwind transitions only
- Semantic HTML tags (`<main>`, `<section>`, `<article>`)
- Max pre-compression file size threshold: 10MB (files exceeding this are rejected before Canvas processing)
- Signed upload URLs valid for 60 seconds

**Scale/Scope**: Admin panel feature for up to 20 images per tour, single concurrent admin user editing tours

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Mandatory Gates

| Gate | Source | Status | Rationale |
|------|--------|--------|-----------|
| Strict Type-Safety (no `any`) | Constitution §I | ✅ PASS | All interfaces strictly typed; `any` prohibited |
| Server-First Mindset | Constitution §I | ✅ PASS | Only the MediaManager component uses `"use client"`; API route is server-only |
| Zero Tailwind Bloat | Constitution §I | ✅ PASS | Logical grid layout (`grid-cols-4`), hover transitions via `transition-opacity duration-300`, componentized ImageCard |
| Semantic HTML | Constitution §I | ✅ PASS | Uses `<section>`, native `<img>`, semantic buttons |
| Core Web Vitals — CLS = 0 | Constitution §II | ✅ PASS | Predetermined aspect ratios (`aspect-[4/3]`) on all image placeholders |
| Media Treatment — WebP | Constitution §II | ✅ PASS | All uploaded images converted to WebP on client before transmission |
| Zero Animation Bloat | Constitution §II | ✅ PASS | Only native Tailwind transitions (`transition-all duration-300`, `animate-pulse`) |
| Conversion Palette | Constitution §III | ✅ PASS | Cover marker uses `primary-coral` (`#FF5B00`); badge uses `bg-secondary-forest` |
| Fail-Safe Forms | Constitution §III | ✅ PASS | Phase 1 data-model confirms failure transitions remove assets; signed URL flow prevents double-submit |

## Project Structure

### Documentation (this feature)

```text
specs/001-media-storage-engine/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── sign-upload-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── media/
│           └── sign-upload/
│               └── route.ts          # Milestone 1: Signed upload URL endpoint
├── components/
│   └── admin/
│       └── MediaManager.tsx           # Milestone 3: Core UI component ("use client")
├── utils/
│   └── imageCompressor.ts            # Milestone 2: Canvas WebP compression
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # Admin service-role Supabase client
├── types/
│   └── media.ts                      # OptimizedAsset type definition
```

**Structure Decision**: Single-project Next.js App Router with `src/` directory. UI components in `components/admin/`, API routes in `app/api/`, shared utilities in `utils/`, and type definitions in `types/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected — all gates pass. Complexity tracking is not required.

## Phase 0: Research

All technical decisions are fully specified by the user's milestone input. Zero `[NEEDS CLARIFICATION]` markers exist.

### Research Report

Generated at `research.md` — see consolidated decisions below.

## Phase 1: Design & Contracts

### Data Model

Generated at `data-model.md` — see entity definitions, fields, and validation rules.

### API Contract

Generated at `contracts/sign-upload-api.md` — see endpoint specification.

### Quickstart

Generated at `quickstart.md` — see integration guide.

### Agent Context

AGENTS.md updated with plan reference.
