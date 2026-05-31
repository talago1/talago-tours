# Contract: POST /api/admin/media/reorder

## Purpose
Persist a new display order for a tour's media assets after drag-and-drop.

## Request

**Method**: POST
**Auth Required**: Yes (admin middleware)
**Content-Type**: application/json

```typescript
interface ReorderRequest {
  tourId: string;
  orderedAssetIds: string[];  // Asset IDs in new order (oldest displayOrder first)
}
```

### Validation
- `tourId`: Must be a valid, non-empty string referencing an existing Tour
- `orderedAssetIds`: Must be a non-empty array of valid MediaAsset IDs
- All `orderedAssetIds` must belong to the specified `tourId`
- Array length must match the total count of assets for that tour (full reorder only)

## Response

### Success (200)
```typescript
interface ReorderResponse {
  success: true;
  message: "Reorder successful";
  assets: {
    id: string;
    displayOrder: number;
  }[];
}
```

### Error (400)
```json
{
  "success": false,
  "error": "orderedAssetIds must belong to the specified tour"
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
  "error": "Reorder failed"
}
```

## Implementation Notes
- Execute within `prisma.$transaction`
- Map each ID to sequential displayOrder starting at 0
- Verify all asset IDs belong to tourId before updating
- Return updated assets for UI confirmation
