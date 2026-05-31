# Data Model: Age-Bracket Pricing

## Entities

### Tour (extended)

The Tour model has direct scalar fields for pricing tiers rather than a JSON blob.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `String` (CUID) | `@id @default(cuid())` | Existing |
| `slug` | `String` | `@unique` | Existing |
| `type` | `TourType` (enum) | Required | Existing — `SHARED` or `PRIVATE` |
| `basePriceUSD` | `Float` | Required | Existing — base tour price |
| ... | ... | ... | Existing fields unchanged |
| `adultPrice` | `Float` | **Required** | New — base adult price |
| `childPrice` | `Float?` | Optional | New — child price when child tier enabled |
| `childMinAge` | `Int?` | Default `3` | New — minimum child age |
| `childMaxAge` | `Int?` | Default `11` | New — maximum child age |
| `infantPrice` | `Float?` | Optional | New — infant price when infant tier enabled |
| `infantMinAge` | `Int?` | Default `0` | New — minimum infant age |
| `infantMaxAge` | `Int?` | Default `2` | New — maximum infant age |
| `ageRestrictionsNotes` | `String?` | Optional | New — free-text safety restrictions |

## Validation Rules

### Client-side (before save attempt)

1. Adult price must be > 0
2. If child pricing enabled: child price > 0, childMaxAge > childMinAge
3. If infant pricing enabled: infant price > 0, infantMaxAge > infantMinAge
4. No negative values in any numeric input

### Server-side (on save)

1. Re-validate all client-side rules
2. Check slug uniqueness (pre-existing rule)
3. Validate all required translation fields present

## State Transitions

No state machine. Pricing configuration is embedded in the Tour record and saved atomically as part of the main tour create operation.

## Database Diagram

```text
Tour
  ┌──────────────────────┐
  │ id (PK)              │
  │ slug (UNIQUE)        │
  │ type (TourType)      │
  │ basePriceUSD         │
  │ durationHours        │
  │ maxCapacity          │
  │ zoneId               │
  │ adultPrice           │  ← Required
  │ childPrice           │  ← Nullable, set when child tier enabled
  │ childMinAge          │  ← Nullable, default 3
  │ childMaxAge          │  ← Nullable, default 11
  │ infantPrice          │  ← Nullable, set when infant tier enabled
  │ infantMinAge         │  ← Nullable, default 0
  │ infantMaxAge         │  ← Nullable, default 2
  │ ageRestrictionsNotes │  ← Nullable
  │ ...                  │
  └──────────────────────┘
```
