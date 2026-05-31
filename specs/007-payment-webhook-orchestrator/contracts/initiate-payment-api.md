# API Contract: Initiate Payment

## POST /api/payments/initiate

Creates a Paymob payment session and returns the gateway redirect URL.

### Request

```json
{
  "bookingReference": "TLG-20260530-0001"
}
```

### Response 200 — Success

```json
{
  "redirectUrl": "https://accept.paymob.com/api/acceptance/iframes/123456?payment_token=paymob_token_xyz",
  "bookingReference": "TLG-20260530-0001",
  "paymentStatus": "PROCESSING"
}
```

### Response 400 — Booking Not Found

```json
{
  "error": "Booking not found"
}
```

### Response 400 — Already Paid

```json
{
  "error": "Booking is already paid"
}
```

### Response 500 — Gateway Error

```json
{
  "error": "Failed to initialize payment gateway"
}
```

### Response 500 — Configuration Error

```json
{
  "error": "Payment gateway not configured"
}
```

## Error Codes Reference

| HTTP Status | Condition |
|-------------|-----------|
| 200 | Payment session created successfully |
| 400 | Booking not found or already paid |
| 500 | Paymob API failure or missing configuration |
