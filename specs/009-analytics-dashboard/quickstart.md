# Quickstart: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

Implementation steps in dependency order.

## Prerequisites

- Feature 005/006 complete (Booking model with status, guest counts, totalRevenue, travelDate)
- Feature 007/008 complete (Booking model with payment fields, voucher fields)
- Prisma client generated (`npx prisma generate`)
- Admin auth system in place (protects analytics endpoint)

## Step 1: Extend Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
enum BookingChannel {
  VIATOR
  GETYOURGUIDE
  WHATSAPP
  HOTEL_DIRECT
  WEBSITE
}

model Booking {
  // existing fields...
  channel BookingChannel @default(WEBSITE)
}

model Tour {
  // existing fields...
  costPerPerson Decimal?
}
```

Push schema:

```bash
npx prisma db push
npx prisma generate
```

## Step 2: Create Exchange Rate Config

File: `src/config/exchangeRates.ts`

```typescript
export const EXCHANGE_RATES = {
  USD_TO_EGP: 48.50,
} as const;
```

## Step 3: Create Analytics Types

File: `src/types/analytics.ts`

- `BookingChannel` type
- `ChannelSummary` interface
- `ExecutiveDashboardStats` interface

## Step 4: Create Analytics Aggregation Endpoint

File: `src/app/api/admin/analytics/summary/route.ts`

- GET handler with admin auth check
- Parse `startDate` and `endDate` from URL query params
- Prisma `aggregate` for summary metrics (revenue sum, guest count sum)
- Prisma `groupBy` for channel breakdown
- Prisma `groupBy` for top tour (sorted by revenue descending, limit 1)
- Look up tour title from top tour ID
- Compute net margin: deduct `costPerPerson * passengers` per tour
- Apply USD→EGP conversion for EGP display
- Set `Cache-Control: public, max-age=0, s-maxage=900`
- Return `ExecutiveDashboardStats`

## Step 5: Create Timeframe Filter Component

File: `src/components/admin/AnalyticsTimeFilters.tsx`

- `"use client"` component
- Buttons: Today, Last 7 Days, Current Month, YTD
- On click: compute date range, update URL query params, trigger data fetch via callback

## Step 6: Create Analytics Dashboard Component

File: `src/components/admin/AnalyticsDashboard.tsx`

- `"use client"` component
- Integrates `AnalyticsTimeFilters`
- On mount + filter change: fetch `/api/admin/analytics/summary?startDate=...&endDate=...`
- Render 4-column metrics grid:
  - Gross Revenue ($USD + EGP equivalent)
  - Net Profit Margin (with cost deduction)
  - Total Settled Passengers
  - Top Performing Tour (Coral accent badge)
- Render channel attribution rows:
  - Loop through `channelBreakdown` array
  - Horizontal progress bar: `bg-gray-100` track, `bg-[#00473F]` fill, `rounded-full`
  - Width proportional to percentage of total booking count
- Skeleton loading state: `animate-pulse` cards matching metric card dimensions

## Step 7: Embed Dashboard in Admin Layout

Add the dashboard component to the admin navigation/routing structure so it's accessible (e.g., at `/admin/analytics`).

## Step 8: Verify End-to-End

1. `npm run dev`
2. Ensure some bookings exist with various channels and confirmed status
3. Set `costPerPerson` on a few tours
4. Navigate to `/admin/analytics`
5. Confirm four summary metric cards render with correct values
6. Confirm channel attribution progress bars are proportional
7. Switch timeframe filters — confirm data updates and skeletons display
8. Test unauthenticated access — confirm 401
9. Wait 15 minutes (or shorter for testing) — confirm cache serves stale data then refreshes
10. Test zero-booking timeframe — confirm $0.00 / "—" values
