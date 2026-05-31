# Quickstart: Universal Tour Builder

## Prerequisites

- Node.js 18+
- PostgreSQL database with `DATABASE_URL` set in `.env`
- Prisma schema migrated (`npx prisma db push` or `npx prisma migrate dev`)

## Files to Create

### 1. Prisma Schema Update (`prisma/schema.prisma`)

Add `TourType` enum, `Zone` model, and expand `Tour` model with new fields.

### 2. Type Definitions (`src/types/tourBuilder.ts`)

Centralized TypeScript types: `LanguageCode`, `TranslationEntry`, `Translations`, `TourFormState`.

### 3. API Route (`src/app/api/admin/tours/create/route.ts`)

POST endpoint that validates input, checks slug uniqueness, creates Tour record.

### 4. Language Tabs Component (`src/components/admin/LanguageTabs.tsx`)

Stateless tab bar showing 6 language flags/labels with active state.

### 5. Master Workspace Page (`src/app/admin/tours/new/page.tsx`)

Full form page combining global fields, language tabs, localized panels, and submit logic.

### 6. Form Orchestrator (`src/components/admin/TourBuilderForm.tsx`)

Manages the full form state, validation, and submission lifecycle.

### 7. Global Fields Component (`src/components/admin/GlobalFields.tsx`)

Shared metadata input row (slug, price, duration, capacity, type, zone).

### 8. Localized Panel Component (`src/components/admin/LocalizedPanel.tsx`)

Per-language fields: title, description, cancellation policy rows.

## Data Flow

```text
User fills form
  → TourBuilderForm manages state
  → GlobalFields handles shared fields
  → LanguageTabs switches active tab
  → LocalizedPanel renders translations[activeTab]
  → Submit: validate → disable button → POST /api/admin/tours/create
  → Success: show confirmation
  → Failure (409 slug): inline error on slug field
  → Failure (500): show generic error, re-enable button
```

## Key Design Decisions

- All 6 language fields in DOM at all times (`hidden` class) — preserves input state on tab switch
- `translations` stored as Prisma `Json` — single structured block per FR-013
- Slug validated both client-side (format) and server-side (uniqueness)
- Submit button disables immediately on click — no duplicate submissions
- Zone model is standalone — populate via dashboard or seed script
