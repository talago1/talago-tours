# Data Model: Booking Queue & WhatsApp Automation

## Entity: Booking

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String (CUID) | PK, @default(cuid()) | Primary identifier |
| bookingReference | String | @unique, format: `TLG-{YYYYMMDD}-{XXXX}` | Human-readable booking code, generated server-side |
| tourId | String | FK → Tour.id | Associated tour |
| zoneId | String | required | Pickup zone identifier |
| hotelName | String | required | Customer's hotel name |
| travelDate | DateTime | required | Date of tour |
| guestCount | Int | required, min: 1 | Number of guests |
| totalPriceUSD | Float | required | Computed server-side, never trusted from client |
| customerName | String | required | Customer full name |
| customerEmail | String | required | Customer email |
| customerPhone | String | required, E.164 format | WhatsApp-capable phone number |
| language | String | @default("en") | 2-letter code (en/de/ru/fr/it/tr) for WhatsApp localization |
| status | BookingStatus | @default(PENDING) | Current lifecycle state |
| createdAt | DateTime | @default(now()) | Timestamp of creation |
| updatedAt | DateTime | @updatedAt | Timestamp of last update |

## Enum: BookingStatus

| Value | Description | Allowed Next Transitions |
|-------|-------------|--------------------------|
| PENDING | Awaiting admin processing | CONFIRMED, CANCELLED |
| CONFIRMED | Verified and accepted by admin | COMPLETED, CANCELLED |
| COMPLETED | Tour has occurred | (terminal state) |
| CANCELLED | No longer active | (terminal state) |

## Interface: ActiveQueueTicket (TypeScript)

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

## Prisma Schema Addition

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

## Relationships

- Booking **belongs to** Tour (many-to-one)
- Tour **has many** Bookings (one-to-many)

## Validation Rules

1. `bookingReference` — unique, auto-generated in format `TLG-{YYYYMMDD}-{XXXX}`
2. `status` — transitions limited to: PENDING→CONFIRMED, PENDING→CANCELLED, CONFIRMED→COMPLETED, CONFIRMED→CANCELLED. No backward/circular transitions.
3. `customerPhone` — stored as E.164 string; if empty/null, WhatsApp button is disabled
4. `guestCount` — minimum 1
5. `language` — must be one of: en, de, ru, fr, it, tr. Defaults to "en"
6. `totalPriceUSD` — computed server-side; never accepted from client input
