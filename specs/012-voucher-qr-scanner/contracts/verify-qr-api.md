# Contract: POST /api/admin/operations/verify-qr

## Purpose
Verify a QR scan token and atomically mark the booking as checked in.

## Request

**Method**: POST
**Auth Required**: Yes (admin middleware)
**Content-Type**: application/json

```typescript
interface VerifyQRRequest {
  token: string;  // Base64url-encoded HMAC payload
}
```

## Response

### Success (200)
```typescript
interface VerifyQRSuccess {
  success: true;
  passengerName: string;
  tourTitle: string;
  paxCount: number;
  hotelName: string;
  roomNumber: string | null;
}
```

### Error (400) — Already checked in
```json
{
  "success": false,
  "error": "This passenger has already been checked in"
}
```

### Error (400) — Booking not CONFIRMED
```json
{
  "success": false,
  "error": "Booking is not in CONFIRMED status"
}
```

### Error (401) — Invalid token
```json
{
  "success": false,
  "error": "Invalid or tampered QR token"
}
```

### Error (410) — Token expired
```json
{
  "success": false,
  "error": "QR code has expired. Please generate a new one."
}
```

## Implementation Notes
- Token verified server-side using HMAC-SHA256 with `QR_HMAC_SECRET` env var
- Token parsed: base64url decode → split by `:` → extract bookingId, timestamp, hmac
- Timestamp checked against configurable expiry window (default 24h)
- Use `prisma.$transaction` for atomic isCheckedIn + checkedInAt + checkInLog update
- Return comprehensive traveller metadata for green success card UI
