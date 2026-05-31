# Data Model: Digital Booking Voucher & Mobile QR Scanner

## Entity: Booking (existing, no new fields)

This feature uses existing Booking fields from Feature 008:

| Field | Type | Description |
|-------|------|-------------|
| isCheckedIn | Boolean | default false — set to true on successful QR scan check-in |
| checkedInAt | DateTime? | ISO timestamp of check-in event |
| checkInLog | Json | Append-only JSON array recording check-in audit events |

## Token Types

### QRTokenPayload (TypeScript)
```typescript
interface QRTokenPayload {
  bookingId: string;
  timestamp: number;  // generation timestamp, used for expiry check
}
```

### QRToken (string)
Base64url-encoded HMAC-SHA256 signed string: `<bookingId>:<timestamp>:<hmac>`

### ScanVerificationResult (TypeScript)
```typescript
interface ScanVerificationResult {
  success: boolean;
  passengerName?: string;
  tourTitle?: string;
  paxCount?: number;
  hotelName?: string;
  roomNumber?: string | null;
  error?: string;
}
```

## Validation Rules

1. Token HMAC must verify with server secret — invalid tokens return 401
2. Token timestamp must be within validity window (e.g., 24h from generation) — expired returns 410
3. Booking must have status CONFIRMED — PENDING/CANCELLED return 400
4. Booking must have `isCheckedIn: false` — already-checked-in returns 400
5. Check-in update atomically toggles `isCheckedIn`, sets `checkedInAt`, appends to `checkInLog`

## State Transitions

```
QR generated (CONFIRMED booking) → QR scanned → token verified → isCheckedIn: false → atomic update → isCheckedIn: true
                                                                       → isCheckedIn: true → 400 Already checked in
                                                                       → invalid/expired → 401/410 error
```
