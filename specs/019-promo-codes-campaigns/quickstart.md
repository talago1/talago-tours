# Quickstart: Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine

**Feature**: 019-promo-codes-campaigns  
**Date**: 2026-05-31

## Development Setup

### 1. Database Schema Sync

```bash
# Apply the new PromoCode model and DiscountType enum
npx prisma db push
```

### 2. Seeding Mock Data

```bash
# Generate test promo codes for development
npm run db:seed
```

## Verification Endpoints

### Validate a Promo Code:

```bash
curl -X POST http://localhost:3000/api/public/promo/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER25",
    "bookingValue": 250.00,
    "currency": "EGP"
  }'
```

### Create a Promo Code (Admin Session Required):

```bash
curl -X POST http://localhost:3000/api/admin/campaigns/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "WELCOME10",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "currency": "EGP",
    "minBookingValue": 50,
    "maxUses": 100,
    "expiresAt": "2026-12-31T23:59:59.000Z"
  }'
```

## Component Integration Reference

- **Promo Form**: `components/checkout/PromoForm.tsx` — Renders inside the checkout column. Must be `"use client"` for input/button interaction. Calls `POST /api/public/promo/validate` on Apply click. Shows inline loading, success, or error states.
- **Price Summary Sidebar**: `components/checkout/PriceSummarySidebar.tsx` — Displays the original price, slashed with line-through on promo success, and the discounted total in Coral `#FF5B00`.
- **Admin Campaigns Page**: `app/admin/campaigns/page.tsx` — Server component that fetches all promo codes. Includes a create form modal and a grid with usage progress bars.

## Testing Guide

### Unit Tests

```bash
# Run unit tests
npm run test:unit
```

Key target suites:
- `tests/unit/promoCalculation.test.ts`: Verifies percentage and fixed-amount discount math, floor clamping, and edge cases (zero total, negative prevention).
- `tests/unit/promoValidation.test.ts`: Asserts all 6 constraint checks (existence, active, expiry, usage cap, min value, currency).

### E2E / Integration Tests

```bash
npx playwright test
```

Key target specs:
- `tests/e2e/promo-checkout-flow.spec.ts`: Navigate to checkout, enter a valid promo code, verify discount appears, complete payment. Then test an expired code shows an error.
