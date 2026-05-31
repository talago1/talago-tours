# Feature 014: Dynamic Multi-Destination Architecture Upgrade — Quickstart

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Modify (add Destination model + Tour.destinationId field + relation + index) |
| 2 | `src/utils/slug.ts` | Create (shared generateSlug utility function) |
| 3 | `src/app/api/admin/destinations/route.ts` | Create (GET list + POST create) |
| 4 | `src/app/api/admin/destinations/[id]/route.ts` | Create (PUT update + DELETE restricted) |
| 5 | `src/components/admin/DestinationManager.tsx` | Create (CRUD grid with cards, add/edit/delete, thumbnail upload) |
| 6 | `src/app/admin/destinations/page.tsx` | Create (admin page hosting DestinationManager) |
| 7 | `src/components/ui/DestinationSelect.tsx` | Create (searchable dropdown for Tour Builder) |
| 8 | Tour Builder forms (Feature 002/003) | Modify (replace static city input with DestinationSelect) |
| 9 | `src/app/api/admin/analytics/summary/route.ts` | Modify (accept optional destinationId query param) |
| 10 | Manifest query builder (Feature 011) | Modify (accept optional destinationId filter) |
| 11 | `AGENTS.md` | Modify (update plan reference) |

## Steps

### 1. Prisma Schema
Add to `prisma/schema.prisma`:
```prisma
model Destination {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  imageUrl  String?
  tours     Tour[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Add to `model Tour`:
```prisma
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Restrict)
```

Add index on Tour:
```prisma
@@index([destinationId])
```

Run `npx prisma migrate dev --name add-destination-model`

### 2. Slug Utility
Create `src/utils/slug.ts` with:
- `generateSlug(name: string): string` — lowercases, trims, strips non-alphanumeric, replaces spaces with hyphens, collapses multiple hyphens, trims leading/trailing hyphens

### 3. Destination API — GET + POST
Create `src/app/api/admin/destinations/route.ts`:
- Auth guard
- `GET`: `prisma.destination.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { tours: true } } } })`
- `POST`: Extract name + imageUrl, generate slug via `generateSlug()`, create via Prisma, catch P2002 for duplicate slug

### 4. Destination API — PUT + DELETE
Create `src/app/api/admin/destinations/[id]/route.ts`:
- `PUT`: Validate exists, regenerate slug if name changed, update, catch P2002
- `DELETE`: Pre-check tour count, return descriptive error if > 0, delete if 0

### 5. DestinationManager Component
Create `src/components/admin/DestinationManager.tsx`:
- `"use client"` component
- Fetches GET /api/admin/destinations on mount
- **Grid**: `grid grid-cols-1 md:grid-cols-3 gap-4` card layout with name, thumbnail (or placeholder), slug, tour count badge
- **Add**: Modal form with name input + thumbnail upload (reuse MediaUploader) + slug preview
- **Edit**: Modal pre-filled with current data, same form as Add
- **Delete**: Confirmation dialog with tour count check, block message if tours exist
- **States**: Loading skeleton grid, empty state ("No destinations yet"), error state with retry

### 6. Admin Destinations Page
Create `src/app/admin/destinations/page.tsx`:
- Server component rendering DestinationManager
- Page title "Destinations" with breadcrumb

### 7. DestinationSelect Component
Create `src/components/ui/DestinationSelect.tsx`:
- `"use client"` component
- Props: `value: string | null`, `onChange: (id: string) => void`, `disabled?: boolean`
- Fetches GET /api/admin/destinations on mount (or receives via prop)
- Search input with filtered dropdown via `useMemo`
- Shows selected destination name when value is set
- States: Loading skeleton, empty ("No destinations found"), no match ("No results for '{query}'")
- Keyboard navigation: arrow keys, enter to select, escape to close

### 8. Tour Builder Integration
Modify Tour Builder form (Feature 002/003):
- Find the existing city/region text input field
- Replace with `<DestinationSelect>` component
- Wire `destinationId` to the tour form state
- Pre-populate on edit mode from existing tour data

### 9. Analytics Downstream Filter
Modify `src/app/api/admin/analytics/summary/route.ts`:
- Parse optional `destinationId` from URL search params
- Add `where` clause: `booking.tour.destinationId = destinationId` when present
- No changes to response shape — existing contract preserved

### 10. Manifest Downstream Filter
Modify Feature 011 manifest query:
- Parse optional `destinationId` from URL search params
- Filter tours by destinationId when present

### 11. Agent Context
Update `AGENTS.md` plan reference to point to `specs/014-destination-architecture/plan.md`

## Key Interfaces

```typescript
export interface Destination {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tours: number };
}

export interface DestinationFormData {
  name: string;
  imageUrl?: string | null;
}

export interface DestinationListResponse {
  destinations: Destination[];
  total: number;
}
```

## Architecture Flow

```
Destination Manager:
  Page load → GET /api/admin/destinations → Card grid renders
  Add → Modal → Enter name + upload image → POST → Card appears
  Edit → Modal → Change name/image → PUT → Card updates
  Delete → Confirm → Pre-check tours → DELETE → Card removed (or block message)

Tour Builder:
  Form load → GET /api/admin/destinations (for dropdown data) → DestinationSelect renders
  Type search → Client-side filter → Select destination → Form state updated
  Save → POST/PUT tour with destinationId → Tour-destination relation persisted

Analytics/Manifest:
  Existing load → No filter → All data (backward compatible)
  Filter selected → Add destinationId param → Prisma WHERE applied → Scoped data
```
