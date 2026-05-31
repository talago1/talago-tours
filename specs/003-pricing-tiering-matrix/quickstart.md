# Quickstart: Age-Bracket Pricing

## Prerequisites

- Node.js 18+, Next.js 14+ (App Router)
- PostgreSQL database with Prisma schema migrated
- Tour model must include age-bracket pricing fields (adultPrice, childPrice, childMinAge, childMaxAge, infantPrice, infantMinAge, infantMaxAge, ageRestrictionsNotes)

## Files Already Modified

### 1. Prisma Schema Update (`prisma/schema.prisma`)

All pricing fields added directly to the Tour model as scalar fields.

### 2. Type Definitions (`src/types/tourBuilder.ts`)

`PricingFields` interface extended with: `adultPrice`, `childEnabled`, `childPrice`, `childMinAge`, `childMaxAge`, `infantEnabled`, `infantPrice`, `infantMinAge`, `infantMaxAge`, `ageRestrictionsNotes`.

### 3. Pricing Section (`src/components/admin/PricingSection.tsx`)

Redesigned with 4 rows:
- Adult Price (always visible, required)
- Child tier toggle → 3-column grid (price, min age, max age)
- Infant tier toggle → 3-column grid (price, min age, max age)
- Age Restrictions textarea

### 4. Validation (`src/utils/tourValidation.ts`)

Pricing validation added for all tier rules.

### 5. API Route (`src/app/api/admin/tours/create/route.ts`)

Server-side validation and persistence of all pricing fields.

## Data Flow

```text
Admin navigates to /admin/tours/new
  → Scrolls to "Pricing & Age Tiers" section
  → Enters Adult Price (always visible)
  → Optionally toggles "Enable Child Pricing" → enters 3 fields
  → Optionally toggles "Enable Infant Pricing" → enters 3 fields
  → Optionally enters Age Restrictions Notes
  → Saves → client-side validation → API validates + persists → success/error feedback
```

## Key Design Decisions

- Pricing is embedded in the Tour record as direct scalar fields (not JSON) for queryability
- Child and infant tiers are optional — toggle controls show/hide their respective fields
- Sensible defaults: child ages 3-11, infant ages 0-2
- Age range validation is enforced both client-side and server-side
- Save button disabled immediately on click — no duplicate submissions
