# Contract: Admin Promo Code Management API

**Endpoint**: `POST /api/admin/campaigns/create`

## Purpose
Enables authorized administrators to create new promo codes with configurable discount type, value, usage limits, minimum spend, and expiry.

## Request Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (or session cookie validation)

## Request Payload
```json
{
  "code": "SUMMER25",
  "discountType": "PERCENTAGE",
  "discountValue": 25,
  "currency": "EGP",
  "minBookingValue": 100,
  "maxUses": 500,
  "expiresAt": "2026-08-31T23:59:59.000Z"
}
```

### Constraints & Validations
1. `code`: String, required. 3-50 characters. Lowercased before storage. Must be unique.
2. `discountType`: String, required. Must be `"PERCENTAGE"` or `"FIXED_AMOUNT"`.
3. `discountValue`: Decimal, required.
   - If `PERCENTAGE`: must be > 0 and <= 100.
   - If `FIXED_AMOUNT`: must be > 0.
4. `currency`: String, required. 3-letter ISO code. Default `"EGP"`.
5. `minBookingValue`: Decimal, optional. Defaults to 0.
6. `maxUses`: Int, required. Must be >= 1.
7. `expiresAt`: ISO 8601 datetime string, required. Must be in the future.

## Responses

### `201 Created`
Returned when the promo code is successfully created.
```json
{
  "success": true,
  "data": {
    "id": "promo-uuid-abc123",
    "code": "summer25",
    "discountType": "PERCENTAGE",
    "discountValue": 25,
    "currency": "EGP",
    "minBookingValue": 100,
    "maxUses": 500,
    "usedCount": 0,
    "expiresAt": "2026-08-31T23:59:59.000Z",
    "isActive": true,
    "createdAt": "2026-05-31T12:00:00.000Z"
  }
}
```

### `400 Bad Request`
Returned for validation errors (e.g., duplicate code, invalid discount value).
```json
{
  "success": false,
  "error": "A promo code with this name already exists."
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
