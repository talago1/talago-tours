# Research: Universal Tour Builder & Multi-Language Form Engine

## Testing Approach

**Decision**: No unit/E2E test framework configured in project. Manual validation via spec's "Independent Test" scenarios for initial delivery. Test infrastructure (Jest or Vitest) to be added in a follow-up task.

**Rationale**: `package.json` has no test dependencies. Adding a framework mid-plan would require configuration setup (tsconfig, jest.config) beyond this feature's scope. The spec defines clear independent test scenarios that map directly to manual QA.

**Alternatives considered**: Jest (requires Babel/ts-jest config), Vitest (would need to add vite config) — both are additive scope.

## Prisma Schema — Current State

**Decision**: Current `Tour` model is minimal (id, title, description, images[], timestamps). Must expand with:
- `slug` (String, unique) — URL-safe identifier
- `type` (enum: SHARED, PRIVATE) — tour type
- `basePriceUSD` (Float) — base price in USD
- `durationHours` (Int) — tour duration
- `maxCapacity` (Int) — max participants
- `zoneId` (String) — FK to Zone model
- `translations` (Json) — structured localized content for 6 languages
- Create new `Zone` model (id, name, createdAt)

**Rationale**: Prisma `Json` field is the natural fit for storing the 6-language translations object as a single structured block per spec FR-013. The `Zone` model doesn't exist yet — must be created.

**Alternatives considered**: Separate `TourTranslation` table (over-normalization for a fixed 6-language schema), separate columns per language (not scalable, violates FR-013 bundling requirement).

## Project Patterns & Conventions

**Decision**: Follow existing patterns from feature 001:
- API routes: `NextRequest`/`NextResponse` in `src/app/api/`
- Prisma client: Globally cached singleton from `src/lib/prisma.ts`
- Types: Separate files in `src/types/`
- Components: `'use client'` with explicit `interface Props` typing
- Tailwind: Utility classes with `@apply` avoided, inline classes preferred

**Rationale**: Consistency across features. No Tailwind `config` changes needed for this feature.

## Zone Data Source

**Decision**: Create a minimal `Zone` model in Prisma schema. No seed data planned — zones populated via Supabase dashboard or future admin UI.

**Rationale**: Spec says "zone dropdown options are populated from a pre-existing list of zones defined elsewhere." No existing zone system found in codebase. Minimal model needed.

**Alternatives considered**: Hardcoded ENUM (not scalable), external API (over-engineering for launch).

## Cancellation Policy Storage

**Decision**: Store as `string[]` within each language's translation block inside the `translations` JSON field.

**Rationale**: Per spec, each cancellation policy row is a free-text sentence, independently per language. Variable number of rows (0 to many) per language. Array of strings is the natural JSON representation.

## Slug Uniqueness Strategy

**Decision**: Server-side check in the POST endpoint before insert. If `slug` exists, return 409 with inline error message. Client-side validation ensures URL-safe format (lowercase + hyphens) before submission.

**Rationale**: Spec FR-006/FR-006b requires both frontend format validation and server-side uniqueness enforcement.

## Form State Architecture

**Decision**: Single React state object containing:
- `globalFields`: slug, basePriceUSD, durationHours, maxCapacity, type, zoneId
- `translations`: Record<LanguageCode, { title, description, cancellationPolicies }>

Language tabs toggle visibility of the relevant `translations[activeTab]` panel. All translations kept in-DOM with `hidden` class to preserve input state across tab switches (zero data loss per FR-004).

**Rationale**: FR-004 requires zero data loss during tab switching. Keeping all fields in DOM (vs. conditional mount) ensures React preserves uncontrolled input states or, with controlled components, the state object never discards data.

## Submit Flow

1. Client-side validation (slug format, non-zero numerics, English content required)
2. Button disables immediately, shows loading state
3. POST to `/api/admin/tours/create` with full payload
4. Server checks slug uniqueness → 409 if duplicate
5. Server creates Tour record with Prisma transaction
6. Success → confirmation message; Failure → re-enable button + error message
