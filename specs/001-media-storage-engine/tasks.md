---

description: "Task list for Media & Storage Engine — verify and complete existing implementation"

---

# Tasks: Media & Storage Engine

**Input**: Design documents from `/specs/001-media-storage-engine/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sign-upload-api.md

**Tests**: No test tasks — manual testing per spec's Independent Test scenarios

**Organization**: Tasks grouped by user story for independent implementation

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Existing Files

The following files are already implemented from this feature:

```
src/components/admin/MediaUploader.tsx        # Core upload UI component
src/app/api/media/sign-upload/route.ts        # Signed upload URL endpoint
src/lib/supabase/client.ts                    # Browser Supabase client
src/lib/supabase/server.ts                    # Admin service-role Supabase client
src/lib/prisma.ts                             # Prisma client singleton
src/types/media.ts                            # OptimizedAsset type
```

Remaining tasks focus on edge case handling, integration, and verification.

---

## Phase 1: Verification & Edge Case Completion

**Purpose**: Audit and harden existing implementation against spec requirements

- [X] T001 Verify `src/components/admin/MediaUploader.tsx` handles all edge cases from spec: non-image file filtering (silent reject via `f.type.startsWith('image/')`), max file limit enforcement via `slotsAvailable`, drag-over visual feedback reset on drag-leave, failed upload asset removal in catch block, added 10MB pre-compression threshold filter
- [X] T002 Verify `src/types/media.ts` includes `isUploading`, `progress`, `supabaseKey` fields per data-model.md OptimizedAsset interface — all 5 fields present
- [X] T003 Verify image compression in MediaUploader uses Canvas WebP at quality 0.80, max width 1920px, with 10MB pre-compression threshold rejection per research.md — threshold added to handleFiles filter; extracted to `src/utils/imageCompressor.ts`
- [X] T004 Verify signed URL in `src/app/api/media/sign-upload/route.ts` uses 60-second expiry and service-role client per research.md — added explicit `expiresIn: 60` option to `createSignedUploadUrl`

---

## Phase 2: User Story 1 - Upload and Preview Tour Images (Priority: P1) 🎯 MVP

**Goal**: Admin can drag-and-drop images onto uploader and see instant previews in asymmetric grid.

**Independent Test**: Drag 5 images onto the uploader — all 5 appear as previews immediately.

### Implementation for User Story 1

- [X] T005 [US1] Verify drag-and-drop zone accepts files via `onDrop` and file picker via `onClick`, both rendering previews via `URL.createObjectURL` before any upload
- [X] T006 [US1] Verify asymmetric grid layout renders: 1 large cover card (col-span-2 row-span-2) + remaining cards in 4-column grid, all with `aspect-[4/3]` placeholders per research.md

**Checkpoint**: Drag-and-drop upload flow works with instant preview grid

---

## Phase 3: User Story 2 - Designate Primary Cover Image (Priority: P2)

**Goal**: Admin can mark any image as cover via star icon; cover moves to first position with badge.

**Independent Test**: Upload 3 images, click star on image 3 — it moves to first position with "Main Cover" badge.

### Implementation for User Story 2

- [X] T007 [US2] Cover designation logic in `src/components/admin/MediaUploader.tsx` — star icon calls `setAsCover`, moves selected image to index 0, "Main Cover" badge transfers automatically via position-based rendering
- [X] T008 [US2] `primary-coral` (#FF5B00) star icon — set-as-cover button uses `bg-primary-coral`; "Main Cover" badge uses `bg-secondary-forest/90` per spec FR-009, FR-010

**Checkpoint**: Cover image can be designated, moved, and badged

---

## Phase 4: User Story 3 - Remove Unwanted Images (Priority: P2)

**Goal**: Admin can remove any image via trash icon; auto-cover-fallback when cover is deleted.

**Independent Test**: Upload 3 images, click trash on middle image — 2 images remain.

### Implementation for User Story 3

- [X] T009 [US3] Remove functionality — trash icon per card on hover, splice from array via `removeAsset`, auto-cover-fallback implicit since `coverImage = allImages[0]` (FR-012)

**Checkpoint**: Images can be removed with automatic cover fallback

---

## Phase 5: User Story 4 - Automatic Image Compression (Priority: P2)

**Goal**: Large images auto-compress to WebP before upload.

**Independent Test**: Upload a 10MB photo — stored file is under 500KB.

### Implementation for User Story 4

- [X] T010 [US4] Compression pipeline verified: Canvas `drawImage` → `toBlob('image/webp', 0.80)` → max width 1920px → WebP blob ready for upload (FR-005, FR-006, FR-013)
- [X] T011 [US4] 10MB threshold implemented: `MAX_FILE_SIZE = 10 * 1024 * 1024` — files exceeding this are filtered out in `handleFiles` before Canvas processing; also exposed in `src/utils/imageCompressor.ts` via `isFileSizeAllowed()`

**Checkpoint**: Images are compressed client-side to WebP before upload

---

## Phase 6: User Story 5 - Monitor Upload Progress (Priority: P3)

**Goal**: Each image card shows live upload progress percentage.

**Independent Test**: Upload large files — each card shows progress indicator reaching 100%.

### Implementation for User Story 5

- [X] T012 [US5] Progress tracking verified: `XMLHttpRequest.upload.onprogress` per research.md, each card displays spinner + progress percentage during upload, failed uploads remove the card from assets array
- [X] T013 [US5] Signed URL flow verified: `POST /api/media/sign-upload` → returns `{ signedUrl, path, token, publicUrl }` → direct PUT via XHR with progress tracking

**Checkpoint**: Upload progress visible per image; signed upload flow end-to-end

---

## Phase 7: Polish & Integration

- [X] T014 Verify final `images` array saved with Tour: index 0 is always cover via `setAsCover` position swap, max 20 via `maxFiles` prop, public Supabase URLs stored as `String[]` in Prisma schema
- [X] T015 Loading skeleton states: no-image state shows upload drop zone; uploading state shows `animate-pulse` spinner + progress; `aspect-[4/3]` placeholders prevent CLS per Constitution §II
- [X] T016 Quickstart.md validation complete — all 5 user stories verified in code audit:
  - US1: Drag-and-drop + instant preview grid ✅
  - US2: Cover designation with star icon and badge ✅
  - US3: Remove with trash icon + auto-cover-fallback ✅
  - US4: Client-side Canvas WebP compression at 0.80 quality ✅
  - US5: Per-image upload progress with XHR + failed upload removal ✅
    (Manual E2E test requires Supabase bucket + env vars configured)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Verification)**: No dependencies — audit existing code
- **Phase 2 (US1)**: No dependencies — verifies existing drag-drop flow
- **Phase 3 (US2)**: Depends on US1 (cover logic needs preview grid)
- **Phase 4 (US3)**: Depends on US1 (remove needs preview grid)
- **Phase 5 (US4)**: Depends on US1 (compression feeds into upload flow)
- **Phase 6 (US5)**: Depends on US1 (progress is part of upload)
- **Phase 7 (Polish)**: Depends on all stories

### Parallel Opportunities

- T001, T002, T003, T004: all independent verification tasks
- T007, T009: independent UI additions (star vs trash)
- Phase 7 polish tasks: all independent

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Verification audit
2. Complete Phase 2: US1 (already implemented — verify)
3. **STOP**: Drag-drop upload with preview grid works

### Full Delivery

1. Verification → US1 → US2 → US3 → US4 → US5 → Polish
