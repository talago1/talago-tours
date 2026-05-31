# Research: Media Organizer (Feature 010)

## Decision Log

### 1. MediaAsset Database Model
- **Decision**: PostgreSQL via Prisma (single schema with Tour)
- **Rationale**: Single database, Prisma migrations, no operational complexity. MediaAsset is a simple FK reference to Tour — no reason for separate DB.
- **Alternatives considered**: SQLite (separate DB management overhead, dual providers in Prisma)
- **Source**: Spec clarification Q1

### 2. MediaAsset ↔ Storage Relationship
- **Decision**: MediaAsset is metadata referencing Feature 001 Supabase uploads
- **Rationale**: Feature 001 already handles upload, compression, and storage. MediaAsset records the resulting Supabase URL — no duplicate upload mechanism.
- **Alternatives considered**: New upload pipeline (duplication, violates separation of concerns)
- **Source**: Spec clarification Q2

### 3. Drag-and-Drop Implementation
- **Decision**: Native HTML5 Drag and Drop API
- **Rationale**: Constitution bans third-party animation libraries (§II). Native `onDragStart`/`onDragOver`/`onDrop` handle the sorting intent without bloat. State array reordering on client before API call achieves instant feedback.
- **Alternatives considered**: react-beautiful-dnd, dnd-kit (banned by constitution), sortablejs (third-party, banned)

### 4. Optimistic Update Strategy
- **Decision**: Client-side state array mutation → API call → rollback on failure
- **Rationale**: Reorder and delete are idempotent operations. Saving current state snapshot before mutation allows clean rollback if API fails. No complex conflict resolution needed due to single-admin usage pattern.
- **Alternatives considered**: Pessimistic update (worse UX — visual delay before reorder), WebSocket sync (overengineered for <50 images)

### 5. Display Order Sequencing
- **Decision**: Zero-indexed, sequential, no gaps, recalculated on every mutation
- **Rationale**: Simplifies display logic. Every reorder or delete triggers a full renumber (0, 1, 2, ...) within the transaction.
- **Alternatives considered**: Gap-based ordering (e.g., 1000, 2000 — frags over time), float ordering (complex comparison)

### 6. Thumbnail Strategy
- **Decision**: Supabase URL with image transformation parameters
- **Rationale**: Supabase Storage supports URL-based transforms (?width=300&height=300&resize=cover). No server-side processing needed. Lighter grid loads.
- **Alternatives considered**: Server-side processing (banned by constitution), client-side resize (redundant work)

### 7. API Transaction Pattern
- **Decision**: `prisma.$transaction` with sequential update
- **Rationale**: Atomicity guarantees no partial state. If transaction fails, grid state remains unchanged. Sequential updates within transaction are predictable and debuggable.
- **Alternatives considered**: Single `updateMany` (cannot set per-record displayOrder), raw SQL (less type-safe)

## Best Practices

### Prisma Transactions for Reorder
```typescript
await prisma.$transaction(
  orderedAssetIds.map((id, index) =>
    prisma.mediaAsset.update({
      where: { id },
      data: { displayOrder: index },
    })
  )
);
```

### Native HTML5 Drag and Drop Pattern
- `draggable={true}` on card
- `onDragStart`: record dragged index, set ghost style
- `onDragOver`: `preventDefault()` to allow drop, highlight target
- `onDrop`: reorder state array, trigger API call
- `onDragEnd`: clean up ghost state

### Optimistic Update Pattern
```typescript
const previousState = [...items];
setItems(newOrder);
try {
  await fetch('/api/admin/media/reorder', { ... });
} catch {
  setItems(previousState);
  showErrorToast();
}
```
