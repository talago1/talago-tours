# Contract: GET /api/admin/operations/dispatch/[tourId]/[date]

## Purpose
Pre-populate the trip dispatcher with existing assignments, expenses, and available crew/fleet pool for a specific tour departure.

## Request

**Method**: GET
**Auth Required**: Yes (admin session middleware)
**Route Parameters**: `tourId` (string), `date` (string, YYYY-MM-DD)

## Response

### Success (200)
```typescript
interface DispatchPreloadResponse {
  assignedCrew: Array<{
    id: string;
    name: string;
    role: 'CAPTAIN' | 'GUIDE' | 'DRIVER';
  }>;
  assignedFleet: Array<{
    id: string;
    name: string;
    type: 'BOAT' | 'SPEEDBOAT' | 'VEHICLE' | 'QUAD';
  }>;
  expenses: Array<{
    id: string;
    category: 'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC';
    amount: number;
    currency: 'USD' | 'EGP';
    notes: string | null;
  }>;
  crewPool: Array<{
    id: string;
    name: string;
    role: 'CAPTAIN' | 'GUIDE' | 'DRIVER';
  }>;
  fleetPool: Array<{
    id: string;
    name: string;
    type: 'BOAT' | 'SPEEDBOAT' | 'VEHICLE' | 'QUAD';
  }>;
  computedTotalUSD: number;
}
```

### Tour Not Found (404)
```json
{
  "error": "Tour not found"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

## Implementation Notes
- Query CrewAssignment + FleetAssignment + TripExpense for the given (tourId, date) to build `assigned*` and `expenses`
- Query all active CrewMember and FleetAsset records for `crewPool` and `fleetPool`
- Compute `computedTotalUSD` server-side using exchange rate config
- All active crew/fleet are returned regardless of assignment status — the client disambiguates via the `assigned*` arrays
