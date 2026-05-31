# Contract: Checkout Initialize (Refactored — Exploit Shield)

**Endpoint**: `POST /api/checkout/initialize`

## Purpose
Refactor the existing checkout initialization flow to re-validate the applied promo code server-side immediately before communicating with the payment gateway (Paymob / Fawry). This prevents client-side price tampering: even if a customer intercepts and modifies the Apply response UI, the server will re-verify at checkout initialization and reject the transaction.

## Request Headers
- `Content-Type: application/json`

## Request Payload (Modified — added optional promoCode field)
```json
{
  "bookingId": "booking-uuid-123",
  "tourId": "tour-uuid-456",
  "customerData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+201234567890"
  },
  "pricing": {
    "subtotal": 250.00,
    "currency": "EGP"
  },
  "promoCode": "SUMMER25"
}
```

### Constraints & Validations
1. All existing checkout fields unchanged.
2. `promoCode`: String, optional. If present, the full validation matrix (active, expiry, usage, min value, currency) is re-run server-side inside the same atomic transaction as booking creation.

## Refactored Operations Flow
1. Receive and validate input payload.
2. If `promoCode` is present and non-empty:
   a. Re-run the full constraint matrix (identical logic to `POST /api/public/promo/validate`).
   b. Re-calculate the discount amount from the server-side subtotal.
   c. **Discard** any client-sent computed discount or final total — the server always re-calculates.
   d. If validation fails, reject the checkout with the corresponding error message.
3. If validation passes, proceed with the existing checkout flow (create booking record, initiate payment gateway session).
4. Within a Prisma interactive transaction:
   a. Increment `PromoCode.usedCount`.
   b. Create the `Booking` record with the `promoCodeId` foreign key set.
   c. Initiate payment gateway session with server-calculated `finalTotal`.

## Responses

### `200 OK`
Returned when checkout is initialized successfully with promo applied.
```json
{
  "success": true,
  "data": {
    "bookingId": "booking-uuid-456",
    "finalTotal": 187.50,
    "currency": "EGP",
    "discountApplied": 62.50,
    "promoCode": "summer25",
    "paymentSessionId": "paymob-session-789"
  }
}
```

### `400 Bad Request`
Returned when promo validation fails at checkout init.
```json
{
  "success": false,
  "error": "This promo code has expired or is no longer available."
}
```
