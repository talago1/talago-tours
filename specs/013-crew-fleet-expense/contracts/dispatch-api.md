# Contract: POST /api/admin/operations/dispatch

## Purpose
Save crew assignments, fleet assignments, and trip expenses for a specific tour departure in one atomic transaction.

## Request

**Method**: POST
**Auth Required**: Yes (admin session middleware)
**Content-Type**: application/json

```typescript
interface TripDispatchPayload {
  tourId: string;
  departureDate: string;          // YYYY-MM-DD format
  assignedCrewIds: string[];      // CrewMember UUIDs
  assignedAssetIds: string[];     // FleetAsset UUIDs
  expenses: {
    category: 'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC';
    amount: number;               // positive decimal
    currency: 'USD' | 'EGP';
    notes?: string;
  }[];
  force?: boolean;                // if true, override scheduling conflicts
}
```

## Response

### Success (200) — No conflicts
```json
{
  "success": true,
  "crewCount": 3,
  "assetCount": 2,
  "expenseCount": 5,
  "totalExpenseUSD": 1850.00,
  "warnings": []
}
```

### Success (200) — With conflicts (force: true)
```json
{
  "success": true,
  "crewCount": 3,
  "assetCount": 2,
  "expenseCount": 5,
  "totalExpenseUSD": 1850.00,
  "warnings": [
    {
      "type": "CREW",
      "resourceId": "ckl...",
      "resourceName": "Ahmed Said",
      "conflictingTourId": "ckm...",
      "conflictingTourTitle": "Desert Safari Adventure"
    }
  ]
}
```

### Conflict (409) — Conflicts detected, force not set
```json
{
  "success": false,
  "error": "Scheduling conflicts detected",
  "warnings": [
    {
      "type": "FLEET",
      "resourceId": "ckn...",
      "resourceName": "Speedboat Alpha",
      "conflictingTourId": "cko...",
      "conflictingTourTitle": "Island Hopping Tour"
    }
  ]
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "expenses[0].amount", "message": "Amount must be positive" },
    { "field": "departureDate", "message": "Must be in YYYY-MM-DD format" }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

## Implementation Notes
- Use `prisma.$transaction` for all DB writes
- Delete-then-create pattern: clear all existing assignments + expenses for (tourId, departureDate) then insert new ones
- Conflict detection query runs inside the transaction before the delete step
- Negative amount validation must happen before the transaction (fail fast)
- Return `totalExpenseUSD` computed server-side as the verified total
