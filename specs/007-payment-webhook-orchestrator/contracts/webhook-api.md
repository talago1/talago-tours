# API Contract: Payment Webhook

## POST /api/payments/webhook

Unsecured endpoint called by Paymob after transaction completion. HMAC signature validation is performed server-side.

### Request

```json
{
  "obj": {
    "id": 12345678,
    "pending": false,
    "success": true,
    "amount_cents": 14000,
    "currency": "EGP",
    "order": {
      "id": 987654,
      "merchant_order_id": "TLG-20260530-0001"
    }
  },
  "hmac": "a1b2c3d4e5f6..."
}
```

### Response 200 — Accepted

```json
{
  "status": "accepted",
  "bookingReference": "TLG-20260530-0001",
  "paymentStatus": "PAID"
}
```

### Response 200 — Duplicate/Ignored

```json
{
  "status": "ignored",
  "reason": "Booking already paid"
}
```

### Response 401 — Unauthorized

```json
{
  "error": "Invalid HMAC signature"
}
```

### Response 200 — Payment Failed

```json
{
  "status": "failed",
  "bookingReference": "TLG-20260530-0001",
  "paymentStatus": "FAILED"
}
```

## HMAC Validation Algorithm

1. Parse the incoming `obj` field from the JSON body
2. Extract all keys from `obj` into an array
3. Sort the array alphabetically (A-Z)
4. For each key, concatenate as `key=value` separated by `&`
5. Compute HMAC-SHA256 of the resulting string using `PAYMOB_HMAC_SECRET`
6. Compare the computed hash with the incoming `hmac` field (constant-time comparison)
7. If mismatch: reject with 401

## Idempotency

- If a webhook arrives for a booking where `paymentStatus` is already `PAID`, the endpoint returns 200 with `status: "ignored"` and does not modify the database
- If a webhook arrives for a booking where `paymentStatus` is already `FAILED`, the endpoint logs the duplicate but does not modify the booking
