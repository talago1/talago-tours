# Feature 010: Media Organizer — Quickstart

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `prisma/schema.prisma` | Add `MediaAsset` model |
| 2 | `src/app/api/admin/media/reorder/route.ts` | Create (POST reorder endpoint) |
| 3 | `src/app/api/admin/media/[id]/route.ts` | Create (DELETE endpoint) |
| 4 | `src/components/admin/MediaOrganizer.tsx` | Create (drag-drop grid) |
| 5 | `src/components/admin/MediaCard.tsx` | Create (asset card) |

## Steps

### 1. Prisma Schema
Add the MediaAsset model to `prisma/schema.prisma` and run:
```bash
npx prisma migrate dev --name add-media-asset
npx prisma generate
```

### 2. API Endpoints
Create reorder and delete route handlers under `src/app/api/admin/media/`.

### 3. Components
Create `MediaOrganizer.tsx` and `MediaCard.tsx` in `src/components/admin/`.

### 4. Integration
Mount `MediaOrganizer` in the admin tour detail page, passing `tourId` as prop.

### 5. Agent Context
Update `AGENTS.md` to point plan reference to this directory.

## Key Interfaces

```typescript
interface MediaAsset {
  id: string;
  filename: string;
  filePath: string;       // Supabase URL
  displayOrder: number;
  mimeType: string;
  tourId: string;
}

interface ReorderPayload {
  tourId: string;
  orderedAssetIds: string[];
}
```

## Architecture Flow

```
User drags card
  → onDrop: reorder client state (optimistic)
  → POST /api/admin/media/reorder
  → prisma.$transaction update displayOrder
  → success: confirm state | failure: rollback + toast
```
