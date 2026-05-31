# Quickstart: Media & Storage Engine

## Prerequisites

1. Supabase project with storage bucket `talago-tour-media` created and set to public read
2. Environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (for Prisma)

## Integration

### 1. Add MediaManager to your Tour form

```tsx
import MediaManager from '@/components/admin/MediaManager';

function TourForm() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleSubmit = async () => {
    // imageUrls[0] is always the cover image
    await saveTour({ images: imageUrls, ...otherFields });
  };

  return (
    <form onSubmit={handleSubmit}>
      <MediaManager
        value={imageUrls}
        onChange={setImageUrls}
        maxFiles={20}
      />
    </form>
  );
}
```

### 2. API route auto-wires

The `POST /api/media/sign-upload` endpoint is called automatically by `imageCompressor.ts` during the upload flow. No manual wiring needed.

## File Reference

| File | Purpose |
|------|---------|
| `src/app/api/media/sign-upload/route.ts` | Signed URL generation endpoint |
| `src/utils/imageCompressor.ts` | Canvas-based WebP compression utility |
| `src/components/admin/MediaManager.tsx` | Drag-and-drop uploader UI component |
| `src/types/media.ts` | `OptimizedAsset` TypeScript interface |

## Flow

```
User drops files ──► imageCompressor.ts (Canvas → WebP)
                         │
                         ▼
                    POST /api/media/sign-upload
                         │
                         ▼
                    Signed URL received (60s validity)
                         │
                         ▼
                    Direct PUT upload with progress
                         │
                         ▼
                    State updated → parent onChange(urls)
```
