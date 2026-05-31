# API Contracts: Admin Bookings Endpoints

## Base URL

All endpoints are relative to `/api/admin/bookings`

---

## GET /api/admin/bookings

Fetch all bookings for the admin queue.

### Response 200

```json
{
  "bookings": [
    {
      "id": "clx...",
      "bookingReference": "TLG-20260530-0001",
      "tourTitle": "Hurghada Snorkeling Adventure",
      "customerName": "John Doe",
      "customerPhone": "+201234567890",
      "travelDate": "2026-06-15",
      "guestCount": 2,
      "totalPriceUSD": 140.00,
      "hotelName": "Steigenberger Al Dau Beach Hotel",
      "pickupTime": "08:30",
      "status": "PENDING",
      "language": "en"
    }
  ]
}
```

### Response 500

```json
{
  "error": "Internal server error"
}
```

---

## PATCH /api/admin/bookings/{id}/status

Update a booking's lifecycle status.

### Request

```json
{
  "status": "CONFIRMED"
}
```

Valid status values: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`

Allowed transitions enforced server-side:

| Current Status | Allowed New Statuses |
|----------------|---------------------|
| PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | COMPLETED, CANCELLED |
| COMPLETED | (none — terminal) |
| CANCELLED | (none — terminal) |

### Response 200

```json
{
  "booking": {
    "id": "clx...",
    "bookingReference": "TLG-20260530-0001",
    "status": "CONFIRMED",
    "updatedAt": "2026-05-30T12:00:00Z"
  }
}
```

### Response 400 — Invalid Status

```json
{
  "error": "Invalid status value. Must be one of: PENDING, CONFIRMED, COMPLETED, CANCELLED"
}
```

### Response 400 — Illegal Transition

```json
{
  "error": "Cannot transition from PENDING to COMPLETED"
}
```

### Response 404

```json
{
  "error": "Booking not found"
}
```

### Response 500

```json
{
  "error": "Internal server error"
}
```

## Error Codes Reference

| HTTP Status | Condition |
|-------------|-----------|
| 200 | Success |
| 400 | Invalid status value or illegal transition |
| 404 | Booking ID not found |
| 500 | Server/database error |
