# Feature 011: Operations Calendar & Daily Tour Manifest — Quickstart

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Add `roomNumber` field to Booking model |
| 2 | `src/utils/manifestQueryBuilder.ts` | Create (Prisma query helper) |
| 3 | `src/app/api/admin/operations/manifest/route.ts` | Create (GET manifest endpoint) |
| 4 | `src/components/admin/OperationsCalendarHeader.tsx` | Create (date strip) |
| 5 | `src/components/admin/DailyManifestSheet.tsx` | Create (manifest grid) |
| 6 | `src/app/admin/operations/page.tsx` | Create (admin page) |

## Steps

### 1. Prisma Schema
Add `roomNumber String?` to Booking model, then:
```bash
npx prisma migrate dev --name add-room-number
npx prisma generate
```

### 2. Query Utility
Create `manifestQueryBuilder.ts` with a function accepting date string, returning grouped manifest data.

### 3. API Endpoint
Create GET route at `api/admin/operations/manifest/route.ts` with admin auth middleware, date query param parsing, and server-side grouping.

### 4. Calendar Header
Create `OperationsCalendarHeader.tsx` — responsive date strip with Coral departure badges, URL search param sync.

### 5. Manifest Sheet
Create `DailyManifestSheet.tsx` — grouped tour sections, client-side search, tour type filter, `print:` Tailwind utilities.

### 6. Admin Page
Create `admin/operations/page.tsx` composing both components with data fetching.

### 7. Agent Context
Update `AGENTS.md` plan reference to point to this directory.

## Key Interfaces

```typescript
interface ManifestItem {
  bookingId: string;
  passengerName: string;
  hotelName: string;
  roomNumber: string | null;
  paxCount: number;
  paymentStatus: string | null;
  channel: BookingChannel;
  isCheckedIn: boolean;
  pickupTime?: string;
}

interface DailyTourManifest {
  tourId: string;
  tourTitle: string;
  totalPassengers: number;
  manifestItems: ManifestItem[];
}
```

## Architecture Flow

```
Operator opens /admin/operations
  → CalendarHeader reads ?date= from URL (defaults to today)
  → DailyManifestSheet fetches GET /api/admin/operations/manifest?date=YYYY-MM-DD
  → API validates auth, queries Booking + Tour, groups server-side
  → Client renders grouped manifest with skeleton states
  → Operator filters by name/hotel (client-side) or by tour type (filter toggle)
  → Operator prints → Tailwind print: modifiers activate
```
