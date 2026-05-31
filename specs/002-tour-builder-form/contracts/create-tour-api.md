# API Contract: Create Tour

## Endpoint

```
POST /api/admin/tours/create
```

## Request

### Headers
- `Content-Type: application/json`

### Body

```typescript
{
  slug: string;                    // URL-safe: lowercase, hyphens, numbers
  type: 'SHARED' | 'PRIVATE';
  basePriceUSD: number;            // > 0
  durationHours: number;           // > 0, integer
  maxCapacity: number;             // > 0, integer
  zoneId: string;                  // valid Zone ID
  translations: {
    en: { title: string; description: string; cancellationPolicies: string[] };
    de: { title: string; description: string; cancellationPolicies: string[] };
    ru: { title: string; description: string; cancellationPolicies: string[] };
    fr: { title: string; description: string; cancellationPolicies: string[] };
    it: { title: string; description: string; cancellationPolicies: string[] };
    tr: { title: string; description: string; cancellationPolicies: string[] };
  };
}
```

All 6 language keys MUST be present in translations (even if fields are empty strings).

## Response

### 201 Created
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
  message: string;   // e.g. "Tour created successfully"
}
```

### 400 Bad Request — Validation Error
```typescript
{
  error: string;              // e.g. "English title is required"
  field?: string;             // optional field reference for inline error
}
```

### 409 Conflict — Duplicate Slug
```typescript
{
  error: string;              // e.g. "A tour with this slug already exists"
  field: 'slug';
}
```

### 500 Internal Server Error
```typescript
{
  error: string;              // e.g. "Failed to create tour"
}
```

## Server-side Validation Rules

1. `slug` — required, URL-safe pattern (`^[a-z0-9-]+$`), < 200 chars
2. `slug` — unique in database (checked before insert)
3. `basePriceUSD` — must be > 0
4. `durationHours` — must be > 0, integer
5. `maxCapacity` — must be > 0, integer
6. `zoneId` — must reference an existing Zone
7. `type` — must be `SHARED` or `PRIVATE`
8. `translations` — must contain all 6 language keys
9. `translations.en.title` — must be non-empty string
10. `translations.en.description` — must be non-empty string

## Error Handling

- Client-side validation catches format errors before submission
- Server-side replay checks all rules (defense in depth)
- Slug uniqueness is checked first to provide a clear inline error
- All errors return a `field` hint for inline UI mapping where applicable
