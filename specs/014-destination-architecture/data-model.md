# Data Model: Dynamic Multi-Destination Architecture Upgrade

## New Entity: Destination

Represents a city or location where tours operate (e.g., Hurghada, Sharm El-Sheikh, Dahab, Marsa Alam).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(uuid()) | Primary key |
| name | String | | City/location display name (e.g., "Hurghada") |
| slug | String | @unique | URL-safe identifier auto-generated from name (e.g., "hurghada") |
| imageUrl | String? | nullable | Supabase storage URL for location thumbnail |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relations:**
- `tours Tour[]` — one-to-many: a destination can have many tours

## Extended Entity: Tour

The existing Tour model gains the following field and relation:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| destinationId | String | required | Foreign key reference to Destination |
| destination | Destination | @relation(fields: [destinationId], references: [id], onDelete: Restrict) | Relational pointer |

**Indices:**
- `@@index([destinationId])` — optimized lookup for downstream filtering

## Validation Rules

1. **Slug uniqueness**: Enforced by `@unique` constraint on `slug` — duplicate slugs are rejected at the database level with a user-friendly error message (FR-010).
2. **Slug generation**: Auto-generated from name on create and on name edit — deterministic algorithm: lowercase → trim → strip non-alphanumeric → spaces to hyphens → collapse hyphens → trim leading/trailing hyphens.
3. **Mandatory destination**: Every Tour must have a `destinationId` — enforced at the Prisma schema level (required field) (FR-007).
4. **Restricted delete**: Destination cannot be deleted if any Tour references it — enforced by `onDelete: Restrict` at the database level (FR-004).
5. **Name uniqueness**: Not enforced at DB level — multiple destinations can share the same name (unlikely but possible for different regions). Slug uniqueness prevents ambiguity.
6. **Image validation**: Image URL comes from the existing media upload pipeline — no additional validation needed (FR-011 shows placeholder when null).

## TypeScript Interfaces

```typescript
export interface Destination {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tours: number };  // included in grid list
}

export interface DestinationFormData {
  name: string;
  imageUrl?: string | null;
}

export interface DestinationCreateRequest {
  name: string;
  imageUrl?: string;
}

export interface DestinationUpdateRequest {
  name?: string;
  imageUrl?: string;
}

export interface DestinationListResponse {
  destinations: (Destination & { _count: { tours: number } })[];
  total: number;
}
```

## Prisma Schema Additions

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

model Tour {
  // existing fields...
  
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Restrict)

  @@index([destinationId])
}
```

## State Transitions

```
CREATE: Empty form → Enter name → Preview slug → Upload optional image → Submit → Card appears in grid
EDIT:   Card grid → Click edit → Modal with pre-filled name + current image → Modify → Submit → Card updates
DELETE: Card grid → Click delete → Check tour count → 0 tours: remove card | >0 tours: show block message

SELECTOR: Open Tour Builder → Click destination field → Type to filter → Select from list → Field populated with name
FILTER:   Open Analytics/Manifest → Optional destination filter → Select → Data re-queried with WHERE destinationId
```

## Analytics & Manifest Filter Extension

The existing `ExecutiveDashboardStats` contract is unchanged — the `destinationId` filter is an optional query parameter on the existing endpoint, not a new field in the response.

Query pattern:
```
GET /api/admin/analytics/summary?startDate=...&endDate=...&destinationId=xxx
  → Prisma WHERE clause extended: booking.tour.destinationId = xxx
  → Response same shape, scoped to filtered tours only

GET /api/admin/manifest?date=YYYY-MM-DD&destinationId=xxx
  → WHERE clause extended: tour.destinationId = xxx
  → Manifest rows scoped to filtered tours only
```
