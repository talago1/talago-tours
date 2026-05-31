# Quickstart: Automated Digital Tour Voucher & QR Check-In Engine

Implementation steps in dependency order.

## Prerequisites

- Feature 006 complete (Booking model with status, bookingReference, language)
- Feature 007 complete (Booking model with paymentStatus, paymentGatewayLogs)
- Prisma client generated (`npx prisma generate`)
- PostgreSQL database running with `DATABASE_URL` set
- Admin authentication system in place (protects verify endpoint)

## Step 1: Extend Booking Model in Prisma Schema

Add to the existing `Booking` model in `prisma/schema.prisma`:

```prisma
isCheckedIn  Boolean    @default(false)
checkedInAt  DateTime?
checkInLog   Json       @default("[]")
```

Push schema:

```bash
npx prisma db push
npx prisma generate
```

## Step 2: Create Voucher Types + Audit Log Helper

Files:
- `src/types/voucher.ts` — `TicketVoucherProps`, `VerifiedVoucherPayload`, `CheckInLogEntry`, `VerifyResponse` interfaces
- `src/utils/voucherLogManager.ts` — `appendCheckInLog(booking, timestamp)` helper that constructs the audit entry

## Step 3: Create Voucher Page (RSC)

File: `src/app/tours/voucher/[ref]/page.tsx`

- RSC: fetch Booking by `params.ref` using Prisma
- Guard: if `status !== "CONFIRMED"` → render secure error boundary
- Guard: if booking not found → `notFound()`
- Render boarding pass card:
  - Forest Green (#00473F) header with logo + "CONFIRMED VOUCHER" badge
  - Tour title (localized to booking language)
  - Customer name, travel date, guest breakdown, hotel, pickup time
  - QR code component (`<QrGeneratorCard ref={ref} />`)
  - "Download / Print Voucher" button → `window.print()`
- Tailwind `print:` modifiers on nav, buttons, shadows

## Step 4: Create QR Generator Component

File: `src/components/vouchers/QrGeneratorCard.tsx`

- `"use client"` component
- Pure TypeScript QR matrix encoder (no external dependencies)
- Encodes: `https://talago.com/admin/bookings/verify/[ref]`
- Renders QR as inline `<svg>` in a reserved 200x200px container
- Error correction: Level M (15%)
- Fallback: text message if QR encoding fails

## Step 5: Create Admin Verify Endpoint

File: `src/app/api/admin/bookings/verify/[ref]/route.ts`

- PATCH handler, protected by admin auth middleware
- Parse body: `{ action: "confirm_checkin" }`
- Fetch Booking by `ref`
- Check `checkInLog` for existing `QR_CHECK_IN` event
- If duplicate: return 400 with original timestamp
- If first check-in: atomic `$transaction`:
  - `isCheckedIn = true`
  - `checkedInAt = new Date()`
  - `checkInLog.push({ event: "QR_CHECK_IN", timestamp, scanStatus: "SUCCESS" })`
- Return 200 with success confirmation

## Step 6: Cross-Feature Integration (Option C)

### Checkout Success Page

File: `src/app/tours/checkout/success/page.tsx` (modify existing)

Inject a Coral-styled (`bg-[#FF5B00]`) anchor link below the success message:

```html
<a href="/tours/voucher/[ref]"
   class="inline-block bg-[#FF5B00] text-white px-6 py-3 rounded-lg font-semibold">
  View Your Digital Voucher & QR Code
</a>
```

### WhatsApp Message Template

File: `src/utils/whatsappLinkBuilder.ts` (modify existing)

Append to each locale's template string:

```text
📱 Your Digital Voucher & QR Code: https://talago.com/tours/voucher/[ref]
```

For each language (EN, DE, RU, FR, IT, TR), localize the label text while keeping the URL absolute.

## Step 7: Verify End-to-End

1. `npm run dev`
2. Create a booking with status `CONFIRMED`
3. Navigate to `/tours/voucher/TLG-20260530-0001`
4. Confirm full boarding pass renders with all details and QR code
5. Click "Download / Print Voucher" → confirm print dialog opens
6. Use browser print preview → confirm no web UI elements visible
7. Navigate to `/admin/bookings/verify/TLG-20260530-0001` → confirm check-in form
8. Submit check-in → confirm `isCheckedIn=true` in DB
9. Submit check-in again → confirm 400 with "already claimed" error
10. Test PENDING booking → confirm error screen
11. Test CANCELLED booking → confirm error screen
12. Test invalid ref → confirm 404
13. Navigate to checkout success page → confirm voucher CTA button present
14. Trigger WhatsApp message → confirm voucher link included
