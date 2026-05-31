# Research: Booking Queue & WhatsApp Automation

## NEEDS CLARIFICATION Resolution

All ambiguities from the spec were resolved during the clarification session (2026-05-30). See `spec.md` sections `## Clarifications` and `## Assumptions` for full record.

### Resolved Items

| Topic | Decision |
|-------|----------|
| WhatsApp message localization | Full 6-language support (EN, DE, RU, FR, IT, TR) |
| Status lifecycle transitions | Linear forward: PENDING→CONFIRMED→COMPLETED; CANCELLED from PENDING or CONFIRMED |
| Booking reference format | `TLG-{YYYYMMDD}-{XXXX}` with 4-digit daily counter |
| Expected booking volume | < 100 active bookings — no pagination needed for v1 |
| Loading state UX | Skeleton rows matching table/card dimensions |
| WhatsApp not available | Silent fail — `wa.me` native fallback |

## Technology Decisions

### WhatsApp Deep-Link Protocol

**Decision**: Use `https://api.whatsapp.com/send?phone={number}&text={encodedMessage}`

**Rationale**: Standard WhatsApp protocol. The `wa.me` shortcut (`https://wa.me/{number}?text={message}`) is equivalent but `api.whatsapp.com/send` is more widely supported across platforms. Both use `encodeURIComponent` for the message parameter.

**Phone format**: International format without `+` prefix (e.g., `201234567890`). The API handles stripping the `+` if present.

### Optimistic Update Pattern

**Decision**: Local state mutation on selection → PATCH fetch → confirm or revert

**Rationale**: Standard React optimistic UI pattern. No external state library needed — local `useState` with manual rollback on `.catch()` is sufficient for single-admin, low-volume scenario (<100 bookings).

### Responsive Breakpoint

**Decision**: `lg:` (1024px) threshold for table vs. card layout

**Rationale**: Matches Tailwind's default `lg` breakpoint. Desktop screens ≥1024px get the spreadsheet table; anything below gets stacked action cards.

### Color Tokens for Status Badges

| Status | Background | Text | Classification |
|--------|------------|------|----------------|
| PENDING | `bg-amber-100` | `text-amber-800` | Awaiting action |
| CONFIRMED | `bg-emerald-100` | `text-emerald-800` | Active/positive |
| COMPLETED | `bg-blue-100` | `text-blue-800` | Informational/done |
| CANCELLED | `bg-gray-100` | `text-gray-800` | Inactive/neutral |

## Dependencies

### New Dependencies to Install

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | latest | Icons for WhatsApp button (MessageCircle), status indicators |

### Existing Dependencies (no change)

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router) |
| `react` | UI library |
| `@prisma/client` | Database access |
| `@supabase/supabase-js` | Storage (not used directly in this feature) |

## Architecture Flow

```
[Admin visits /admin/bookings]
  → page.tsx (RSC): fetches all bookings from Prisma, maps to ActiveQueueTicket[]
  → BookingQueue.tsx ("use client"): receives initialBookings prop
    → Renders responsive table (>=lg) or cards (<lg)
    → Each row/card contains BookingRowActions.tsx
      → StatusDropdown: on change → optimistic update → PATCH API → confirm/revert
      → WhatsAppButton: onClick → buildWhatsAppUrl() → window.open(...)

[PATCH /api/admin/bookings/{id}/status]
  → Validate payload status string against BookingStatus enum
  → Validate transition is legal for current status
  → Prisma: update booking status
  → Return 200 with updated booking
```

## Pickup Time Derivation

The `pickupTime` is extracted from the first milestone's time tag in `tour.itinerary` JSON:

```typescript
pickupTime: tour.itinerary?.[0]?.time ?? null
```

If the tour has no itinerary, or the itinerary has no milestones, `pickupTime` is `null` and the time placeholder is omitted from the WhatsApp message.
