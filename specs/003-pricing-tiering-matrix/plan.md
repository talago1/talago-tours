# Implementation Plan: Age-Bracket Pricing

**Branch**: `003-pricing-tiering-matrix` | **Date**: 2026-05-31 | **Spec**: `specs/003-pricing-tiering-matrix/spec.md`

## Summary

Extend the Tour Builder Form's Pricing section with dynamic age-bracket pricing. Three tiers: Adult (always required), Child (optional with age range 3-11 by default), Infant (optional with age range 0-2 by default). Toggle controls show/hide each optional tier's inputs. Free-text age restrictions notes field for tour-specific safety rules. All validation enforced client-side and server-side.

## Implementation

All implementation was performed directly on the existing Tour Builder Form (`/admin/tours/new`), extending the Prisma `Tour` model with scalar fields for each pricing tier. No standalone page or API was needed — pricing is embedded in the existing tour create flow.

### Files created/modified

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modified | Added adultPrice (Required), childPrice/childMinAge/childMaxAge/infantPrice/infantMinAge/infantMaxAge (Optional), ageRestrictionsNotes |
| `src/types/tourBuilder.ts` | Modified | Extended `PricingFields` with childEnabled, childMinAge, childMaxAge, infantEnabled, infantMinAge, infantMaxAge, ageRestrictionsNotes |
| `src/components/admin/PricingSection.tsx` | Rewritten | Toggle-based UI with Adult Price, optional Child tier (3 fields), optional Infant tier (3 fields), restrictions textarea |
| `src/utils/tourValidation.ts` | Modified | Added validation: adultPrice > 0, child price validation when enabled, infant price validation when enabled, age range sanity checks |
| `src/app/api/admin/tours/create/route.ts` | Modified | Extended POST handler to validate and persist all new pricing fields |
| `src/components/admin/TourBuilderForm.tsx` | Modified | Updated submit payload to include all new pricing fields |
