# Research: Secure Payment Integration & Webhook Orchestrator

## Technology Decisions

### Paymob API Integration Flow

**Decision**: Follow Paymob's standard 3-step payment initialization:
1. **Authentication**: POST `https://accept.paymob.com/api/auth/tokens` with `PAYMOB_API_KEY` to obtain a 24-hour auth token
2. **Order Registration**: POST `https://accept.paymob.com/api/ecommerce/orders` with auth token, amount_cents, currency (EGP), and merchant_order_id (bookingReference)
3. **Payment Key**: POST `https://accept.paymob.com/api/acceptance/payment_keys` with order ID, auth token, billing data (customer email, name, phone), and integration ID
4. **Return URL**: Construct `https://accept.paymob.com/api/acceptance/iframes/INTEGRATION_ID?payment_token=PAYMENT_KEY`

**Rationale**: This is the official Paymob Accept SDK flow. The iframe URL approach avoids PCI scope (card data goes directly to Paymob). No card data ever touches our servers.

**Alternatives considered**: Direct iFrame embedding (requires more complex postMessage handling — avoided for simplicity).

### HMAC Signature Validation

**Decision**: Follow Paymob's HMAC-SHA256 alphanumeric sort algorithm:

```typescript
// 1. Extract all obj fields into an array
// 2. Sort array keys alphabetically (A-Z)
// 3. Concatenate as key=value pairs separated by &
// 4. Compute HMAC-SHA256 with PAYMOB_HMAC_SECRET
// 5. Compare computed hash with incoming hmac field (constant-time comparison)
```

**Rationale**: Paymob's official webhook security model. Paymob computes the HMAC over the `obj` JSON payload only (not the entire webhook). The `hmac` field in the webhook is the expected signature.

**Edge case**: Paymob delivers the webhook as a JSON string in the `obj` field — the system must parse it with `JSON.parse()` before computing HMAC.

### Atomic Prisma Transaction

**Decision**: Use Prisma's `$transaction` to atomically update both `paymentStatus` and `status`:

```typescript
await prisma.$transaction([
  prisma.booking.update({
    where: { bookingReference },
    data: { paymentStatus: 'PAID', status: 'CONFIRMED', paymentGatewayLogs },
  }),
]);
```

**Rationale**: Ensures both fields update together — no partial state. If the transaction fails, both fields remain unchanged.

### Env Var Verification

**Decision**: Create a `lib/env.ts` utility that verifies required env vars on import and throws explicit errors if missing:

```typescript
// Required at boot:
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY!;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID!;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET!;
```

**Rationale**: Fail-fast principle. If env vars are missing, the application should crash at startup rather than at runtime during payment processing.

### Payment Status Lifecycle

**Decision**: Three-state enum for paymentStatus:

| State | Description | Entry Condition |
|-------|-------------|-----------------|
| PROCESSING | Awaiting gateway confirmation | Set on successful payment initiation |
| PAID | Payment confirmed by gateway | Set by webhook on `success: true` |
| FAILED | Payment failed or declined | Set when webhook indicates failure, or gateway redirects with failure |

If a `PROCESSING` booking remains unpaid for >24 hours, it should be flagged for manual admin review (reconciliation concern, out of scope for v1).

## Dependencies

### New Dependencies to Install

None — all required functionality is built-in:
- `crypto` module (Node.js built-in) for HMAC-SHA256
- `fetch` (Next.js built-in / native) for Paymob API calls
- No third-party SDK needed for Paymob integration

### Existing Dependencies (no change)

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router) |
| `react` | UI library |
| `@prisma/client` | Database access |

## Architecture Flow

```
[Customer at /tours/checkout/pay]
  → page.tsx mounts ("use client")
  → fetch POST /api/payments/initiate { bookingReference }
    → Initiate Route (server):
      1. Fetch Booking from Prisma
      2. POST Paymob /auth/tokens → auth_token
      3. POST Paymob /ecommerce/orders → order_id
      4. POST Paymob /acceptance/payment_keys → payment_token
      5. Set booking.paymentStatus = "PROCESSING"
      6. Return { redirectUrl }
  → window.location.href = redirectUrl

[Paymob processes payment]
  → Customer completes payment on Paymob iframe
  → Paymob sends POST /api/payments/webhook
    → Webhook Route (server):
      1. Parse raw body
      2. Compute HMAC-SHA256 (alphanumeric sort)
      3. Compare with incoming hmac
      4. If match && success: atomic Prisma update
      5. Log transaction to paymentGatewayLogs
      6. Return 200
  → Paymob redirects customer to /tours/checkout/success
```

## Paymob API Reference

### Authentication Token

```
POST https://accept.paymob.com/api/auth/tokens
Body: { "api_key": "PAYMOB_API_KEY" }
Response: { "token": "..." }  (24-hour expiry)
```

### Order Registration

```
POST https://accept.paymob.com/api/ecommerce/orders
Headers: Authorization: Bearer {token}
Body: {
  "auth_token": token,
  "delivery_needed": "false",
  "amount_cents": 14000,  // EGP cents
  "currency": "EGP",
  "merchant_order_id": "TLG-20260530-0001"
}
Response: { "id": 123456, ... }
```

### Payment Key

```
POST https://accept.paymob.com/api/acceptance/payment_keys
Headers: Authorization: Bearer {token}
Body: {
  "auth_token": token,
  "amount_cents": 14000,
  "expiration": 3600,
  "order_id": 123456,
  "billing_data": {
    "apartment": "NA", "email": "customer@example.com",
    "floor": "NA", "first_name": "John", "street": "NA",
    "building": "NA", "phone_number": "+201234567890",
    "shipping_method": "NA", "postal_code": "NA",
    "city": "NA", "country": "EG", "last_name": "Doe",
    "state": "NA"
  },
  "currency": "EGP",
  "integration_id": PAYMOB_INTEGRATION_ID,
  "lock_order_when_paid": "true"
}
Response: { "token": "..." }  (payment key / iframe token)
```

### Iframe Redirect URL

```
https://accept.paymob.com/api/acceptance/iframes/{INTEGRATION_ID}?payment_token={PAYMENT_KEY}
```

### Webhook Payload

```typescript
interface WebhookPayload {
  obj: {
    id: number;            // Paymob transaction ID
    pending: boolean;
    success: boolean;
    amount_cents: number;
    currency: string;
    order: {
      id: number;
      merchant_order_id: string;  // Our bookingReference
    };
  };
  hmac: string;            // HMAC-SHA256 signature
}
```
