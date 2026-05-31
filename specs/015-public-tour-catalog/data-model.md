# Data Model: Viator-Style Public Tour Catalog & Search

## Extended Entity: Tour

The existing Tour model gains the following fields for the public catalog:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| status | String | @default("INACTIVE") | Visibility toggle: "ACTIVE" appears in catalog, "INACTIVE" hidden |
| category | String | optional | Tour type from predefined list: SNORKELING, DIVING, BOAT_TRIP, SAFARI, DESERT, CITY, ADVENTURE |
| basePrice | Decimal? | optional | Standard adult price for catalog display (Decimal for precision) |
| duration | String? | optional | Human-readable duration string (e.g., "3 hours", "Full day") |
| rating | Float | @default(0) | Admin-set rating (0–5); 0 = unrated |
| thumbnailUrl | String? | optional | Supabase URL for the catalog card image |

**Existing fields preserved**: id, title, description, images, createdAt, updatedAt, destinationId, destination relation

**Indices:**
- `@@index([status])` — optimized filtering for public queries

### Category Constants

```typescript
export const TOUR_CATEGORIES = [
  'SNORKELING',
  'DIVING',
  'BOAT_TRIP',
  'SAFARI',
  'DESERT',
  'CITY',
  'ADVENTURE',
] as const;

export type TourCategory = typeof TOUR_CATEGORIES[number];
```

## TypeScript Interfaces

```typescript
export interface PublicTour {
  id: string;
  title: string;
  slug: string;
  basePrice: number | null;
  duration: string | null;
  rating: number;
  thumbnailUrl: string | null;
  category: string | null;
  destination: {
    name: string;
    slug: string;
  };
}

export interface PublicTourApiResponse {
  tours: PublicTour[];
  total: number;
}

export interface TourFilterState {
  destination: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  search: string;
}
```

## Prisma Schema Additions

```prisma
model Tour {
  id          String   @id @default(cuid())
  title       String
  description String
  images      String[]
  status      String   @default("INACTIVE")
  category    String?
  basePrice   Decimal?
  duration    String?
  rating      Float    @default(0)
  thumbnailUrl String?

  // From Feature 014
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Restrict)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([destinationId])
}
```

## State Transitions

```
TOUR STATUS:
  CREATE → default "INACTIVE" (hidden from catalog)
  Admin edits → set to "ACTIVE" → appears in public catalog
  Admin edits → set to "INACTIVE" → removed from public catalog

CATALOG FILTER:
  Page load → fetch ACTIVE tours → store in state
  Change filter → client-side filter memo → re-render grid
  Clear filters → show all ACTIVE tours
  No results → "No tours match" empty state
```

## Validation Rules

1. **Status values**: Only "ACTIVE" or "INACTIVE" accepted — enforced at application level in the admin tour form
2. **Category values**: Must be one of the 7 predefined constants — enforced client-side in admin form
3. **Rating range**: 0–5, enforced at admin form level — values outside range are clamped on save
4. **basePrice**: Decimal — positive values only, validated in admin form
5. **thumbnailUrl**: Optional — if null, card shows placeholder image
6. **Public query contract**: Only rows with `status = 'ACTIVE'` are ever returned by the public API — enforced in the Prisma `where` clause
