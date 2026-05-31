# Feature 013: Crew Assignment, Fleet Dispatch & Trip Expense Tracker — Quickstart

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Modify (append CrewMember, FleetAsset, CrewAssignment, FleetAssignment, TripExpense models + enums) |
| 2 | `src/config/exchangeRates.ts` | Create (static USD_TO_EGP rate) |
| 3 | `src/app/api/admin/operations/dispatch/route.ts` | Create (POST dispatch save) |
| 4 | `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts` | Create (GET dispatch preload) |
| 5 | `src/components/admin/TripDispatcher.tsx` | Create (interactive dispatch center) |
| 6 | `src/app/admin/operations/dispatch/page.tsx` | Create (admin dispatch page) |
| 7 | `src/app/api/admin/analytics/summary/route.ts` | Modify (extend with TripExpense aggregation) |
| 8 | `AGENTS.md` | Modify (update plan reference) |

## Steps

### 1. Prisma Schema
Append the following models to `prisma/schema.prisma`:
- `enum CrewRole { CAPTAIN GUIDE DRIVER }`
- `enum FleetType { BOAT SPEEDBOAT VEHICLE QUAD }`
- `enum ExpenseCategory { FUEL CREW_PAYROLL CATERING PERMITS MISC }`
- `enum ExpenseCurrency { USD EGP }`
- `model CrewMember` — id, name, role, phone?, isActive
- `model FleetAsset` — id, name, type, capacity?, isActive
- `model CrewAssignment` — id, crewMemberId, tourId, departureDate + indices
- `model FleetAssignment` — id, fleetAssetId, tourId, departureDate + indices
- `model TripExpense` — id, departureDateGroup, tourId, category, amount (Decimal), currency, notes?

Run `npx prisma migrate dev --name add-crew-fleet-expense`

### 2. Exchange Rate Config
Create `src/config/exchangeRates.ts` with:
```typescript
export const EXCHANGE_RATES = {
  USD_TO_EGP: 48.50,
} as const;
```

### 3. Dispatch API — POST
Create `src/app/api/admin/operations/dispatch/route.ts`:
- Auth guard via `getServerSession`
- Validate payload (tourId, departureDate format, positive amounts)
- Conflict detection query on existing assignments
- If conflicts and `force !== true`, return 409
- `prisma.$transaction`: delete existing → create new assignments + expenses
- Return `TripDispatchResponse`

### 4. Dispatch API — GET
Create `src/app/api/admin/operations/dispatch/[tourId]/[date]/route.ts`:
- Auth guard
- Fetch existing assignments, expenses, active crew/fleet pool
- Return `DispatchPreloadResponse`

### 5. TripDispatcher Component
Create `src/components/admin/TripDispatcher.tsx`:
- `"use client"` component
- Accept `tourId` and `date` as props
- `useEffect` fetch GET dispatch data → pre-populate form
- **Crew section**: Searchable dropdowns per role (captain, guide, driver) — populated from `crewPool`
- **Fleet section**: Searchable dropdowns per asset type — populated from `fleetPool`
- **Expense ledger**: Dynamic table with add/edit/remove row buttons
- **Total cost summary card**: `text-[#FF5B00]` computed value via `useMemo`
- **Save button**: Disabled loading state during POST, inline error/success display
- **Pre-population**: On mount, set form state from GET response
- Zero CLS: Fixed column widths, skeleton loading state

### 6. Admin Dispatch Page
Create `src/app/admin/operations/dispatch/page.tsx`:
- URL search params: `?tourId=xxx&date=YYYY-MM-DD`
- Server component shell → renders TripDispatcher with params
- If missing params, show a tour/date selector form

### 7. Analytics Bridge
Modify `src/app/api/admin/analytics/summary/route.ts`:
- Add Prisma aggregation: `tripExpense.groupBy` by `departureDateGroup` within the date range
- Convert EGP expenses to USD using exchange rates
- Subtract `totalExpensesUSD` from net margin calculation
- Add `totalExpensesUSD` to the response contract

### 8. Agent Context
Update `AGENTS.md` plan reference to point to `specs/013-crew-fleet-expense/plan.md`

## Key Interfaces

```typescript
interface TripDispatchPayload {
  tourId: string;
  departureDate: string;
  assignedCrewIds: string[];
  assignedAssetIds: string[];
  expenses: ExpenseRowInput[];
  force?: boolean;
}

interface ExpenseRowInput {
  category: ExpenseCategory;
  amount: number;
  currency: ExpenseCurrency;
  notes?: string;
}

interface TripDispatchResponse {
  success: boolean;
  crewCount: number;
  assetCount: number;
  expenseCount: number;
  totalExpenseUSD: number;
  warnings: SchedulingConflict[];
}

interface DispatchPreloadResponse {
  assignedCrew: CrewMemberSummary[];
  assignedFleet: FleetAssetSummary[];
  expenses: ExpenseRecord[];
  crewPool: CrewMemberSummary[];
  fleetPool: FleetAssetSummary[];
  computedTotalUSD: number;
}
```

## Architecture Flow

```
Dispatch page loads:
  URL params (tourId, date)
    → GET /api/admin/operations/dispatch/{tourId}/{date}
    → Returns pre-population data + crew/fleet pools
    → TripDispatcher renders with searchable dropdowns + expense table

Operator edits:
  → Selects crew members from role-filtered dropdowns
  → Selects fleet assets from type-filtered dropdowns
  → Adds/edits/removes expense rows → live total updates via useMemo

Operator saves:
  → POST /api/admin/operations/dispatch
  → Atomic prisma.$transaction
  → Conflict detection → 409 with warnings (or force → 200 with warnings)
  → Success → green confirmation, data persists

Analytics pipeline:
  → GET /api/admin/analytics/summary
  → TripExpense grouped by departureDateGroup within date range
  → EGP→USD conversion via exchangeRates.ts
  → Subtract from gross revenue for net margin
```
