# Quickstart: Booking Queue & WhatsApp Automation

Implementation steps in dependency order.

## Prerequisites

- Feature 001 implementation complete (Prisma client, Supabase config)
- Node modules installed (`npm install`)
- Prisma client generated (`npx prisma generate`)
- PostgreSQL database running with `DATABASE_URL` set

## Step 1: Extend Prisma Schema

Add the Booking model and BookingStatus enum to `prisma/schema.prisma`:

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

Push schema:

```bash
npx prisma db push
npx prisma generate
```

## Step 2: Create Type Definitions

File: `src/types/booking.ts`

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

## Step 3: Install Dependencies

```bash
npm install lucide-react
```

## Step 4: Create WhatsApp Link Builder

File: `src/utils/whatsappLinkBuilder.ts`

- Export 6-language template map (EN, DE, RU, FR, IT, TR)
- Export `buildWhatsAppMessage(ticket: ActiveQueueTicket): string` — interpolates template
- Export `buildWhatsAppUrl(phone: string, message: string): string` — returns `https://api.whatsapp.com/send?phone=...&text=...`
- Fallback to `en` if ticket language has no template

## Step 5: Create Status Patch Endpoint

File: `src/app/api/admin/bookings/[id]/status/route.ts`

- PATCH handler
- Validate `status` in request body against `['PENDING','CONFIRMED','COMPLETED','CANCELLED']`
- Validate transition: PENDING→CONFIRMED/CANCELLED, CONFIRMED→COMPLETED/CANCELLED
- Prisma `update()` on Booking
- Return updated booking or error

## Step 6: Create Bookings List Endpoint

File: `src/app/api/admin/bookings/route.ts`

- GET handler
- Prisma `findMany()` with `include: { tour: { select: { title: true, itinerary: true } } }`
- Map to `ActiveQueueTicket[]` (derive `pickupTime` from first itinerary milestone)
- Return `{ bookings: ActiveQueueTicket[] }`

## Step 7: Create UI Components

### StatusBadge (`src/components/admin/StatusBadge.tsx`)
- Props: `{ status: BookingStatus }`
- Color-coded span: PENDING=amber, CONFIRMED=emerald, COMPLETED=blue, CANCELLED=gray

### WhatsAppButton (`src/components/admin/WhatsAppButton.tsx`)
- Props: `{ ticket: ActiveQueueTicket }`
- Green button with Lucide MessageCircle icon
- Disabled when phone is empty/null
- On click: `window.open(buildWhatsAppUrl(...), '_blank')`

### BookingRowActions (`src/components/admin/BookingRowActions.tsx`)
- Props: `{ ticket: ActiveQueueTicket, onStatusChange: (id, status) => void }`
- Status `<select>` filtered to valid transitions for current status
- WhatsAppButton

### BookingQueue (`src/components/admin/BookingQueue.tsx`)
- `'use client'`, Props: `{ initialBookings: ActiveQueueTicket[] }`
- Responsive layout: `<table>` at `lg:`, stacked cards below
- Skeleton rows while loading (if initialBookings is empty on first render)
- Empty state when no bookings after load
- Status error handling with revert

## Step 8: Create Queue Page

File: `src/app/admin/bookings/page.tsx`

```typescript
import { prisma } from '@/lib/prisma';
import BookingQueue from '@/components/admin/BookingQueue';

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { tour: { select: { title: true, itinerary: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const tickets = bookings.map(b => ({
    id: b.id,
    bookingReference: b.bookingReference,
    tourTitle: b.tour.title,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    travelDate: b.travelDate.toISOString().split('T')[0],
    guestCount: b.guestCount,
    totalPriceUSD: b.totalPriceUSD,
    hotelName: b.hotelName,
    pickupTime: (b.tour.itinerary as any[])?.[0]?.time ?? null,
    status: b.status as BookingStatus,
    language: b.language,
  }));
  return <BookingQueue initialBookings={tickets} />;
}
```

## Step 9: Seed Test Data (Optional)

Use Prisma Studio to manually insert test bookings:

```bash
npx prisma studio
```

Or create a seed script at `prisma/seed.ts` that inserts 3-5 bookings across different statuses, including one with empty phone and one with a cancelled status.

## Step 10: Verify

1. `npm run dev` → navigate to `/admin/bookings`
2. Confirm queue loads with all bookings
3. Change a status → confirm optimistic update → refresh → confirm persistence
4. Click WhatsApp → confirm deep link opens with localized message
5. Resize to mobile → confirm card layout
6. Verify empty state (delete all bookings via Studio)
7. Verify disabled WhatsApp for booking with empty phone
