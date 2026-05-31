# Research: Dynamic Multi-Destination Architecture Upgrade (Feature 014)

## Decision Log

### 1. Destination Model — Slug Generation Strategy
- **Decision**: Generate slug on both client (preview) and server (canonical) using a shared utility function
- **Rationale**: Client-side slug preview gives instant feedback. Server-side regeneration ensures the canonical slug is always correct regardless of client input. The utility function lowercases, replaces spaces/spacial chars with hyphens, strips non-alphanumeric characters, and collapses multiple hyphens.
- **Alternatives considered**: Client-only slug (can be bypassed), server-only slug (no preview), client with server validation round-trip (unnecessary network call)

### 2. Slug Regeneration on Name Edit
- **Decision**: Auto-regenerate slug whenever the name changes — the new slug must pass the unique constraint
- **Rationale**: The slug is derived from the name. If a manager edits "Hurghada" to "Hurghada City", the slug should update to "hurghada-city". If the new slug conflicts with an existing one, the API returns a duplicate error. This is consistent with FR-003 and matches user expectations.
- **Alternatives considered**: Immutable slug on creation (decouples slug from name — confusing UX), manual slug edit (more complex UI, higher chance of inconsistency)

### 3. Edit vs Re-upload Thumbnail
- **Decision**: Edit modal shows current thumbnail preview with a "Replace image" button; no image means upload prompt
- **Rationale**: Standard CRUD pattern — the existing image is displayed, and the user can optionally replace it by clicking upload. If no image exists, show a placeholder and the upload area. This is intuitive and consistent with media handling across the app.
- **Alternatives considered**: Always force re-upload on edit (poor UX, unnecessary bandwidth)

### 4. Delete Restriction — API Layer vs DB Layer
- **Decision**: Dual enforcement — Prisma `onDelete: Restrict` at DB level, and a pre-check query at API level for a friendly error message
- **Rationale**: The DB constraint (Restrict) is the safety net. The API pre-check queries the count of tours with this destinationId and returns a specific error message: "Cannot delete 'Hurghada': 12 tours are assigned to this destination." This gives the admin actionable information.
- **Alternatives considered**: API-only check (race condition), DB-only (generic error from Prisma)

### 5. Destination Select — Client-side vs Server-side Filtering
- **Decision**: Server-side alphabetical fetch; client-side filtering by search term
- **Rationale**: The total number of destinations is small (tens, not thousands) — SC-005 sets the bar at 50+. Fetching the full alphabetically-sorted list once and filtering client-side gives instant response (SC-002: under 200ms). Server-side search would add unnecessary network latency for each keystroke.
- **Alternatives considered**: Server-side search endpoint (over-engineered for small dataset), debounced API call (network latency for every search)

### 6. Destination Image — Reuse Feature 001/010 Media Pipeline
- **Decision**: DestinationManager uses the existing MediaUploader component and signed URL flow
- **Rationale**: Consistent with the assumption in the spec. The existing pipeline handles drag-drop, WebP compression at 0.80 quality, 1920px max width, and signed Supabase URLs with 60s validity. Reusing it avoids duplicating image handling logic and maintains a single upload pattern across the app.
- **Alternatives considered**: Custom upload component (duplicates effort, inconsistent UX), raw file input (bypasses compression)

### 7. Downstream Filter — Query Param Pattern
- **Decision**: Optional `destinationId` query parameter on existing analytics and manifest endpoints
- **Rationale**: Aligns with FR-008 and FR-009. The param is added to the URL search params on the existing endpoints. When present, the Prisma query adds a WHERE clause on `tour.destinationId`. When absent, the existing query runs unchanged (backward compatible). No new endpoints needed.
- **Alternatives considered**: Separate filtered endpoints (endpoint proliferation), POST with filter body (not RESTful for reads), GraphQL (overkill)

## Best Practices

### Slug Generation Utility
```typescript
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric (keep spaces and hyphens)
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
}
```

### Destination CRUD API Pattern
```typescript
// POST /api/admin/destinations
async function createDestination(name: string, imageUrl?: string) {
  const slug = generateSlug(name);
  return prisma.destination.create({ data: { name, slug, imageUrl } });
}

// PUT /api/admin/destinations/[id]
async function updateDestination(id: string, name: string, imageUrl?: string) {
  const slug = generateSlug(name);
  return prisma.destination.update({ where: { id }, data: { name, slug, imageUrl } });
}

// DELETE /api/admin/destinations/[id]
async function deleteDestination(id: string) {
  const tourCount = await prisma.tour.count({ where: { destinationId: id } });
  if (tourCount > 0) throw new AppError(400, `Cannot delete: ${tourCount} tours assigned`);
  return prisma.destination.delete({ where: { id } });
}
```

### Searchable Dropdown Client-Side Filter
```typescript
function DestinationSelect({ destinations, value, onChange }: Props) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    destinations.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [destinations, search]
  );
  // render filtered list with highlighted matches
}
```

### Downstream Analytics Filter Integration
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destinationId = searchParams.get('destinationId');

  const where: Prisma.BookingWhereInput = {};
  if (destinationId) {
    where.tour = { destinationId };  // filter bookings by tour's destination
  }

  const revenue = await prisma.booking.aggregate({
    where,
    _sum: { revenue: true },
  });
  // ... continue with existing logic
}
```
