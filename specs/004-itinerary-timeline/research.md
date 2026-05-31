# Research: Dynamic Milestone Timeline Itinerary Builder & Display

## Lucide React Icons

**Decision**: Add `lucide-react` as a project dependency. Use dynamic icon resolution via a token-to-component mapper object to avoid large bundle imports.

**Rationale**: The feature description explicitly specifies Lucide React icons. Lucide is tree-shakeable, so importing individual icons by name (`import { Ship, Compass, Waves, Utensils, Building } from 'lucide-react'`) keeps bundle size minimal. A mapper object maps token strings to icon components:

```typescript
import { Ship, Compass, Waves, Utensils, Building, MapPin } from 'lucide-react';

const ICON_MAP = {
  boat: Ship,
  safari: Compass,
  swim: Waves,
  food: Utensils,
  hotel: Building,
  generic: MapPin,
} as const;
```

**Alternatives considered**: Dynamic `import()` per icon (adds network requests), single monolithic import (defeats tree-shaking).

## Testing Approach

**Decision**: No unit/E2E test framework configured. Manual validation via spec's "Independent Test" scenarios for initial delivery.

**Rationale**: Consistent with features 001-003.

## Prisma Schema

**Decision**: Add an `itinerary` JSON field (nullable) to the Tour model. Stores an array of milestone objects with time tag, icon token, sort index, and localized titles.

**Rationale**: The itinerary data is naturally tied to a tour. A JSON array provides flexibility for the milestone structure without creating a separate table. The array index inherently defines sort order.

**Alternatives considered**: Separate `Milestone` model (over-normalization — milestones never exist without a tour), relational table with position column (same as JSON array but with migration overhead).

## JSON Structure

```typescript
interface ItineraryMilestone {
  id: string;
  timeTag: string;       // e.g. "09:00 AM" or "Duration: 2 hrs"
  iconToken: 'boat' | 'safari' | 'swim' | 'food' | 'hotel' | 'generic';
  title: {
    en: string;
    de: string;
    ru: string;
    fr: string;
    it: string;
    tr: string;
  };
}

// Stored as Tour.itinerary (Json, nullable)
type ItineraryData = ItineraryMilestone[];
```

## Admin Builder State Architecture

**Decision**: The builder maintains its own state array of `ItineraryMilestone` objects. Language tab integration works via a shared context or prop that passes the active language code — the builder switches which language key (`en`, `de`, etc.) is being edited in the title input fields, without resetting other language data.

**Rationale**: The builder hooks into the existing language tab system from Feature 002. All 6 language fields exist in the milestone objects at all times; only the active language's value is shown in the input.

## Timeline Display (CLS = 0)

**Decision**: The timeline uses a fixed-width left border (`border-l-2 border-gray-200`) for the vertical track. Each node has predetermined dimensions via fixed icon bubble size (`w-10 h-10`) and fixed spacing (`py-6`). Hover scale transform (`hover:scale-110`) uses `transform` which does not affect layout flow.

**Rationale**: Fixed dimensions prevent layout shifts. CSS `transform` operates in the compositor layer, not layout layer — zero CLS guaranteed.

## Validation Rules

1. Each milestone must have a unique `id` (UUID)
2. `timeTag` must be non-empty
3. `iconToken` must be one of the valid tokens
4. `title.en` must be non-empty (English required)
5. All other language titles are optional
6. At least one milestone must exist for the itinerary to be non-null
