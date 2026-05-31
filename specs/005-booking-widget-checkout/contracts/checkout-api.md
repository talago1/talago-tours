# API Contract: Booking Checkout

## Endpoint

```
POST /api/bookings/checkout
```

## Request

```typescript
{
  tourId: string;              // Tour CUID
  zoneId: string;              // Pickup zone identifier
  hotelName: string;           // Hotel name, max 200 chars
  travelDate: string;          // ISO date string (YYYY-MM-DD), future date
  guestCount: number;          // 1 to max capacity
  customerName: string;        // Full name, min 2 chars
  customerEmail: string;       // Valid email format
  customerPhone: string;       // E.164 format, e.g. +201234567890
}
```

### Example

```json
{
  "tourId": "clx...",
  "zoneId": "el-gouna",
  "hotelName": "Steigenberger Al Dau Beach Hotel",
  "travelDate": "2026-06-15",
  "guestCount": 2,
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "customerPhone": "+201001234567"
}
```

## Response

### 200 Success
```typescript
{
  bookingReference: string;    // "TLG-2026-A3X9"
}
```

### 400 Bad Request — Validation Error
```typescript
{
  error: string;               // Human-readable error message
  field?: string;              // Optional field name for inline targeting
}
```

Possible errors:
- `"travelDate must be a future date"`
- `"guestCount must be at least 1"`
- `"customerName is required (min 2 characters)"`
- `"customerEmail is not a valid email"`
- `"customerPhone must be in international format (e.g. +201234567890)"`
- `"hotelName exceeds maximum length of 200 characters"`
- `"tourId not found"` — if the tour does not exist

### 500 Server Error
```typescript
{
  error: string;               // "An unexpected error occurred. Please try again."
}
```

## Server-side Processing

1. **Parse and validate** all required fields
2. **Fetch Tour** from database by `tourId` — get `perPersonPrice`
3. **Compute total** server-side: `(perPersonPrice * guestCount) + zoneTransferFee`
4. **Generate booking reference** via crypto random (4-char uppercase avoiding ambiguous chars)
5. **Create Booking record** with status `PENDING`
6. **Return** `{ bookingReference: "TLG-2026-XXXX" }`

## Security

- `totalPriceUSD` is NEVER accepted from the client — always computed server-side
- Booking reference uses `crypto.randomBytes` (not sequential or predictable)
- Unique constraint on `bookingReference` prevents duplicate reference collisions
- All text inputs are trimmed and sanitized before storage
