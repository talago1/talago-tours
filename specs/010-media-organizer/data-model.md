# Data Model: MediaAsset

## Entity: MediaAsset

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String (UUID/CUID) | @id @default(cuid()) | Primary key |
| filename | String | Required | Original filename or display name |
| filePath | String | Required | Supabase Storage URL from Feature 001 upload |
| displayOrder | Int | Required, default 0 | Zero-indexed sequential position |
| mimeType | String | Required | e.g., "image/webp" |
| tourId | String | Required, FK → Tour(id) | Scoping tour |
| createdAt | DateTime | @default(now()) | Auto-set |
| updatedAt | DateTime | @updatedAt | Auto-set |

### Relationships

- **Tour** (parent): `tourId` → `Tour.id`, cascade delete
- **Index**: `@@index([tourId])` for efficient tour-scoped queries

### Validation Rules

- `displayOrder` must be ≥ 0
- `filePath` must be a valid Supabase Storage URL
- `tourId` must reference an existing Tour

### State Transitions

MediaAsset is stateless — no lifecycle beyond CRUD:
- **Create**: Via Feature 001 upload callback (future) or direct DB insert (current)
- **Read**: Tour-scoped fetch ordered by displayOrder ASC
- **Update**: displayOrder only (via reorder)
- **Delete**: Remove record, renumber remaining siblings

## Prisma Schema

```prisma
model MediaAsset {
  id           String   @id @default(cuid())
  filename     String
  filePath     String
  displayOrder Int      @default(0)
  mimeType     String
  tourId       String
  tour         Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tourId])
}
```

## Tour Model Update

Add to existing Tour model:
```prisma
model Tour {
  // ... existing fields ...
  mediaAssets MediaAsset[]
}
```
