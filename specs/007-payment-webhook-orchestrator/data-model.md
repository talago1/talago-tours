# Data Model: Secure Payment Integration & Webhook Orchestrator

## Extended Entity: Booking (payment fields)

The existing `Booking` model (from Feature 006) is extended with the following fields:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| paymentStatus | String | default: null, values: PROCESSING, PAID, FAILED | Current payment lifecycle state |
| paymentGatewayLogs | Json | default: [], nullable | Array of gateway transaction records for audit trail |

### paymentStatus Lifecycle

```
null ──(payment initiated)──→ PROCESSING ──(webhook success)──→ PAID
                                       
PROCESSING ──(webhook failure/timeout)──→ FAILED
```

| State | Meaning | Set By |
|-------|---------|--------|
| `null` | Payment not yet initiated | Default (booking created without payment) |
| PROCESSING | Awaiting gateway confirmation | Initiate API route (POST /api/payments/initiate) |
| PAID | Payment confirmed | Webhook handler (POST /api/payments/webhook) when `success: true` |
| FAILED | Payment failed or declined | Webhook handler when `success: false`, or gateway redirect with failure |

### paymentGatewayLogs JSON Structure

```typescript
type PaymentGatewayLog = {
  transactionId: number;
  amountCents: number;
  currency: string;
  success: boolean;
  pending: boolean;
  merchantOrderId: string;
  hmacValidated: boolean;
  timestamp: string;  // ISO 8601
  rawResponse?: object; // Full webhook payload for auditing
};

// Stored as JSON array in the booking record
type PaymentGatewayLogs = PaymentGatewayLog[];
```

## Enum: PaymentStatus (TypeScript)

```typescript
export type PaymentStatus = 'PROCESSING' | 'PAID' | 'FAILED';
```

## Interface: PaymentInitiationRequest (TypeScript)

```typescript
export interface PaymentInitiationRequest {
  bookingReference: string;
}
```

## Interface: PaymentInitiationResponse (TypeScript)

```typescript
export interface PaymentInitiationResponse {
  redirectUrl: string;
  bookingReference: string;
  paymentStatus: PaymentStatus;
}
```

## Interface: WebhookPayload (TypeScript)

```typescript
export interface WebhookPayload {
  obj: {
    id: number;
    pending: boolean;
    success: boolean;
    amount_cents: number;
    currency: string;
    order: {
      id: number;
      merchant_order_id: string;
    };
  };
  hmac: string;
}
```

## Prisma Schema Addition

Extend the Booking model (add to existing model):

```prisma
model Booking {
  // existing fields from Feature 006...
  
  paymentStatus      String?  @default(null)
  paymentGatewayLogs Json     @default("[]")
}
```

## Validation Rules

1. `paymentStatus` transitions: null → PROCESSING → PAID or FAILED. No backward transitions (PAID → PROCESSING not allowed).
2. `paymentGatewayLogs` — append-only array. New webhook results are pushed but never overwrite previous entries.
3. When `paymentStatus` is updated to PAID, `status` MUST also be updated to CONFIRMED in the same atomic transaction.
4. `merchant_order_id` in Paymob webhook MUST match the booking's `bookingReference` for the transaction to be accepted.
5. Env vars (`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_HMAC_SECRET`) must be validated at application boot — not at runtime.
