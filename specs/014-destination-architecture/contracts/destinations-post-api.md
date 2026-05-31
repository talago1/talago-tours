# Contract: POST /api/admin/destinations

## Purpose
Create a new destination with auto-generated slug.

## Request

**Method**: POST
**Auth Required**: Yes (admin session middleware)
**Content-Type**: application/json

```json
{
  "name": "Marsa Alam",
  "imageUrl": "https://supabase.co/storage/.../marsa-alam.jpg"
}
```

## Response

### Success (201)
```json
{
  "id": "uuid-3",
  "name": "Marsa Alam",
  "slug": "marsa-alam",
  "imageUrl": "https://supabase.co/storage/.../marsa-alam.jpg",
  "createdAt": "2026-05-30T00:00:00.000Z",
  "updatedAt": "2026-05-30T00:00:00.000Z",
  "_count": { "tours": 0 }
}
```

### Validation Error (400) — Duplicate slug
```json
{
  "error": "A destination with slug 'marsa-alam' already exists"
}
```

### Validation Error (400) — Missing name
```json
{
  "error": "Destination name is required"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

## Implementation Notes
- Generate slug server-side using `generateSlug(name)` utility — never trust client-provided slug
- Wrap in try-catch for Prisma `P2002` unique constraint violation → return friendly duplicate error
- `imageUrl` is optional — accept existing signed URL from the media upload pipeline
