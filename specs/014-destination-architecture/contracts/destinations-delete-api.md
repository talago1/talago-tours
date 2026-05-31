# Contract: DELETE /api/admin/destinations/[id]

## Purpose
Delete a destination. Only succeeds if no tours are assigned to the destination.

## Request

**Method**: DELETE
**Auth Required**: Yes (admin session middleware)
**Route Parameters**: `id` (string, UUID)

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Destination deleted successfully"
}
```

### Conflict (400) — Tours assigned
```json
{
  "success": false,
  "error": "Cannot delete 'Hurghada': 12 tours are assigned to this destination. Remove or reassign the tours first."
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
- Pre-check: `prisma.tour.count({ where: { destinationId: id } })` before attempting delete
- Return friendly message with destination name and tour count
- The `onDelete: Restrict` constraint at the DB level is the safety net — the pre-check provides a better UX
