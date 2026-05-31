# Research: Age-Bracket Pricing

## Testing Approach

**Decision**: No unit/E2E test framework configured in project. Manual validation via spec's "Independent Test" scenarios for initial delivery.

**Rationale**: Same as features 001 and 002 — `package.json` has no test dependencies. Test infrastructure to be added in a follow-up task.

## Pricing Data Storage

**Decision**: Age-bracket pricing fields stored as direct scalar columns on the Prisma `Tour` model (not JSON). Adult price is a required `Float`, child and infant tiers are optional with nullable `Int` age range columns.

**Rationale**: Scalar columns allow direct SQL queries (e.g., "find tours where adultPrice < 100") without JSON extraction, are type-safe without runtime parsing, and avoid migration issues when pricing structure evolves. Each tier is a fixed shape (price + minAge + maxAge), so JSON flexibility is unnecessary.

**Alternatives considered**: JSON field `pricing` (would need runtime parsing and lose queryability), separate `PricingTier` table (over-normalization for a fixed 3-tier structure).

## Pricing Precision

**Decision**: Use JavaScript `Number` with `step="0.01"` on number inputs for all USD pricing. Prisma stores as `Float`. No rounding library needed — input constraints prevent more than 2 decimal places.

**Rationale**: USD-only pricing (per spec assumptions) with constrained inputs makes standard float adequate. Direct scalar storage avoids JSON serialization/deserialization issues.

## Toggle Behavior

**Decision**: Child and infant tiers use controlled toggle switches. When disabled, all fields in that tier are excluded from the save payload (sent as `undefined`, stored as `null` in Prisma). When re-enabled, sensible defaults (child 3-11, infant 0-2) pre-fill the age fields.

**Rationale**: Straightforward state management — parent component holds the full `PricingFields` object; toggling just flips `childEnabled`/`infantEnabled`. Sensible defaults reduce admin effort.

## Validation Architecture

**Decision**: Validation runs in two layers:
1. Client-side (`validateTourForm`): checks adultPrice > 0, child/infant price > 0 when enabled, maxAge > minAge when enabled
2. Server-side (API route): mirrors all client checks as authoritative gate before Prisma write

**Rationale**: Client validation gives instant feedback; server validation prevents bad data from API callers, buggy clients, or race conditions.

## Project Conventions

**Decision**: Follow existing patterns from features 001 and 002:
- TypeScript interfaces in `src/types/`
- Client components in `src/components/admin/` with `'use client'` directive
- Validation utilities in `src/utils/`
- API route at `src/app/api/admin/tours/create/route.ts` (pricing embedded in tour create, not standalone)
