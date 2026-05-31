# Research: Automated Digital Tour Voucher & QR Check-In Engine

## Technology Decisions

### QR Code Generation Strategy

**Decision**: Pure TypeScript client-side SVG QR code generator with zero external dependencies. The QR algorithm encodes the verification URL using byte mode encoding with Reed-Solomon error correction level M (15%). The result is rendered as an inline SVG string in a `"use client"` React component.

**Rationale**: The constitution requires zero third-party animation bloat and the spec demands "zero-dependency SVG QR renderer". A pure TypeScript QR matrix implementation avoids any CDN dependency, works offline, and produces crisp SVG output at any resolution — essential for scanning under bright desert/sea sunlight.

**Alternatives considered**:
- `qrcode` npm package: Adds bundle weight (~50KB) and a third-party dependency for something we can implement in ~200 lines of TypeScript.
- Third-party CDN QR API: Introduces network dependency and privacy concern (sending booking references to external service).

### Audit Log Structure (Option A)

**Decision**: Append-only JSON array stored on the Booking model as `checkInLog`:

```typescript
type CheckInLogEntry = {
  event: "QR_CHECK_IN";
  timestamp: string;  // ISO 8601
  scanStatus: "SUCCESS";
};
```

**Rationale**: Same pattern as `paymentGatewayLogs` from Feature 007 — consistent append-only audit trail on the Booking record. For SUCCESS events, the check-in timestamp is also stored in the dedicated `checkedInAt` DateTime field for easy querying.

### Print Optimization Strategy

**Decision**: Use Tailwind `print:` modifiers exclusively — no custom CSS or `@media print` blocks. Key modifiers:

- `print:hidden` — navigation, buttons, footer, header chrome
- `print:shadow-none` — card shadow removal
- `print:p-0 print:m-0` — margin/padding reset for edge-to-edge
- `print:border-none` — remove decorative borders

**Rationale**: Tailwind's `print:` variant compiles to `@media print` queries in the generated CSS, which is the standard approach. No additional build tooling needed. The modifiers are applied directly to the elements that need print behavior changes, keeping the logic co-located with the markup.

### Anti-Fraud Duplicate Check-In Detection

**Decision**: Check the `checkInLog` JSON array for an existing `QR_CHECK_IN` event before allowing check-in. If found, return `400 Bad Request` with the original timestamp from the first entry. Use Prisma's `$transaction` for atomicity.

**Rationale**: The JSON array check is the authoritative source (append-only, never mutated). The dedicated `isCheckedIn` boolean and `checkedInAt` fields provide fast queryability. The atomic transaction ensures both fields update together.

### Voucher Delivery Integration (Option C)

**Decision**: Dual-channel delivery:
1. **Checkout success page**: Inject a Coral-styled anchor `<a>` tag linking to `/tours/voucher/[ref]` with the text "View Your Digital Voucher & QR Code"
2. **WhatsApp message**: Append a line `📱 Your Digital Voucher & QR Code: https://talago.com/tours/voucher/[ref]` to the message template string in `whatsappLinkBuilder.ts`

**Rationale**: The success page gives immediate post-purchase access. The WhatsApp message provides persistent access from the tourist's messaging app — critical when they're at the hotel/pickup point the next day and may not have the success page bookmarked.

## Dependencies

### New Dependencies to Install

None — all required functionality is built-in:
- QR encoding: Pure TypeScript implementation (no npm package)
- `crypto` module (Node.js built-in) — only needed if HMAC is used for QR token signing (out of scope for v1)
- No third-party QR or PDF libraries needed

### Existing Dependencies (no change)

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router) |
| `react` | UI library |
| `@prisma/client` | Database access |
| `tailwindcss` | CSS utility framework (print modifiers) |

## Architecture Flow

```
[Tourist at checkout success page]
  → Sees "View Your Digital Voucher & QR Code" CTA button (Coral #FF5B00)
  → Clicks → navigates to /tours/voucher/[ref]
    → Voucher Page (RSC):
      1. Fetch Booking from Prisma where bookingReference = ref
      2. If status !== "CONFIRMED" → render error boundary (no data leakage)
      3. If booking not found → render generic "not found" screen
      4. Render full boarding pass: tour title, customer name, travel date,
         guests, hotel, pickup time, QR code
    → QR Code Component ("use client"):
      1. On mount: generate QR matrix from verification URL
      2. Render as inline SVG in reserved container
      3. Tourist clicks "Download / Print Voucher" → window.print()

[Staff on mobile at pickup point]
  → Has admin session open from shift start (logged into admin)
  → Scans QR code → follows link to /admin/bookings/verify/[ref]
    → Admin Verify Page:
      1. Check checkInLog for existing QR_CHECK_IN event
      2. If found: show bright alert "Already checked in at [timestamp]"
      3. If not: show booking summary + "Confirm Check-In" button
    → Staff taps "Confirm Check-In"
      → PATCH /api/admin/bookings/verify/[ref]
        1. Atomic Prisma $transaction:
           - Set isCheckedIn = true
           - Set checkedInAt = now()
           - Append { event: "QR_CHECK_IN", timestamp, scanStatus: "SUCCESS" }
        2. Return success confirmation
```

## Edge Cases

### QR Code Generation Failure
If the client-side QR algorithm encounters an encoding error (extremely rare — only with excessively long URLs), the voucher still renders all text details. The QR container shows a fallback message: "QR code unavailable — please show your booking reference to staff."

### Booking with Missing Optional Data
If hotel name or pickup time are missing from the booking record, the voucher renders those fields as "—" (em dash) rather than omitting them. The layout structure is preserved.

### Duplicate WhatsApp Message
The voucher link is appended to the confirmation message template. If the WhatsApp message is resent (admin retrigger), the link appears in the new message — this is acceptable since the voucher URL is idempotent.

### Non-Existent Booking Reference
The voucher route returns a Next.js `notFound()` error, which renders the app's standard 404 layout. No booking data is exposed.
