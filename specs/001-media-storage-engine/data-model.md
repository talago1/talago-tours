# Data Model: Media & Storage Engine

## Entities

### Tour

The `Tour` entity is defined in the Prisma schema at `prisma/schema.prisma`.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | `String` (CUID) | Primary identifier | Auto-generated, immutable |
| `title` | `String` | Tour display name | Required |
| `description` | `String` | Tour description text | Required |
| `images` | `String[]` | Ordered array of public image URLs | Index 0 = primary cover; max 20 items |
| `createdAt` | `DateTime` | Record creation timestamp | Auto-set on create |
| `updatedAt` | `DateTime` | Last update timestamp | Auto-updated |

**Validation Rules**:
- `images` array length: 0–20 items
- Each URL must be a valid absolute URL pointing to the Supabase storage bucket
- Array order is semantically meaningful (index 0 = cover image)
- URLs must resolve to WebP images

### OptimizedAsset (Client-side only)

The `OptimizedAsset` interface is defined at `src/types/media.ts`. It is a client-side state entity — not persisted in the database directly (only its `fileUrl` is stored as part of the Tour `images` array).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique client-side identifier (UUID v4) |
| `fileUrl` | `string` | Temporary object URL (during upload) or final public URL (after upload) |
| `supabaseKey` | `string` | Storage path key inside the Supabase bucket |
| `isUploading` | `boolean` | Whether the asset is currently being uploaded |
| `progress` | `number` | Upload progress percentage (0–100) |

**State Transitions**:

```
[File Selected]
    │
    ▼
isUploading = true, progress = 0, fileUrl = objectURL
    │
    ├── Canvas WebP Compression ──► failure → asset removed from collection
    │
    ▼
isUploading = true, progress = 0, blob ready
    │
    ├── Signed URL Request ──► failure → asset removed from collection
    │
    ▼
isUploading = true, progress = 0..100, direct PUT upload
    │
    ├── Network failure ──► asset removed from collection
    │
    ▼
isUploading = false, progress = 100, fileUrl = public Supabase URL
```

## Relationships

```
Tour (1) ──► Image URLs (many)
  │
  └── images: String[]  (ordered, index 0 = cover)
```

The Tour entity owns a flat ordered array of image URLs. There is no separate Image entity in the database — the URL array is embedded in the Tour record. This is appropriate because:
- Images have no lifecycle independent of their parent Tour
- The ordered array naturally represents the cover-first semantics
- PostgreSQL `text[]` supports efficient array operations
- Avoids a separate JOIN table for simple media collections
