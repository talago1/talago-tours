# Feature 015: Viator-Style Public Tour Catalog & Search — Quickstart

## Prerequisites

- Feature 014 (Destination model) — Tour must already have `destinationId` and `destination` relation
- Prisma migration for Tour model extensions

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Modify (add status, category, basePrice, duration, rating, thumbnailUrl to Tour model + index) |
| 2 | `src/types/publicTour.ts` | Create (PublicTour, PublicTourApiResponse, TourFilterState interfaces + TOUR_CATEGORIES constant) |
| 3 | `src/utils/publicTourQueries.ts` | Create (fetchActiveTours — optimized Prisma query with selective projection) |
| 4 | `src/app/api/public/tours/route.ts` | Create (GET handler with dynamic Prisma where compilation) |
| 5 | `src/components/public/FilterSidebar.tsx` | Create (client-side filter panel: price slider, category checkboxes, destination dropdown, search input) |
| 6 | `src/components/public/TourGrid.tsx` | Create (responsive grid container with client-side filtering from URL params) |
| 7 | `src/components/public/TourCard.tsx` | Create (single card: 4:3 image, badge, title, rating, price, CTA button) |
| 8 | `AGENTS.md` | Modify (update plan reference) |

## Steps

### 1. Prisma Schema Extension

Add to `prisma/schema.prisma` (Tour model):

```prisma
  status       String   @default("INACTIVE")
  category     String?
  basePrice    Decimal?
  duration     String?
  rating       Float    @default(0)
  thumbnailUrl String?
```

Add index:

```prisma
  @@index([status])
```

Run `npx prisma migrate dev --name add-catalog-fields`

### 2. TypeScript Interfaces

Create `src/types/publicTour.ts`:
- `PublicTour` interface matching API response shape
- `PublicTourApiResponse` — `{ tours: PublicTour[], total: number }`
- `TourFilterState` — `{ destination, type, minPrice, maxPrice, search }`
- `TOUR_CATEGORIES` constant array + `TourCategory` type

### 3. Public Tour Queries

Create `src/utils/publicTourQueries.ts`:
- `fetchActiveTours()` — `prisma.tour.findMany` with `where: { status: 'ACTIVE' }`, selective `select` projection, `include: { destination: { select: { name, slug } } }`, `orderBy: { title: 'asc' }`

### 4. Public Catalog API

Create `src/app/api/public/tours/route.ts`:
- Parse query params: destination, type, minPrice, maxPrice, search
- Build dynamic `Prisma.TourWhereInput` with AND logic
- Return `NextResponse.json({ tours, total })`
- Wrap in try-catch for error handling

### 5. FilterSidebar Component

Create `src/components/public/FilterSidebar.tsx` (must be `"use client"`):
- **Destination dropdown**: Fetch destination list from Feature 014 API, or receive as prop
- **Category checkboxes**: Multi-select from `TOUR_CATEGORIES`
- **Price range**: Dual native range inputs (min, max) with dynamic bounds from data
- **Keyword search**: Input field with `useDebounce` (300ms)
- All filter changes update URL search params via `useRouter.replace`
- Props: `destinations: { name: string; slug: string }[]`
- States: Loading (skeleton), error ("Failed to load destinations")

### 6. TourGrid Component

Create `src/components/public/TourGrid.tsx`:
- Receives `tours: PublicTour[]` as prop
- Reads `useSearchParams()` for current filter state
- Client-side filters the tours array using AND logic
  - destination → `tour.destination.slug === param`
  - type → `tour.category === param`
  - minPrice → `tour.basePrice >= minPrice`
  - maxPrice → `tour.basePrice <= maxPrice`
  - search → `tour.title + tour.description includes search (case-insensitive)`
- Renders responsive grid: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
- States:
  - Loading: 8 skeleton cards (animated pulse)
  - Empty (no data): "No tours available" message
  - Empty (filtered): "No tours match your search criteria" with suggestion
  - Error: Error message with retry button

### 7. TourCard Component

Create `src/components/public/TourCard.tsx`:
- Props: `tour: PublicTour`, `priority?: boolean` (for first-row LCP optimization)
- Render:
  - Thumbnail with `aspect-[4/3]` container, `relative overflow-hidden rounded-2xl bg-gray-100`
  - `<Image>` with fill, `className="object-cover"` — placeholder blur if no thumbnail
  - Destination badge (Forest `#00473F`)
  - Title
  - Star rating (5 stars, filled/half/empty based on `rating` value)
  - Duration display
  - Price display (formatted, or "Contact us" if null)
  - Coral CTA button (`bg-[#FF5B00] hover:bg-[#e05000] text-white`)
- Zero CLS: all dimensions fixed before image load
- Image error fallback: show placeholder

### 8. Public Catalog Page

Create `src/app/tours/page.tsx`:
- Server component (RSC)
- Fetch initial destinations list for dropdown
- Render `<TourGrid>` + `<FilterSidebar>` in a two-column layout
- Sidebar on desktop (left, `w-72`), hidden on mobile (hamburger or bottom sheet)
- Page metadata: title "Tours — TALAGO", description for SEO

### 9. Agent Context

Update `AGENTS.md` plan reference to point to `specs/015-public-tour-catalog/plan.md`

## Key Interfaces

```typescript
export type TourCategory = 'SNORKELING' | 'DIVING' | 'BOAT_TRIP' | 'SAFARI' | 'DESERT' | 'CITY' | 'ADVENTURE';

export const TOUR_CATEGORIES: TourCategory[] = [/* 7 categories */];

export interface PublicTour {
  id: string;
  title: string;
  slug: string;
  basePrice: number | null;
  duration: string | null;
  rating: number;
  thumbnailUrl: string | null;
  category: TourCategory | null;
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

## Architecture Flow

```
Page Load:
  Browser → /tours (RSC) → Server renders shell
  Client hydrates → FilterSidebar + TourGrid mount
  TourGrid fetches GET /api/public/tours → stores full tour list
  FilterSidebar reads URL params → sets initial filter state

Filter Interaction:
  User changes filter → FilterSidebar updates URL params
  TourGrid observes URL param change → client-side filter memo
  Filtered tours render in grid (<100ms)
  No additional API calls during filtering

API Flow:
  GET /api/public/tours?destination=hurghada&type=SNORKELING&search=reef
    ↓
  Prisma: Tour.findMany({
    where: {
      status: 'ACTIVE',
      destination: { slug: 'hurghada' },
      category: 'SNORKELING',
      OR: [{ title: { contains: 'reef' } }, { description: { contains: 'reef' } }]
    },
    select: { /* projected fields */ }
  })
    ↓
  Response: { tours: [...], total: N }
```
