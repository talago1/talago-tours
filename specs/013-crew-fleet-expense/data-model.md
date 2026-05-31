# Data Model: Crew Assignment, Fleet Dispatch & Trip Expense Tracker

## New Entities

### CrewMember

Represents an individual crew member (captain, guide, driver) who can be assigned to tour departures.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(cuid()) | Primary key |
| name | String | | Full name of crew member |
| role | CrewRole | | CAPTAIN, GUIDE, or DRIVER |
| phone | String? | | Optional contact number |
| isActive | Boolean | @default(true) | Soft deactivation flag |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

### FleetAsset

Represents a physical asset (boat, vehicle) that can be assigned to tour departures.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(cuid()) | Primary key |
| name | String | | Asset display name |
| type | FleetType | | BOAT, SPEEDBOAT, VEHICLE, or QUAD |
| capacity | Int? | | Max passengers (optional) |
| isActive | Boolean | @default(true) | Soft deactivation flag |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

### CrewAssignment

Join model linking a CrewMember to a specific tour departure date.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(cuid()) | Primary key |
| crewMemberId | String | required, indexed | FK → CrewMember |
| tourId | String | required | FK → Tour |
| departureDate | String | YYYY-MM-DD format | Trip departure date anchor |
| createdAt | DateTime | @default(now()) | |

**Indices:**
- `@@index([departureDate, tourId])`
- `@@index([crewMemberId, departureDate])` — used for conflict detection

### FleetAssignment

Join model linking a FleetAsset to a specific tour departure date.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(cuid()) | Primary key |
| fleetAssetId | String | required, indexed | FK → FleetAsset |
| tourId | String | required | FK → Tour |
| departureDate | String | YYYY-MM-DD format | Trip departure date anchor |
| createdAt | DateTime | @default(now()) | |

**Indices:**
- `@@index([departureDate, tourId])`
- `@@index([fleetAssetId, departureDate])` — used for conflict detection

### TripExpense

A financial record tied to a specific tour departure, used for net margin computation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | UUID, @id, @default(cuid()) | Primary key |
| departureDateGroup | String | YYYY-MM-DD format | Daily operational grouping anchor |
| tourId | String | required | FK → Tour |
| category | ExpenseCategory | | FUEL, CREW_PAYROLL, CATERING, PERMITS, or MISC |
| amount | Decimal | Decimal(10, 2), must be positive | Expense amount |
| currency | ExpenseCurrency | | USD or EGP |
| notes | String? | | Optional description |
| createdAt | DateTime | @default(now()) | |

**Indices:**
- `@@index([departureDateGroup, tourId])` — fast lookup for analytics grouping

## Enums

### CrewRole
```prisma
enum CrewRole {
  CAPTAIN
  GUIDE
  DRIVER
}
```

### FleetType
```prisma
enum FleetType {
  BOAT
  SPEEDBOAT
  VEHICLE
  QUAD
}
```

### ExpenseCategory
```prisma
enum ExpenseCategory {
  FUEL
  CREW_PAYROLL
  CATERING
  PERMITS
  MISC
}
```

### ExpenseCurrency
```prisma
enum ExpenseCurrency {
  USD
  EGP
}
```

## Validation Rules

1. **Amount**: Must be positive (reject negative values with 400 error).
2. **Category**: Must be one of the 5 predefined categories — no free-text categories.
3. **Currency**: Must be USD or EGP — no other currencies supported.
4. **departureDateGroup**: Must be valid `YYYY-MM-DD` format — server-validated before transaction.
5. **Atomic save**: All assignments and expenses for a given (tourId, departureDate) are replaced atomically — existing records are deleted, new ones are created within a single transaction.
6. **Duplicate assignment**: If a crew member or fleet asset is already assigned to a different tour on the same date, the API returns a `warnings[]` array with conflict details. The operator can re-submit with `force: true` to proceed.
7. **Exchange rate**: EGP amounts converted to USD at query time using `config/exchangeRates.ts`. Missing config falls back to hardcoded 48.50 with console warning.
8. **Past dates**: Dispatch and expense logging permitted for historical dates (no date validation blocking past entries).

## TypeScript Interfaces

```typescript
export interface TripDispatchPayload {
  tourId: string;
  departureDate: string;          // YYYY-MM-DD
  assignedCrewIds: string[];
  assignedAssetIds: string[];
  expenses: ExpenseRowInput[];
  force?: boolean;                // override conflict warnings
}

export interface ExpenseRowInput {
  category: ExpenseCategory;
  amount: number;
  currency: ExpenseCurrency;
  notes?: string;
}

export interface TripDispatchResponse {
  success: boolean;
  crewCount: number;
  assetCount: number;
  expenseCount: number;
  totalExpenseUSD: number;
  warnings: SchedulingConflict[];
}

export interface SchedulingConflict {
  type: 'CREW' | 'FLEET';
  resourceId: string;
  resourceName: string;
  conflictingTourId: string;
  conflictingTourTitle: string;
}

export interface DispatchPreloadData {
  assignedCrew: CrewMember[];
  assignedFleet: FleetAsset[];
  expenses: TripExpense[];
  crewPool: CrewMember[];
  fleetPool: FleetAsset[];
  computedTotalUSD: number;
}

export type ExpenseCategory = 'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC';
export type ExpenseCurrency = 'USD' | 'EGP';
export type CrewRole = 'CAPTAIN' | 'GUIDE' | 'DRIVER';
export type FleetType = 'BOAT' | 'SPEEDBOAT' | 'VEHICLE' | 'QUAD';
```

## State Transitions

```
Opened dispatcher (clean) → Add expense rows → Select crew/fleet → Save
  ├── No conflicts → 200, dispatch persisted
  ├── Conflicts found, force=false → 409, warnings array
  └── Conflicts found, force=true → 200, dispatch persisted with warnings

Saved dispatcher → Reopen → Pre-populated form → Edit → Save (same cycle)
```

## Analytics Integration

The analytics summary response is extended with:

```typescript
export interface ExecutiveDashboardStats {
  grossRevenueUSD: number;
  netMarginUSD: number;
  totalExpensesUSD: number;       // NEW: aggregate trip expenses
  passengerCount: number;
  topTourTitle: string;
  channelBreakdown: ChannelSummary[];
}
```

**Net margin formula:**
```
netMargin = grossRevenue - SUM(costPerPerson × passengerCount) - SUM(TripExpense amount in USD)
```
