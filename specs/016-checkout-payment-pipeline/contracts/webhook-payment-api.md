# Contract: POST /api/webhooks/payment

## Purpose
Unauthenticated webhook listener that receives asynchronous payment confirmations from Paymob/Fawry, verifies the cryptographic signature, and atomically updates booking and transaction status.

## Request

**Method**: POST
**Auth Required**: No (HMAC-signed payload)
**Content-Type**: application/json (varies by provider — Paymob sends typed webhook payloads)

**Headers**:
```
X-HMAC-Signature: <hex-encoded HMAC-SHA256>
Content-Type: application/json
```

### Paymob Webhook Payload Shape
```json
{
  "obj": {
    "id": 123456,
    "amount_cents": 15000,
    "currency": "EGP",
    "order": {
      "merchant_order_id": "uuid-txn-reference"
    },
    "success": true,
    "is_refund": false,
    "created_at": "2026-06-15T10:30:00.000Z"
  },
  "type": "TRANSACTION",
  "hmac": "computed-hmac-value"
}
```

### Fawry Webhook Payload Shape
```json
{
  "merchantRefNum": "uuid-txn-reference",
  "paymentAmount": 150.00,
  "orderStatus": "Paid",
  "signature": "computed-signature-value"
}
```

## Response

### Success — Processed (200)
```json
{
  "status": "processed",
  "bookingId": "uuid-booking",
  "bookingStatus": "CONFIRMED"
}
```

### Invalid Signature (401)
```json
{
  "error": "Invalid signature. Request rejected.",
  "code": "INVALID_SIGNATURE"
}
```

### Not Found — Transaction reference unknown (404)
```json
{
  "error": "No transaction found for the given reference.",
  "code": "TRANSACTION_NOT_FOUND"
}
```

### Already Processed (200 — idempotent)
```json
{
  "status": "already_processed",
  "bookingId": "uuid-booking",
  "bookingStatus": "CONFIRMED"
}
```

## Implementation Notes

- **Signature verification FIRST**: Compute HMAC-SHA256 of the sorted (alphanumeric keys) request body using the merchant secret. Use constant-time comparison (`timingSafeEqual`). If invalid, return 401 immediately — no DB reads/writes.
- **Atomic update**: Use `prisma.$transaction` to update Transaction.status→SUCCESS and Booking.status→CONFIRMED together.
- **Idempotency**: Check if Transaction.status is already SUCCESS — if so, return 200 with `already_processed` and skip re-processing.
- **Downstream triggers** after successful transaction:
  - If `amountDueOnArrival > 0`: flag for Feature 11 manifest (set `collectionDue` field on Booking or emit event)
  - Trigger QR voucher compilation for Feature 12
- **Provider adaptation**: Paymob and Fawry have different payload shapes. Detect by presence of `obj.order.merchant_order_id` (Paymob) vs `merchantRefNum` (Fawry). Map to the internal `gatewayReference` field on Transaction.
- **Currency validation**: Verify the webhook's currency matches the Transaction's currency.
