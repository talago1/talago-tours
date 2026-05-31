# Contract: Admin Review Moderation API

**Endpoint**: `PATCH /api/admin/reviews/moderate`

## Purpose
Enables authorized administrators to approve or reject customer-submitted reviews and trigger recalculation of tour averages.

## Request Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (or session cookie validation)

## Request Payload
```json
{
  "reviewId": "review-uuid-789",
  "status": "APPROVED"
}
```

### Constraints & Validations
1. `reviewId`: String (UUID), required.
2. `status`: String, required. Must be exactly `"APPROVED"` or `"REJECTED"`.

## Operations Flow
1. Verify administrator credentials and authorization.
2. Update the target `Review` row's `status` column to the provided value.
3. If the status is toggled to `APPROVED`, automatically trigger the background aggregation logic:
   - Call `utils/calculateTourRatings.ts` with the corresponding `tourId`.
   - Calculate the float mean average of all APPROVED reviews matching the `tourId`.
   - Save the mean as `ratingAverage` and the count as `ratingCount` on the static `Tour` entity.
4. Return the outcome.

## Responses

### `200 OK`
Returned when the review status is successfully updated and aggregates are re-computed.
```json
{
  "success": true,
  "message": "Review status updated to APPROVED. Tour aggregate rating has been updated.",
  "data": {
    "reviewId": "review-uuid-789",
    "status": "APPROVED",
    "tourId": "tour-uuid-456",
    "newRatingAverage": 4.8,
    "newRatingCount": 12
  }
}
```

### `400 Bad Request`
Returned for bad status payload options.
```json
{
  "success": false,
  "error": "Status must be either APPROVED or REJECTED."
}
```

### `401 Unauthorized`
Returned if admin authorization check fails.
```json
{
  "success": false,
  "error": "Authentication required."
}
```

### `404 Not Found`
Returned if the target reviewId doesn't exist.
```json
{
  "success": false,
  "error": "Review record not found."
}
```