# Contract: GET /api/public/tours

## Purpose
Unauthenticated endpoint returning filtered active tours for the public catalog page.

## Request

**Method**: GET
**Auth Required**: No (public, unauthenticated)
**Rate Limited**: Yes (application-level — 100 req/min per IP recommended)

### Query Parameters (all optional)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| destination | string | Filter by destination slug | `?destination=hurghada` |
| type | string | Filter by tour category (uppercase) | `?type=SNORKELING` |
| minPrice | number | Minimum base price filter | `?minPrice=50` |
| maxPrice | number | Maximum base price filter | `?maxPrice=200` |
| search | string | Keyword search in title and description | `?search=reef` |

### Examples

```
GET /api/public/tours
GET /api/public/tours?destination=hurghada
GET /api/public/tours?type=SNORKELING&maxPrice=100
GET /api/public/tours?search=dolphin&destination=sharm-el-sheikh
GET /api/public/tours?type=SAFARI&minPrice=50&maxPrice=150
```

## Response

### Success (200)
```json
{
  "tours": [
    {
      "id": "clx...",
      "title": "Dolphin House Reef Snorkeling",
      "slug": "dolphin-house-reef-snorkeling",
      "basePrice": 75.00,
      "duration": "4 hours",
      "rating": 4.5,
      "thumbnailUrl": "https://supabase.co/storage/.../dolphin-thumb.webp",
      "category": "SNORKELING",
      "destination": {
        "name": "Hurghada",
        "slug": "hurghada"
      }
    }
  ],
  "total": 1
}
```

### Empty — No tours match (200)
```json
{
  "tours": [],
  "total": 0
}
```

### Rate Limited (429)
```json
{
  "error": "Too many requests. Please try again later."
}
```

## Implementation Notes

- Query the Tour table with `where: { status: 'ACTIVE' }` as the base filter
- Apply additional filters dynamically based on query params:
  - `destination` → `destination.slug = param`
  - `type` → `category = param`
  - `minPrice` / `maxPrice` → `basePrice >= minPrice AND basePrice <= maxPrice`
  - `search` → `OR: [title contains search (insensitive), description contains search (insensitive)]`
- Use selective Prisma `select` projection to return only required fields
- All filters combine with AND logic (FR-007)
- No pagination needed for expected data volume (< 100 tours)
- Order by `title` ascending for consistent display
- Decimal `basePrice` is serialized as a number in the JSON response
