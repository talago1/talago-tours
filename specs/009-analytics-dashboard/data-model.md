# Data Model: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

## Extended Entity: Booking (channel field)

The existing `Booking` model (from Features 006/007/008) is extended with the following field:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| channel | BookingChannel | default: WEBSITE | Acquisition source for this booking |

### BookingChannel Enum

```prisma
enum BookingChannel {
  VIATOR
  GETYOURGUIDE
  WHATSAPP
  HOTEL_DIRECT
  WEBSITE
}
```

### channel Default Behavior

- New bookings without an explicit channel: default to `WEBSITE`
- Existing bookings migrated without a channel: receive `WEBSITE` via Prisma migration default

## Extended Entity: Tour (cost fields)

The existing `Tour` model is extended with the following field:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| costPerPerson | Decimal? | default: null, nullable | Per-person operational cost (transfer + fees) in USD cents |

### costPerPerson Usage

Net profit margin calculation:
```
margin = totalRevenue - (costPerPerson × totalPassengers)
```

If `costPerPerson` is null for a tour, that tour's cost contribution is treated as zero (no cost data available).

## Type: ExecutiveDashboardStats

```typescript
export interface ExecutiveDashboardStats {
  grossRevenueUSD: number;
  netMarginUSD: number;
  passengerCount: number;
  topTourTitle: string;
  channelBreakdown: ChannelSummary[];
}
```

## Type: ChannelSummary

```typescript
export interface ChannelSummary {
  channel: BookingChannel;
  _count: number;
  totalRevenueUSD: number;
}
```

## Type: BookingChannel

```typescript
export type BookingChannel = 'VIATOR' | 'GETYOURGUIDE' | 'WHATSAPP' | 'HOTEL_DIRECT' | 'WEBSITE';
```

## Config: Exchange Rates

```typescript
// File: config/exchangeRates.ts
export const EXCHANGE_RATES = {
  USD_TO_EGP: 48.50,  // Update manually when rates shift significantly
} as const;
```

## Prisma Schema Additions

Extend existing models:

```prisma
enum BookingChannel {
  VIATOR
  GETYOURGUIDE
  WHATSAPP
  HOTEL_DIRECT
  WEBSITE
}

model Booking {
  // existing fields from Features 006/007/008...
  
  channel    BookingChannel @default(WEBSITE)
}

model Tour {
  // existing fields...
  
  costPerPerson Decimal?  // per-person operational cost in USD cents
}
```

## Validation Rules

1. `channel` defaults to WEBSITE — must never be null/undefined.
2. `costPerPerson` is nullable — null means cost data not yet configured for this tour.
3. Net margin aggregation uses `costPerPerson * passengerCount` per tour group, summed across all tours.
4. Revenue must be stored in USD cents (integer) across all records to avoid floating-point errors.
5. EGP display values are computed at query time using the static exchange rate config — never stored.
