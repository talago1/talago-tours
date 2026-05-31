# Contract: Public Promo Code Validation API

**Endpoint**: `POST /api/public/promo/validate`

## Purpose
Validates a promo code against the constraint matrix (active, not expired, within usage cap, meets min booking value, currency match) and returns the calculated discount amount. Called when the customer clicks "Apply" on the checkout page.

## Request Headers
- `Content-Type: application/json`

## Request Payload
```json
{
  "code": "SUMMER25",
  "bookingValue": 250.00,
  "currency": "EGP"
}
```

### Constraints & Validations
1. `code`: String, required. Max length: 50 characters. Case-insensitive (lowercased server-side before lookup).
2. `bookingValue`: Decimal (number), required. Must be >= 0.
3. `currency`: String, required. Must be a 3-letter ISO currency code (e.g., "EGP", "USD", "EUR").

## Validation Workflow (Server-Side)
1. Lowercase the `code` input.
2. Query `PromoCode` by `code` where `isActive = true`.
3. Check constraint matrix in order:
   a. Record exists — if not, return `404` with "Invalid promo code".
   b. `isActive === true` — if not, return `400` with "This promo code is no longer available".
   c. `new Date() < expiresAt` — if not, return `400` with "This promo code has expired".
   d. `usedCount < maxUses` — if not, return `400` with "This promo code has reached its usage limit".
   e. `bookingValue >= minBookingValue` — if not, return `400` with "Minimum booking value of [minBookingValue] [currency] required".
   f. `currency === bookingCurrency` — if not, return `400` with "This promo code is not valid for [currency] bookings".
4. If all checks pass, calculate the discount via `utils/promo.ts`:
   - `PERCENTAGE`: `discountAmount = bookingValue * (discountValue / 100)`
   - `FIXED_AMOUNT`: `discountAmount = discountValue`
   - Clamp: `finalDiscount = Math.min(discountAmount, bookingValue)` (never exceed subtotal)
5. Return success payload with calculated discount.

## Responses

### `200 OK`
Returned when the promo code is valid and discount is calculated.
```json
{
  "success": true,
  "data": {
    "code": "SUMMER25",
    "discountType": "PERCENTAGE",
    "discountValue": 25,
    "discountAmount": 62.50,
    "originalTotal": 250.00,
    "finalTotal": 187.50,
    "currency": "EGP"
  }
}
```

### `400 Bad Request`
Returned when the code fails any constraint check.
```json
{
  "success": false,
  "error": "This promo code has expired."
}
```

### `404 Not Found`
Returned when the code doesn't match any PromoCode record.
```json
{
  "success": false,
  "error": "Invalid promo code."
}
```
