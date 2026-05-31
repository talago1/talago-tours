# Data Model: Operations Calendar & Daily Tour Manifest

## Entity: Booking (extended)

Add an optional room number field to the existing Booking model:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| roomNumber | String? | nullable, default: null | Hotel room number assigned to guest, filled by operator |

## Manifest Types

### ManifestItem (TypeScript)
```typescript
interface ManifestItem {
  bookingId: string;
  passengerName: string;
  hotelName: string;
  roomNumber: string | null;
  paxCount: number;
  paymentStatus: string | null;     // null | PROCESSING | PAID | FAILED
  channel: BookingChannel;
  isCheckedIn: boolean;
  pickupTime?: string;
}
```

### DailyTourManifest (TypeScript)
```typescript
interface DailyTourManifest {
  tourId: string;
  tourTitle: string;
  totalPassengers: number;
  manifestItems: ManifestItem[];
}
```

### ManifestQuery (TypeScript)
```typescript
interface ManifestQuery {
  date: string;  // YYYY-MM-DD
}
```

## Prisma Schema Update

Add to existing Booking model:
```prisma
model Booking {
  // all existing fields from Features 006-009
  roomNumber String?  // optional, filled by operator for manifest display
}
```

## Validation Rules

1. `roomNumber` is optional — no validation enforced at DB level
2. Manifest queries filter `travelDate` as: `travelDate >= dateStart AND travelDate < dateEnd` (full-day range)
3. Only bookings with `status IN (CONFIRMED, COMPLETED)` appear in manifest
4. Payment status from `paymentStatus` field (null, PROCESSING, PAID, FAILED)
5. Check-in status from `isCheckedIn` boolean
6. Sorting by zone order/pickup time is server-side — design decision, not data validation

## State Transitions

No new state transitions. Manifest is a read-only view:
- Data flows: Booking table (source) → Prisma query → server grouping → JSON response → client render
- No write operations from manifest (read-only snapshot)
