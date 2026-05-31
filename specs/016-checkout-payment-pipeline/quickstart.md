# Feature 016: Hybrid Checkout & Payment Pipeline — Quickstart

## Prerequisites

- Feature 005 (Booking model) — Booking model must exist with status field
- Feature 007 (Payment webhook) — Paymob env vars configured: PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_HMAC_SECRET
- Feature 015 (Tour catalog) — Tours with basePrice must exist for checkout
- Environment variables: `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_HMAC_SECRET`, `QR_HMAC_SECRET`

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Modify (add Transaction model + PaymentScheme/PaymentStatus/PaymentProvider enums + Booking fields + Tour.maxCapacity) |
| 2 | `src/types/checkout.ts` | Create (CheckoutFormData, InitializeRequest, InitializeResponse, PriceBreakdown interfaces) |
| 3 | `src/utils/payment.ts` | Create (Paymob/Fawry API helpers: auth, order creation, payment key) |
| 4 | `src/lib/webhook.ts` | Create (HMAC-SHA256 verification utility with alphanumeric sort + timingSafeEqual) |
| 5 | `src/app/api/checkout/initialize/route.ts` | Create (POST handler: capacity check → pricing split → gateway handshake) |
| 6 | `src/app/api/webhooks/payment/route.ts` | Create (POST handler: HMAC verify → atomic status update → downstream triggers) |
| 7 | `src/components/checkout/PriceSummarySidebar.tsx` | Create (sticky pricing sidebar: scheme-aware breakdown, Coral cash-due display) |
| 8 | `src/app/checkout/[tourId]/page.tsx` | Create (checkout page: 2-column layout, form, sidebar integration) |
| 9 | `AGENTS.md` | Modify (update plan reference) |

## Steps

### 1. Prisma Schema

Add enums to `prisma/schema.prisma`:

```prisma
enum PaymentScheme {
  FULL_ONLINE
  DEPOSIT_ONLINE
  PAY_ON_ARRIVAL
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PaymentProvider {
  PAYMOB
  FAWRY
  CASH
}
```

Add Transaction model:

```prisma
model Transaction {
  id                String          @id @default(uuid())
  bookingId         String          @unique
  booking           Booking         @relation(fields: [bookingId], references: [id])
  provider          PaymentProvider
  gatewayReference  String?         @unique
  amountPaidOnline  Decimal         @default(0)
  amountDueOnArrival Decimal        @default(0)
  currency          String          @default("EGP")
  scheme            PaymentScheme   @default(FULL_ONLINE)
  status            PaymentStatus   @default(PENDING)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

Add to Booking model:

```prisma
  paymentScheme     PaymentScheme?
  amountPaidOnline  Decimal?
  amountDueOnArrival Decimal?
```

Add to Tour model:

```prisma
  maxCapacity       Int?
```

Run `npx prisma migrate dev --name add-payment-pipeline`

### 2. TypeScript Interfaces

Create `src/types/checkout.ts` with:
- `CheckoutFormData` — leadName, email, phone, hotelName, roomNumber?, pickupTime, paymentScheme
- `InitializeRequest` — tourId, departureDate, guestCount, formData
- `InitializeResponse` — bookingId, transactionId, amountPaidOnline, amountDueOnArrival, scheme, gatewayIframeUrl?
- `PriceBreakdown` — total, amountPaidOnline, amountDueOnArrival, scheme

### 3. Payment Utility

Create `src/utils/payment.ts`:
- `initiatePaymobSession(total: Decimal): Promise<string>` — auth → order → payment key → return iframe URL
- `initiateFawrySession(total: Decimal): Promise<string>` — Fawry hosted page flow

### 4. Webhook Utility

Create `src/lib/webhook.ts`:
- `verifyHmacSignature(payload: string, signature: string, secret: string): boolean` — HMAC-SHA256 with alphanumeric key sort + `timingSafeEqual`

### 5. Checkout Initialize API

Create `src/app/api/checkout/initialize/route.ts`:
- Parse request body (InitializeRequest)
- Lookup tour, get basePrice and maxCapacity
- Check capacity: count CONFIRMED bookings for tourId + departureDate, compare to maxCapacity
- Compute splits: total = basePrice * guestCount; apply scheme fraction
- Wrap in Prisma `$transaction`:
  - For PAY_ON_ARRIVAL: create Booking (CONFIRMED) + Transaction (PENDING, provider=CASH)
  - For online: create Booking (PENDING) + Transaction (PENDING) → gateway handshake → get iframe URL
- Return InitializeResponse

### 6. Payment Webhook

Create `src/app/api/webhooks/payment/route.ts`:
- Extract HMAC signature from header
- Read raw body, verify HMAC — reject (401) if invalid
- Parse provider-specific payload (Paymob vs Fawry)
- Find Transaction by gatewayReference
- If already SUCCESS → return idempotent 200
- Use `prisma.$transaction`:
  - Update Transaction.status → SUCCESS
  - Update Booking.status → CONFIRMED
- If amountDueOnArrival > 0: set flag for Feature 11 manifest
- Trigger QR voucher generation (Feature 12)
- Return 200

### 7. PriceSummarySidebar Component

Create `src/components/checkout/PriceSummarySidebar.tsx` (must be `"use client"`):
- Props: `tourTitle: string`, `guestCount: number`, `basePrice: number`, `scheme: PaymentScheme`, `onSchemeChange: (scheme: PaymentScheme) => void`
- Display: tour title, guest count, "Base Price × Guests" line
- Scheme toggle: 3 buttons/radios for FULL_ONLINE, DEPOSIT_ONLINE, PAY_ON_ARRIVAL
- Price breakdown:
  - Total: basePrice × guestCount
  - Amount due online (prominent if >0)
  - Balance on arrival (Coral `text-[#FF5B00] text-xl font-bold` if >0)
- Reactive: recalculates immediately when scheme changes
- Sticky: `sticky top-8` on desktop

### 8. Checkout Page

Create `src/app/checkout/[tourId]/page.tsx` (must be `"use client"`):
- Fetch tour details (title, basePrice, maxCapacity) server-side or via client API
- Layout: `grid grid-cols-1 lg:grid-cols-3 gap-8`
- Left (2 cols): Form with fields for leadName, email, phone, hotelName, roomNumber, pickupTime
- Right (1 col): `<PriceSummarySidebar>`
- On submit: POST to `/api/checkout/initialize`
  - If PAY_ON_ARRIVAL: show confirmation with booking reference + amount due
  - If online: redirect to gateway iframe URL (or open in new window)
- States: loading (spinner on submit), error (validation messages, API errors), success (confirmation)
- Mobile: form stacks vertically, sidebar becomes collapsible bottom sheet

### 9. Agent Context

Update `AGENTS.md` plan reference to point to `specs/016-checkout-payment-pipeline/plan.md`

## Architecture Flow

```
Checkout Page Load:
  /checkout/[tourId] → fetch tour details → render form + sidebar

Form Submit:
  Tourist fills form → selects scheme → clicks Submit
    ↓
  POST /api/checkout/initialize
    ↓
  Server: capacity check → pricing split → create booking + transaction
    ↓
  PAY_ON_ARRIVAL: return confirmation (Booking CONFIRMED)
  ONLINE: gateway handshake → return iframe URL → redirect tourist

Webhook:
  Paymob/Fawry → POST /api/webhooks/payment
    ↓
  HMAC verify → $transaction: Transaction→SUCCESS, Booking→CONFIRMED
    ↓
  amountDueOnArrival > 0? → flag for Feature 11 manifest
  Trigger QR voucher → Feature 12
```
