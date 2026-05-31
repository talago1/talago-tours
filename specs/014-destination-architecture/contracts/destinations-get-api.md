# Contract: GET /api/admin/destinations

## Purpose
Fetch all destinations sorted alphabetically for display in the admin grid and populate selector dropdowns.

## Request

**Method**: GET
**Auth Required**: Yes (admin session middleware)

## Response

### Success (200)
```json
{
  "destinations": [
    {
      "id": "uuid-1",
      "name": "Dahab",
      "slug": "dahab",
      "imageUrl": "https://supabase.co/storage/.../dahab.jpg",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-15T00:00:00.000Z",
      "_count": { "tours": 3 }
    },
    {
      "id": "uuid-2",
      "name": "Hurghada",
      "slug": "hurghada",
      "imageUrl": "https://supabase.co/storage/.../hurghada.jpg",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-15T00:00:00.000Z",
      "_count": { "tours": 12 }
    }
  ],
  "total": 5
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

## Implementation Notes
- Query `prisma.destination.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { tours: true } } } })`
- No pagination needed for expected data volume (< 100 destinations)
- Used by both DestinationManager grid and DestinationSelect dropdown
