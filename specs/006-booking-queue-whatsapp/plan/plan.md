# Implementation Plan: Booking Queue & WhatsApp Automation

**Feature**: `006-booking-queue-whatsapp`
**Goal**: Admin booking queue page with status management and WhatsApp deep-link messaging.

## Scope Summary

| Phase | Deliverables | Depends On |
|-------|--------------|------------|
| 1 - Data Model | Prisma Booking model, TypeScript types, Prisma migration | None |
| 2 - WhatsApp Utils | Message templates (6 languages), deep-link builder | Phase 1 (language field) |
| 3 - API Layer | GET /api/admin/bookings, PATCH /api/admin/bookings/[id]/status | Phase 1 |
| 4 - Queue UI | BookingQueue, StatusBadge, WhatsAppButton, responsive layout, optimistic updates | Phase 2, Phase 3 |
| 5 - Queue Page | Server component at /admin/bookings, wire everything | Phase 4 |
| 6 - Verify | Seed data, test flow, verify responsive rendering | Phase 5 |

---

## Phase 1 — Data Model

### 1a. Extend Prisma Schema

**File**: `prisma/schema.prisma`

Add BookingStatus enum and Booking model:

```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

model Booking {
  id               String        @id @default(cuid())
  bookingReference String        @unique
  tourId           String
  tour             Tour          @relation(fields: [tourId], references: [id])
  zoneId           String
  hotelName        String
  travelDate       DateTime
  guestCount       Int
  totalPriceUSD    Float
  customerName     String
  customerEmail    String
  customerPhone    String
  language         String        @default("en")
  status           BookingStatus @default(PENDING)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}
```

The `language` field stores the 2-letter code (`en`, `de`, `ru`, `fr`, `it`, `tr`) captured at booking time for WhatsApp message localization.

### 1b. TypeScript Types

**File**: `src/types/booking.ts`

```typescript
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ActiveQueueTicket {
  id: string;
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  customerPhone: string;
  travelDate: string;
  guestCount: number;
  totalPriceUSD: number;
  hotelName: string;
  pickupTime: string | null;
  status: BookingStatus;
  language: string;
}
```

The `pickupTime` is derived from the earliest itinerary milestone time tag (JSON query) — nullable if no itinerary exists.

### 1c. Prisma Migration

```bash
npx prisma db push    # or `npx prisma migrate dev --name add_booking_model`
npx prisma generate
```

---

## Phase 2 — WhatsApp Utilities

### 2a. Message Templates

**File**: `src/lib/whatsapp.ts`

6-language template map and a `buildWhatsAppUrl` function:

```typescript
const TEMPLATES: Record<string, string> = {
  en: "Hello {customerName}! Your booking {bookingReference} for {tourTitle} on {travelDate} is confirmed. Pickup: {pickupTime}. Thank you for choosing TALAGO!",
  de: "Hallo {customerName}! Ihre Buchung {bookingReference} für {tourTitle} am {travelDate} ist bestätigt. Abholung: {pickupTime}. Vielen Dank!",
  ru: "Здравствуйте, {customerName}! Бронь {bookingReference} на {tourTitle} {travelDate} подтверждена. Трансфер: {pickupTime}. Спасибо, что выбрали TALAGO!",
  fr: "Bonjour {customerName}! Réservation {bookingReference} pour {tourTitle} le {travelDate} confirmée. Prise en charge: {pickupTime}. Merci!",
  it: "Ciao {customerName}! Prenotazione {bookingReference} per {tourTitle} il {travelDate} confermata. Prelievo: {pickupTime}. Grazie!",
  tr: "Merhaba {customerName}! {bookingReference} no'lu rezervasyonunuz {tourTitle} için {travelDate} tarihinde onaylandı. Alış: {pickupTime}. Teşekkürler!",
};
```

Exported functions:
- `buildWhatsAppMessage(ticket: ActiveQueueTicket): string` — interpolates template with ticket fields, falls back to `en`
- `buildWhatsAppUrl(phone: string, message: string): string` — returns `https://wa.me/{phone}?text={encodedMessage}`

### 2b. No additional i18n infrastructure

No root layout, no i18n framework needed. The templates live as a static config in `src/lib/whatsapp.ts`.

---

## Phase 3 — API Layer

### 3a. GET /api/admin/bookings

**File**: `src/app/api/admin/bookings/route.ts`

```typescript
export async function GET(): Promise<NextResponse> {
  try {
    const bookings = await prisma.booking.findMany({
      include: { tour: { select: { title: true, itinerary: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const tickets: ActiveQueueTicket[] = bookings.map(b => ({
      // map fields + derive pickupTime from b.tour.itinerary
    }));
    return NextResponse.json({ bookings: tickets });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3b. PATCH /api/admin/bookings/[id]/status

**File**: `src/app/api/admin/bookings/[id]/status/route.ts`

```typescript
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    // Validate status is a valid BookingStatus
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });
    return NextResponse.json({ booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Pattern matches existing `sign-upload/route.ts`: try/catch, `NextRequest`, `NextResponse.json`, guard clauses.

---

## Phase 4 — Queue UI Components

### 4a. StatusBadge

**File**: `src/components/admin/StatusBadge.tsx`

Props: `{ status: BookingStatus }`
Renders: `<span>` with Tailwind color classes:
- PENDING → `bg-amber-100 text-amber-800`
- CONFIRMED → `bg-emerald-100 text-emerald-800`
- COMPLETED → `bg-blue-100 text-blue-800`
- CANCELLED → `bg-gray-100 text-gray-800`

### 4b. WhatsAppButton

**File**: `src/components/admin/WhatsAppButton.tsx`

Props: `{ ticket: ActiveQueueTicket }` or `{ phone: string, message: string }`
Renders: Green button with Lucide `MessageCircle` icon
- Click → `window.open(buildWhatsAppUrl(...), '_blank')`
- Disabled when phone is empty/null
- Shows tooltip "No phone number" when disabled
- WhatsApp green: `bg-[#25D366] hover:bg-[#128C7E]`

### 4c. BookingQueue (main orchestrator)

**File**: `src/components/admin/BookingQueue.tsx`

`'use client'` component.

**Props**: `{ initialBookings: ActiveQueueTicket[] }`

**State**:
- `bookings: ActiveQueueTicket[]` — initialised from props, optimistically updated
- `error: string | null` — for failure toasts

**Functions**:
- `handleStatusChange(id: string, newStatus: BookingStatus)` — optimistically updates local state, sends PATCH, reverts on failure. Shows brief error indicator on failure.

**Layout**:
- Wrapper `<div>` with `overflow-x-auto`
- Desktop (≥1024px): `<table>` with columns: Ref | Customer | Tour | Date | Guests | Price | Hotel | Status | Actions
- Mobile (<1024px): CSS grid or flexbox with each ticket as a card (`border`, `rounded-lg`, `p-4`)
- Each card/row has: StatusBadge, WhatsAppButton, StatusDropdown, booking fields

**StatusDropdown**: `<select>` or custom dropdown listing all 4 status values. On change, calls `handleStatusChange`.

**Empty state**: When `bookings.length === 0`, show centered message "No bookings yet" with a brief description.

### 4d. Responsive approach

One single component (`BookingQueue`) handles both layouts using Tailwind responsive utilities:
- Table: `hidden lg:table` and `lg:table-header-group` on `<table>`, `hidden lg:table-row` on `<tr>`
- Cards: `block lg:hidden` on each card wrapper
- Icons from `lucide-react` needed: `MessageCircle`, `Phone`, `Calendar`, `Users`, `DollarSign`, `Building2`

---

## Phase 5 — Queue Page

### 5a. Admin Bookings Page

**File**: `src/app/admin/bookings/page.tsx`

Server component (async):
```typescript
import { prisma } from '@/lib/prisma';
import BookingQueue from '@/components/admin/BookingQueue';

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { tour: { select: { title: true, itinerary: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const tickets = bookings.map(b => { /* map to ActiveQueueTicket */ });
  return <BookingQueue initialBookings={tickets} />;
}
```

---

## Phase 6 — Seed Data / Verification

### 6a. Install dependencies

```bash
npm install lucide-react
```

### 6b. Seed data (for development)

Create `prisma/seed.ts` or use Prisma Studio to manually insert:
- A few Tour records
- Several Booking records at various statuses and languages
- At least one with empty phone (to test disabled WhatsApp)
- At least one with itinerary milestones (to test pickup time)

### 6c. Verification

1. `npm run dev` → navigate to `/admin/bookings`
2. Verify all 4 status badges render correctly (colors)
3. Change a status via dropdown → confirm optimistic update → refresh page → confirm persistence
4. Click WhatsApp button → confirm deep link opens with localized message
5. Resize to mobile viewport → confirm cards render instead of table
6. Clear all bookings → confirm empty state shows
7. Verify disabled WhatsApp for bookings without phone numbers

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `prisma/schema.prisma` | Add Booking model + BookingStatus enum |
| Create | `src/types/booking.ts` | ActiveQueueTicket, BookingStatus types |
| Create | `src/lib/whatsapp.ts` | Message templates + deep-link builder |
| Create | `src/app/api/admin/bookings/route.ts` | GET all bookings |
| Create | `src/app/api/admin/bookings/[id]/status/route.ts` | PATCH booking status |
| Create | `src/components/admin/StatusBadge.tsx` | Color-coded status badge |
| Create | `src/components/admin/WhatsAppButton.tsx` | WhatsApp deep-link button |
| Create | `src/components/admin/BookingQueue.tsx` | Main queue orchestrator (table + cards) |
| Create | `src/app/admin/bookings/page.tsx` | Server component page |
| Create | `prisma/seed.ts` (optional) | Seed data for development |

---

## Design Decisions

1. **Single component approach**: One `BookingQueue.tsx` component handles both desktop table and mobile cards via Tailwind responsive utilities — avoids duplicating logic across two components.
2. **Tour.title used directly**: The bare `Tour.title` field is used since the translations JSON (Feature 002) doesn't exist yet. Simple and forward-compatible.
3. **Pickup time from itinerary JSON**: `pickupTime` is extracted from `tour.itinerary[0].time` (first milestone's time tag). Null if no itinerary exists.
4. **No form library**: Native `<select>` for status changes — lightweight and sufficient for this scope.
5. **Optimistic updates**: Local state updates immediately; reverts on server error. No toasts library — inline error state on the affected row is sufficient for v1.
6. **lucide-react**: needs to be installed. Used for MessageCircle icon and other UI icons.
