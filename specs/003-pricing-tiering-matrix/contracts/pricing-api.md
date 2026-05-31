# API Contract: Age-Bracket Pricing (Embedded in Tour Create)

## Endpoint

Pricing data is **embedded** within the tour create payload — not a standalone endpoint.

```
POST /api/admin/tours/create      (create tour with age-bracket pricing)
```

## Request (pricing portion of tour create payload)

```typescript
{
  // ... other tour fields ...

  // Pricing (always required)
  adultPrice: number;               // Required, must be > 0

  // Child tier (optional)
  childEnabled?: boolean;
  childPrice?: number;              // Required if childEnabled, must be > 0
  childMinAge?: number;             // Required if childEnabled, default 3
  childMaxAge?: number;             // Required if childEnabled, default 11, must be > childMinAge

  // Infant tier (optional)
  infantEnabled?: boolean;
  infantPrice?: number;             // Required if infantEnabled, must be > 0
  infantMinAge?: number;            // Required if infantEnabled, default 0
  infantMaxAge?: number;            // Required if infantEnabled, default 2, must be > infantMinAge

  // Age restrictions
  ageRestrictionsNotes?: string;    // Optional free text
}
```

### Examples

**Safari tour with child + infant pricing:**
```json
{
  "slug": "red-sea-safari",
  "type": "SHARED",
  "adultPrice": 120,
  "childEnabled": true,
  "childPrice": 60,
  "childMinAge": 3,
  "childMaxAge": 11,
  "infantEnabled": true,
  "infantPrice": 0,
  "infantMinAge": 0,
  "infantMaxAge": 2,
  "ageRestrictionsNotes": "Minimum age for driving Quad Safari is 16 years. Children under 6 are not allowed on quad bikes."
}
```

**Adult-only diving tour (no child/infant pricing):**
```json
{
  "slug": "deep-blue-dive",
  "type": "PRIVATE",
  "adultPrice": 200,
  "childEnabled": false,
  "infantEnabled": false
}
```

## Response

### 201 Success
```typescript
{
  tour: {
    id: string;
    slug: string;
    type: string;
    basePriceUSD: number;
    durationHours: number;
    maxCapacity: number;
    zoneId: string;
    createdAt: string;
  };
  message: string;
}
```

### 400 Bad Request — Validation Error
```typescript
{
  error: string;
  field?: string;       // e.g. "adultPrice", "childMaxAge"
}
```

### 409 Conflict — Slug Duplicate
```typescript
{
  error: string;
  field: "slug";
}
```

## Server-side Validation Rules

1. `adultPrice` must be a number > 0 (required)
2. If `childEnabled === true`: `childPrice` > 0, `childMaxAge` > `childMinAge`
3. If `infantEnabled === true`: `infantPrice` > 0, `infantMaxAge` > `infantMinAge`
4. When a tier is disabled, its associated fields are ignored (stored as `null`)
5. `ageRestrictionsNotes` is stored as-is (optional, no validation beyond type check)
