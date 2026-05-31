# Quickstart: Secure Payment Integration & Webhook Orchestrator

Implementation steps in dependency order.

## Prerequisites

- Feature 006 complete (Booking model with status and bookingReference)
- Prisma client generated (`npx prisma generate`)
- PostgreSQL database running with `DATABASE_URL` set
- Paymob merchant account with API key, integration ID, and HMAC secret

## Step 1: Extend Booking Model in Prisma Schema

Add to the existing `Booking` model in `prisma/schema.prisma`:

```prisma
paymentStatus      String?  @default(null)
paymentGatewayLogs Json     @default("[]")
```

Push schema:

```bash
npx prisma db push
npx prisma generate
```

## Step 2: Set Environment Variables

Add to `.env.local`:

```bash
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_HMAC_SECRET=your_hmac_secret
```

## Step 3: Create Payment Types + Env Verification

Files:
- `src/types/payment.ts` — PaymentInitiationRequest, PaymentInitiationResponse, WebhookPayload, PaymentStatus interfaces
- `src/lib/env.ts` — verifyPaymobEnv() helper that checks all 3 vars on import, throws if missing

## Step 4: Create Paymob API Helpers

File: `src/utils/paymob.ts`

- `getAuthToken()` — POST /api/auth/tokens → returns token
- `registerOrder(token, booking)` — POST /api/ecommerce/orders → returns order
- `getPaymentKey(token, order, booking, billingData)` — POST /api/acceptance/payment_keys → returns paymentKey
- `buildRedirectUrl(paymentKey)` — constructs iframe URL

## Step 5: Create Initiate Payment Endpoint

File: `src/app/api/payments/initiate/route.ts`

- Verify env vars on handler call
- Fetch booking from Prisma by bookingReference
- Check booking is not already paid
- Call Paymob helpers: auth → order → payment key
- Set booking.paymentStatus = "PROCESSING"
- Return { redirectUrl, bookingReference, paymentStatus }

## Step 6: Create Webhook Endpoint

File: `src/app/api/payments/webhook/route.ts`

- Parse raw JSON body
- Extract obj, compute HMAC-SHA256 (alphanumeric sort)
- Compare with incoming hmac (constant-time)
- If mismatch: return 401
- If match:
  - Extract merchant_order_id → find booking
  - If success === true: atomic Prisma update (paymentStatus=PAID, status=CONFIRMED)
  - If success === false: atomic update (paymentStatus=FAILED)
  - Append log to paymentGatewayLogs array
  - Return 200

## Step 7: Create Payment Transitional Page

File: `src/app/tours/checkout/pay/page.tsx`

- `"use client"` component
- On mount: fetch POST /api/payments/initiate with bookingReference (from URL query params or router state)
- On success: `window.location.href = redirectUrl`
- On error: show error state with retry
- Fallback: coral CTA button (`bg-[#FF5B00]`) if redirect doesn't auto-fire
- Visual: Forest Green (#00473F) text "Securing your transaction connection...", enterprise spinner with coral animation

## Step 8: Verify End-to-End

1. `npm run dev`
2. Navigate to `/tours/checkout/pay?reference=TLG-20260530-0001`
3. Confirm redirect to Paymob iframe with correct amount
4. Simulate webhook: send signed POST to `/api/payments/webhook`
5. Confirm booking.paymentStatus = "PAID" and status = "CONFIRMED" in the database
6. Send invalid HMAC → confirm 401
7. Send duplicate webhook → confirm 200 with "ignored"
