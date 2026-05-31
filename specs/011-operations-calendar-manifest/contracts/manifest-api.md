# Contract: GET /api/admin/operations/manifest

## Purpose
Fetch the daily tour manifest for a given departure date, grouped by tour.

## Request

**Method**: GET
**Auth Required**: Yes (admin middleware)
**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | Yes | Departure date in YYYY-MM-DD format |

### Example
```
GET /api/admin/operations/manifest?date=2026-06-15
```

## Response

### Success (200)
```typescript
interface ManifestResponse {
  success: true;
  date: string;                    // YYYY-MM-DD
  totalBookings: number;
  totalPassengers: number;
  groups: DailyTourManifest[];     // Grouped by tourId
}

interface DailyTourManifest {
  tourId: string;
  tourTitle: string;
  totalPassengers: number;
  manifestItems: ManifestItem[];
}

interface ManifestItem {
  bookingId: string;
  passengerName: string;
  hotelName: string;
  roomNumber: string | null;
  paxCount: number;
  paymentStatus: string | null;
  channel: 'VIATOR' | 'GETYOURGUIDE' | 'WHATSAPP' | 'HOTEL_DIRECT' | 'WEBSITE';
  isCheckedIn: boolean;
  pickupTime?: string;
}
```

### Error (400)
```json
{
  "success": false,
  "error": "Missing or invalid date parameter. Expected format: YYYY-MM-DD"
}
```

### Error (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Error (500)
```json
{
  "success": false,
  "error": "Failed to load manifest"
}
```

## Implementation Notes
- Date parameter validated as YYYY-MM-DD format
- Booking query scoped to `travelDate` full-day range (start-of-day to start-of-next-day)
- Filter: `status IN (CONFIRMED, COMPLETED)` only
- Eager-load `tour` relation for title
- Sort by zone order, then pickup time, then customer name
- Group by `tourId` server-side before response
- Select only needed columns (no raw SQL — use Prisma `select` or `include`)
