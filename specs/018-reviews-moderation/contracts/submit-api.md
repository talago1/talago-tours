# Contract: Public Review Submission API

**Endpoint**: `POST /api/public/reviews/submit`

## Purpose
Allows verified customers to submit a rating and review text for a tour they have booked and completed.

## Request Headers
- `Content-Type: application/json`

## Request Payload
```json
{
  "bookingId": "booking-uuid-123",
  "tourId": "tour-uuid-456",
  "customerName": "Jane Doe",
  "rating": 5,
  "comment": "An absolutely amazing experience! Highly recommend the snorkeling tour."
}
```

### Constraints & Validations
1. `bookingId`: String (UUID), required. Must exist in PostgreSQL database.
2. `tourId`: String (UUID), required. Must match the tour associated with the booking.
3. `customerName`: String, required. Range: 2 - 50 characters.
4. `rating`: Integer, required. Must be exactly `1`, `2`, `3`, `4`, or `5`.
5. `comment`: String, required. Range: 10 - 1000 characters.

## Verification Workflow (Server-Side)
1. Verify the payload structures match typing and constraint contracts.
2. Fetch the corresponding booking record from database.
3. Assert that:
   - The booking status is exactly `CONFIRMED`.
   - The booking's associated `tourId` matches the payload `tourId`.
   - No pre-existing `Review` record is linked to this `bookingId` (enforce 1:1 unique rule).
4. If validations pass, insert the review record with status `PENDING`.

## Responses

### `201 Created`
Returned when the review is successfully registered.
```json
{
  "success": true,
  "message": "Review submitted successfully. It is now pending moderation.",
  "review": {
    "id": "review-uuid-789",
    "status": "PENDING",
    "createdAt": "2026-05-31T12:00:00.000Z"
  }
}
```

### `400 Bad Request`
Returned for schema validation errors.
```json
{
  "success": false,
  "error": "Rating must be an integer between 1 and 5."
}
```

### `403 Forbidden`
Returned if the booking is not confirmed, doesn't match the tour, or has already been reviewed.
```json
{
  "success": false,
  "error": "This booking reference has already been reviewed or is not eligible."
}
```

### `404 Not Found`
Returned if the booking reference doesn't exist.
```json
{
  "success": false,
  "error": "Invalid booking reference."
}
```