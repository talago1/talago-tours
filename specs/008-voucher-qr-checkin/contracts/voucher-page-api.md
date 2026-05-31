# API Contract: Voucher Page

## GET /tours/voucher/[ref]

Public-facing page that renders the digital boarding pass for a confirmed booking.

### Route Parameter

| Param | Type | Description |
|-------|------|-------------|
| ref | string | Booking reference, e.g. "TLG-20260530-0001" |

### Success State (Booking status === "CONFIRMED")

Renders a full digital boarding pass page with:
- Forest Green (`#00473F`) header banner with logo and "CONFIRMED VOUCHER" badge
- Tour title (localized to booking language context)
- Customer full name
- Travel date (formatted)
- Guest breakdown: Adults / Children count
- Hotel name
- Pickup time window
- QR code (client-side SVG encoding `/admin/bookings/verify/[ref]`)
- "Download / Print Voucher" button (triggers `window.print()`)

Print-optimized CSS via Tailwind `print:` modifiers:
- `print:hidden` on navigation, buttons, footer
- `print:shadow-none` on card
- `print:p-0 print:m-0` for edge-to-edge layout

### Error States

| Condition | Behavior | Detail Leakage |
|-----------|----------|----------------|
| Booking status is PENDING | Error screen: "Voucher not yet available" | None |
| Booking status is CANCELLED | Error screen: "Voucher not available" | None |
| Booking ref not found | Next.js `notFound()` → 404 page | None (generic) |
| Booking exists but missing optional data | Renders "—" for missing fields | Contact info visible |
| QR generation fails client-side | Renders text fallback: "Show booking ref to staff" | None |
