# Research: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

## Technology Decisions

### Prisma Aggregation Strategy

**Decision**: Use Prisma's native `groupBy` with `_sum` and `_count` aggregation operators in a single query to compute all dashboard metrics:

```typescript
// Channel breakdown with revenue aggregation
const channelData = await prisma.booking.groupBy({
  by: ['channel'],
  where: { status: 'CONFIRMED', travelDate: { gte: startDate, lte: endDate } },
  _sum: { totalRevenue: true },
  _count: true,
});
```

For the overall summary, use `aggregate`:
```typescript
const summary = await prisma.booking.aggregate({
  where: { status: 'CONFIRMED', travelDate: { gte: startDate, lte: endDate } },
  _sum: { totalRevenue: true, guestCountAdults: true, guestCountChildren: true },
  _count: true,
});
```

For top tour, use `groupBy` on `tourId` with `_sum` sorted descending, take 1.

**Rationale**: Prisma's `groupBy` and `aggregate` operate entirely on the PostgreSQL server — no data is transferred to the application layer for aggregation. This is the most performant approach for the documented scale (<100 bookings/day).

**Alternatives considered**:
- Raw SQL queries: More control but loses Prisma type safety. Not worth the tradeoff.
- Multiple separate queries: Each metric separately — works but increases DB round trips.
- In-memory aggregation via `findMany`: Would transfer all rows to the application layer — counterproductive for performance.

### Exchange Rate Configuration

**Decision**: Static TypeScript config file exporting high-precision rates using integer math (cents-based) to avoid floating-point errors:

```typescript
export const EXCHANGE_RATES = {
  USD_TO_EGP: 48.50,  // 1 USD = 48.50 EGP (update manually when rates shift significantly)
} as const;
```

For conversions: multiply USD values by the rate, round to 2 decimal places using `Math.round(value * 100) / 100`.

**Rationale**: The spec explicitly calls for a "fallback constant config file". No live API integration in v1. Using cents-based math prevents floating-point rounding errors in JavaScript.

### Admin Auth Guard Strategy

**Decision**: Reuse the existing admin authentication middleware via a `getServerSession()` check at the start of the API route handler:

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... aggregation logic
}
```

**Rationale**: Consistent with the admin auth pattern used in Features 004 and 007. The existing auth system already provides session management.

### 15-Minute Cache Revalidation

**Decision**: Use Next.js `next.revalidate` option on the response:

```typescript
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900' },
});
```

**Rationale**: The spec requests "time-based revalidation tags set to refresh background snapshots every 15 minutes". Next.js segment cache with `revalidate = 900` achieves this without additional infrastructure.

### Timeframe Filter via URL Query Params

**Decision**: Pass timeframe as URL query params (`startDate`, `endDate`) from the client to the API route. The client computes date ranges from the selected filter (Today, Last 7 Days, Current Month, YTD) and includes them in the API request.

**Rationale**: Stateless API — the endpoint receives explicit date boundaries and returns filtered results. Clean separation of concerns.

### Skeleton Loading States

**Decision**: Fixed-dimension skeleton cards that match the exact dimensions of rendered metric cards. Use Tailwind `animate-pulse` for the shimmer effect:

```tsx
<div className="h-24 w-full bg-gray-100 rounded-lg animate-pulse" />
```

**Rationale**: Zero CLS requires that skeleton dimensions match final content dimensions. Using `animate-pulse` on matching card skeletons guarantees no layout shift during the data transition.

## Dependencies

### New Dependencies to Install

None — all required functionality is built-in:
- Prisma `groupBy`, `_sum`, `_count`, `aggregate` — available in Prisma 5
- `getServerSession` — already used in existing admin auth
- `animate-pulse` — Tailwind built-in utility class

### Existing Dependencies (no change)

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router) |
| `react` | UI library |
| `@prisma/client` | Database access |
| `tailwindcss` | CSS utility framework (skeletons, progress bars) |

## Architecture Flow

```
[Admin navigates to /admin/analytics]
  → AnalyticsDashboard mounts ("use client")
  → AnalyticsTimeFilters renders with default timeframe (Current Month)
  → On mount + on filter change:
    1. Compute startDate/endDate from selected filter
    2. fetch GET /api/admin/analytics/summary?startDate=...&endDate=...
      → Route Handler:
        1. getServerSession() → 401 if not admin
        2. Prisma aggregate for summary metrics
        3. Prisma groupBy for channel breakdown
        4. Find top tour by revenue
        5. Apply exchange rate conversion for EGP display
        6. Return ExecutiveDashboardStats JSON
        7. Set Cache-Control: s-maxage=900
      → Response: { grossRevenueUSD, netMarginUSD, passengerCount, topTourTitle, channelBreakdown }
    3. Update state with response data
    4. Render metric cards + channel attribution rows
  → On filter click:
    1. Update URL query params (no full navigation)
    2. Show skeleton placeholders
    3. Re-fetch API with new dates
    4. Replace skeletons with live data
```

## Edge Cases

### Zero Bookings Period
If no bookings exist for the selected timeframe, all metric values are 0. The channel breakdown returns an empty array. All five channels should still appear in the attribution section with zero counts.

### Tour Without Operational Costs
If a tour has no cost data (null/undefined), margin calculation treats it as zero cost for that tour. A warning is logged but not shown to the user.

### Exchange Rate Config Missing
If `config/exchangeRates.ts` fails to load or is malformed, the system falls back to 1:1 USD:EGP and displays a warning banner on the dashboard.

### Large Date Range (YTD)
Year-to-Date may span up to 365 days. The Prisma query filters by `travelDate` range which is indexed in PostgreSQL — no performance concerns at this scale.
