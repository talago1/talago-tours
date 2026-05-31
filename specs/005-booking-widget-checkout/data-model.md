# Data Model: Booking Widget & Checkout Engine

## Entities

### Booking (new model)

The Booking model captures all data from the checkout form plus server-generated fields.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String (CUID) | `@id @default(cuid())` | Primary key |
| `bookingReference` | String | `@unique` | Format: `TLG-2026-XXXX` |
| `tourId` | String | Required | Foreign key to Tour |
| `zoneId` | String | Required | Pickup zone identifier |
| `hotelName` | String | Required | Max 200 chars |
| `travelDate` | DateTime | Required | Must be future date |
| `guestCount` | Int | Required | Min 1, max based on tour capacity |
| `totalPriceUSD` | Float | Required | Server-calculated |
| `customerName` | String | Required | Min 2 chars |
| `customerEmail` | String | Required | Email format validated |
| `customerPhone` | String | Required | E.164 format |
| `status` | String | Required, default `"PENDING"` | `PENDING` on creation |
| `createdAt` | DateTime | `@default(now())` | Auto |
| `updatedAt` | DateTime | `@updatedAt` | Auto |

**Relationships**:
- Booking belongs to Tour (via `tourId`)
- Tour has many Bookings (one-to-many)

### Tour (extended — referenced, not modified in this feature)

| Field | Notes |
|-------|-------|
| `id` (PK) | Foreign key target for Booking.tourId |
| `perPersonPrice` | Used for server-side price calculation (assumed to exist or be added) |
| `capacityPerDate` | Used for sold-out date validation (assumed to exist or be added) |

### Pickup Zone (new model or configuration)

Pickup zones may be stored as a database model or configuration array. For v1, zones are passed as props from the parent tour page.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Zone identifier |
| `name` | String | Display name (e.g., "El Gouna") |
| `transferFee` | Float | Added to total price calculation |

## Validation Rules

### Client-side (before submission)
1. `travelDate` is a future date (not today, not past)
2. `guestCount` ≥ 1 (increment/decrement bounded)
3. `hotelName` is non-empty, ≤ 200 chars
4. `customerName` ≥ 2 characters
5. `customerEmail` matches basic email pattern
6. `customerPhone` matches E.164 format
7. All required fields are non-empty

### Server-side (on submission)
1. Re-validate all client-side rules (defense in depth)
2. `travelDate` is confirmed future date (server clock)
3. `tourId` references an existing Tour record
4. `zoneId` is known/valid
5. `guestCount` ≤ Tour's max capacity for that date
6. Calculate `totalPriceUSD` server-side (never trust client price)

## Booking Lifecycle

```text
PENDING  ──→  (admin processes booking)
   │
   └──→  CANCELLED  (admin cancels manually)
```

- Default status on creation: `PENDING`
- Admin can toggle to `CANCELLED` from dashboard
- No automatic status transitions in v1

## Database Diagram

```text
Tour (existing, extended)
  ┌──────────────────────┐
  │ id (PK)              │──┐
  │ title                │  │
  │ description          │  │
  │ images[]             │  │
  │ itinerary            │  │
  │ perPersonPrice?      │  │  (may need addition)
  │ capacityPerDate?     │  │  (may need addition)
  │ createdAt            │  │
  │ updatedAt            │  │
  └──────────────────────┘  │
                            │
Booking (new)               │
  ┌──────────────────────┐  │
  │ id (PK)              │  │
  │ bookingReference (UQ)│  │
  │ tourId (FK)──────────┘  │
  │ zoneId                 │
  │ hotelName              │
  │ travelDate             │
  │ guestCount             │
  │ totalPriceUSD          │
  │ customerName           │
  │ customerEmail          │
  │ customerPhone          │
  │ status (PENDING)       │
  │ createdAt              │
  │ updatedAt              │
  └──────────────────────┘
```
