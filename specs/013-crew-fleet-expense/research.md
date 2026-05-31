# Research: Crew Assignment, Fleet Dispatch & Trip Expense Tracker (Feature 013)

## Decision Log

### 1. Prisma Models — CrewMember & FleetAsset
- **Decision**: Two base entities (CrewMember, FleetAsset) with two join models (CrewAssignment, FleetAssignment)
- **Rationale**: Crew members and fleet assets are independent entities with their own fields (name, role/type, phone, capacity, isActive). Join models with (crewMemberId/fleetAssetId + tourId + departureDate) allow proper relational integrity, indexing, and conflict detection queries.
- **Alternatives considered**: JSON array on Tour (no relational integrity, poor queryability for conflict detection), single Assignment model with polymorphic type (more complex queries, weaker typing)

### 2. TripExpense Model — departureDateGroup vs timestamp
- **Decision**: Use `departureDateGroup String` (YYYY-MM-DD format) as the operational date anchor, paired with `tourId` as the composite key
- **Rationale**: Trip expenses are tied to a specific tour departure, not a precise timestamp. The string format aligns with the dispatch API's date parameter and enables efficient indexed lookups by day across all tours. This is consistent with Feature 011's manifest date grouping pattern.
- **Alternatives considered**: DateTime field (unnecessary precision, complicates daily grouping queries), computed date from timestamp (wasteful computation)

### 3. Expense Amount Precision
- **Decision**: Prisma `Decimal` type mapping to PostgreSQL `numeric(10,2)`, stored in USD minor units (cents) for USD, EGP stored as-is (piasters-level precision)
- **Rationale**: Decimal avoids IEEE 754 floating-point rounding errors in financial calculations. For analytics, EGP amounts are converted to USD at query time using the static exchange rate before aggregation. This ensures the analytics pipeline works in a single currency (USD).
- **Alternatives considered**: Integer cents for both (loses EGP piasters precision), Float (rounding errors)

### 4. Dispatch API — Single Endpoint vs Two-Step
- **Decision**: Single POST endpoint `/api/admin/operations/dispatch` accepting both assignments and expenses in one payload
- **Rationale**: FR-003 requires atomic save of crew + fleet + expenses together. One endpoint wrapping `prisma.$transaction` enforces this at the API layer. Separating into multiple endpoints would require the client to orchestrate the transaction, which is less reliable.
- **Alternatives considered**: Separate POST for assignments and expenses (cannot guarantee atomicity), GraphQL (overkill for admin operations)

### 5. Scheduling Conflict Detection
- **Decision**: Server-side check within the transaction — query existing assignments for same crew/fleet on same date, return `warnings[]` in response, let operator override
- **Rationale**: Per spec assumption, conflict is advisory only. The API accepts an optional `force: boolean` flag; if false and conflicts exist, return 409 with conflict details. If true, proceed with write. This keeps the response useful without being blocking.
- **Alternatives considered**: Strict rejection on conflict (breaks the override use case), client-side only detection (can miss concurrent assignments)

### 6. Exchange Rate Fallback
- **Decision**: Hardcoded fallback in `config/exchangeRates.ts` with a `WARNING` console marker
- **Rationale**: Consistent with Feature 009's static config pattern. If the config file is missing or the rate is zero/undefined, fall back to `USD_TO_EGP: 48.50` and flag a console warning. This prevents the analytics pipeline from crashing on missing config.
- **Alternatives considered**: Environment variable (more complex to update), external API call (banned by feature constraints)

### 7. Total Cost Calculation
- **Decision**: Client-side real-time total via `useMemo` in React; server-side recomputed total in response for trust verification
- **Rationale**: SC-002 requires < 100ms update per row edit, which necessitates client-side computation. The server recomputes and returns the verified total in the save response. The client displays the server-verified total after save, using the client total only for live preview.
- **Alternatives considered**: Server-only computation (too slow for real-time), trusting client total (insecure)

### 8. Analytics Integration Point
- **Decision**: Extend the existing `GET /api/admin/analytics/summary` route (Feature 009) to add a Prisma aggregation on TripExpense grouped by `departureDateGroup`, then subtract the sum from gross revenue
- **Rationale**: Feature 009 already computes grossRevenueUSD and netMarginUSD by subtracting `costPerPerson * passengerCount`. TripExpense adds another deduction layer: `netMargin = revenue - tourCosts - tripExpenses`. The existing pipeline needs one additional aggregation block. The response contract gets a new field `totalExpensesUSD` for transparency.
- **Alternatives considered**: Separate expense analytics endpoint (forces UI to make two calls), embedding expenses in booking aggregate (incorrect — expenses aren't per-booking)

## Best Practices

### Atomic Dispatch Transaction Pattern
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Delete existing assignments for this departure (clean slate)
  await tx.crewAssignment.deleteMany({ where: { tourId, departureDate } });
  await tx.fleetAssignment.deleteMany({ where: { tourId, departureDate } });
  await tx.tripExpense.deleteMany({ where: { tourId, departureDate } });

  // 2. Create new assignments
  if (assignedCrewIds.length > 0) {
    await tx.crewAssignment.createMany({
      data: assignedCrewIds.map(crewMemberId => ({ crewMemberId, tourId, departureDate })),
    });
  }
  if (assignedAssetIds.length > 0) {
    await tx.fleetAssignment.createMany({
      data: assignedAssetIds.map(fleetAssetId => ({ fleetAssetId, tourId, departureDate })),
    });
  }

  // 3. Create expense records
  if (expenses.length > 0) {
    await tx.tripExpense.createMany({ data: expenses });
  }
});
```

### Scheduling Conflict Query
```typescript
const conflicts = await tx.crewAssignment.findMany({
  where: {
    crewMemberId: { in: assignedCrewIds },
    departureDate,
    tourId: { not: targetTourId },  // exclude current tour
  },
  include: { crewMember: true, tour: true },
});
```

### Multi-Currency Total Computation
```typescript
function computeTotalUSD(expenses: ExpenseRow[], rates: typeof EXCHANGE_RATES): number {
  return expenses.reduce((sum, e) => {
    const amount = Number(e.amount);
    return sum + (e.currency === 'EGP' ? amount / rates.USD_TO_EGP : amount);
  }, 0);
}
```
