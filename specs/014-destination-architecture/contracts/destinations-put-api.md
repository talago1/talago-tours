# Contract: PUT /api/admin/destinations/[id]

## Purpose
Update an existing destination's name and/or thumbnail image. Slug auto-regenerates on name change.

## Request

**Method**: PUT
**Auth Required**: Yes (admin session middleware)
**Route Parameters**: `id` (string, UUID)
**Content-Type**: application/json

```json
{
  "name": "Marsa Alam City",
  "imageUrl": "https://supabase.co/storage/.../marsa-alam-updated.jpg"
}
```

## Response

### Success (200)
```json
{
  "id": "uuid-3",
  "name": "Marsa Alam City",
  "slug": "marsa-alam-city",
  "imageUrl": "https://supabase.co/storage/.../marsa-alam-updated.jpg",
  "createdAt": "2026-05-30T00:00:00.000Z",
  "updatedAt": "2026-05-30T00:00:01.000Z",
  "_count": { "tours": 0 }
}
```

### Validation Error (400) — Duplicate slug after rename
```json
{
  "error": "A destination with slug 'marsa-alam-city' already exists"
}
```

### Not Found (404)
```json
{
  "error": "Destination not found"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

## Implementation Notes
- Regenerate slug only if name changed — preserve existing slug if only imageUrl changes
- Unique constraint check applies to the new slug (may conflict with another destination)
- Partial update supported — send only the fields to change
