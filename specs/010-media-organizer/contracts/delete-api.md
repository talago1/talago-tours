# Contract: DELETE /api/admin/media/[id]

## Purpose
Delete a single MediaAsset and renumber remaining assets for the tour.

## Request

**Method**: DELETE
**Auth Required**: Yes (admin middleware)
**Parameters**: `id` — MediaAsset ID (route parameter)

## Response

### Success (200)
```typescript
interface DeleteResponse {
  success: true;
  message: "Asset deleted successfully";
  tourId: string;
  remainingCount: number;
}
```

### Error (404)
```json
{
  "success": false,
  "error": "Asset not found"
}
```

### Error (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Error (500)
```json
{
  "success": false,
  "error": "Delete failed"
}
```

## Implementation Notes
- Find asset by id first (returns 404 if missing)
- Use `prisma.$transaction`:
  1. Delete the MediaAsset record
  2. Fetch remaining assets for the same tourId ordered by displayOrder
  3. Update each with new sequential displayOrder (0, 1, 2, ...)
- Return tourId so UI can refetch if needed
