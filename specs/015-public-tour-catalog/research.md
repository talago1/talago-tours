# Research: Viator-Style Public Tour Catalog, Interactive Search & Filtering Engine (Feature 015)

## Decision Log

### 1. Tour Status Field — Enum vs Boolean
- **Decision**: Add `status` field as String with enum-like validation at application level, defaulting to `"INACTIVE"` on creation so no tour is public by accident
- **Rationale**: The user requirement specifies "only fetch tours where visibility status equals ACTIVE." A string column (`ACTIVE` / `INACTIVE`) is simpler than a full Prisma enum and still enforces server-side filtering. Boolean `isActive` was rejected because a string allows future extension (e.g., `"ARCHIVED"`, `"DRAFT"`).
- **Alternatives considered**: Boolean `isActive` (less extensible), Prisma native enum (more ceremony)

### 2. Category Field — String vs Enum
- **Decision**: String column with application-level constant list (SNORKELING, DIVING, BOAT_TRIP, SAFARI, DESERT, CITY, ADVENTURE)
- **Rationale**: The spec explicitly lists these 7 categories. A string column with client-side validation is simpler than a DB enum and matches the approach used for status. The constant list is defined as a TypeScript array for type safety.
- **Alternatives considered**: Prisma enum (migration overhead, harder to extend), dedicated Category model (over-engineered for a fixed list)

### 3. Price Field — Decimal vs Int
- **Decision**: Use Prisma `Decimal` type for `basePrice` to match existing financial conventions
- **Rationale**: The TALAGO constitution specifies "Postgres Decimal for financial precision" (Section IV). While the catalog only displays prices, using Decimal avoids precision issues and is consistent with Feature 003 pricing matrix.
- **Alternatives considered**: Int (cents, requires conversion everywhere), Float (floating point errors)

### 4. Client-side Filtering Architecture
- **Decision**: Fetch all active tours once via the public API on page load; apply all filters (destination, category, price range, keyword) client-side
- **Rationale**: SC-002 requires filter updates within 100ms. Client-side filtering on a cached dataset (50+ tours) is near-instant. Server-side round-trips for every keystroke would add 200-500ms network latency. The initial payload is small (selective projection: ~2KB per tour × 50 = ~100KB total).
- **Alternatives considered**: Server-side filtering for every change (network latency), hybrid (server side for heavy filters, client for UI)

### 5. URL State Synchronization
- **Decision**: Mirror filter state to URL search params (`useSearchParams` + `useRouter`) for shareable URLs and browser back/button support
- **Rationale**: Users expect to be able to share a filtered URL or use browser navigation. Read filter state from URL on mount, write to URL on filter change. This also enables server-side rendering with initial filter state if needed.
- **Alternatives considered**: Component state only (no shareable URLs, no browser history), React Context (same issue)

### 6. Thumbnail Field on Tour
- **Decision**: Add `thumbnailUrl` as optional String to Tour model
- **Rationale**: The spec requires a thumbnail per card (FR-001). Using the existing media pipeline (Feature 001) for upload. Null means the card shows a placeholder image (edge case coverage).
- **Alternatives considered**: Use first image from `images` array (no dedicated thumbnail control), client-side image pick (unreliable)

### 7. Rating Field — Source and Default
- **Decision**: Admin-set rating stored as `Float` on Tour, default `0`, range validated (0–5)
- **Rationale**: Spec explicitly states "no public review system" — ratings are set by administrators. Float allows half-star ratings (4.5, 3.5, etc.). Zero renders as "unrated" with empty stars.
- **Alternatives considered**: Integer only (no half stars), separate Review model (out of scope)

### 8. Duration Field — Format
- **Decision**: String field (e.g., "3 hours", "Full day", "Half day")
- **Rationale**: Duration display is purely informational in this feature — no duration-based filtering is required. A freeform string allows flexible display without parsing complexity.
- **Alternatives considered**: Integer minutes (requires formatting logic), enum (too restrictive)

### 9. Price Range Slider Implementation
- **Decision**: Use native HTML range inputs with dynamic min/max derived from fetched data; no third-party slider library
- **Rationale**: The constitution bans third-party animation libraries. A native `<input type="range">` with Tailwind styling gives sufficient UX for a price slider with zero dependencies.
- **Alternatives considered**: React slider library (dependency bloat), custom div-based slider (more code, same outcome)

### 10. Debounce Implementation
- **Decision**: Custom `useDebounce` hook (150–400ms configurable) — no third-party hook library
- **Rationale**: A debounce hook is ~10 lines of code. Adding a dependency like `use-debounce` is unnecessary for such a small utility.
- **Alternatives considered**: Lodash debounce (heavy dependency), no debounce (performance issues)

## Best Practices

### Public Query Pattern
```typescript
// utils/publicTourQueries.ts
export async function fetchActiveTours(): Promise<PublicTour[]> {
  return prisma.tour.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      slug: true,
      basePrice: true,
      duration: true,
      rating: true,
      thumbnailUrl: true,
      category: true,
      destination: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { title: 'asc' },
  });
}
```

### Public API Route Pattern
```typescript
// app/api/public/tours/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const type = searchParams.get('type');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const search = searchParams.get('search');

  const where: Prisma.TourWhereInput = { status: 'ACTIVE' };

  if (destination) {
    where.destination = { slug: destination };
  }
  if (type) {
    where.category = type;
  }
  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice.gte = parseFloat(minPrice);
    if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const tours = await prisma.tour.findMany({
    where,
    select: { /* same as above */ },
    orderBy: { title: 'asc' },
  });

  return NextResponse.json({ tours, total: tours.length });
}
```

### useDebounce Hook
```typescript
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Client-Side Filter Architecture
```typescript
// FilterSidebar reads URL params, writes to URL on change
// TourGrid reads URL params, filters fetched data client-side
// Flow:
// 1. Page load → fetch /api/public/tours → store in state
// 2. User interacts with filter → update URL params
// 3. TourGrid observes URL params via useSearchParams → client-side filter
// 4. Filtered results rendered in grid

// This means the API call happens once on mount.
// All subsequent filter changes are client-side only (<100ms).
```
