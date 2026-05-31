# Feature Specification: Local Media Storage Organizer, SQLite Synchronization & Drag-and-Drop Photo Manager

**Feature Branch**: `010-media-organizer`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Feature: Local Media Storage Organizer, SQLite Synchronization & Drag-and-Drop Photo Manager"

## Clarifications

### Session 2026-05-30

- Q: Should MediaAsset records use the existing PostgreSQL database via Prisma or a separate local SQLite database? → A: Use existing PostgreSQL via Prisma — add MediaAsset as a new model to schema.prisma.
- Q: Are MediaAsset entries metadata references to Feature 001's Supabase-stored uploads, or a separate upload mechanism? → A: MediaAsset is metadata referencing assets already uploaded via Feature 001 (Supabase Storage URL in filePath).

## User Scenarios & Testing

### User Story 1 - Admin reorders tour media assets via drag-and-drop (Priority: P1)

An admin user managing a specific tour's media gallery sees all uploaded images in a responsive grid. They can drag any image card to a new position within the grid. On drop, the image instantly snaps to its new position (optimistic update), and the new ordering is persisted in the background. All other images in the grid shift fluidly to accommodate the change.

**Why this priority**: Drag-and-drop reordering is the core interaction this feature delivers — without it there is no value.

**Independent Test**: Can be fully tested by opening a tour's media grid, dragging an image from position 1 to position 4, and confirming: (1) the image appears in position 4 immediately, (2) images 2–3 shift up by one, (3) refreshing the page shows the persisted new order.

**Acceptance Scenarios**:

1. **Given** a tour has 6 uploaded images displayed in a responsive grid, **When** the admin drags image at index 2 to index 5, **Then** image 2 immediately appears at index 5 and all affected images reindex.
2. **Given** an image is being dragged, **When** it hovers over a droppable grid position, **Then** the dragged image shows a ghost overlay (semi-transparent, scaled down, Coral dashed border).

---

### User Story 2 - Admin deletes an image from tour media (Priority: P2)

An admin hovers over an image card in the media grid and sees a quick-action overlay with a delete button. Clicking delete removes the image from the grid immediately (optimistic update) and dispatches a background deletion request. The remaining images renumber their display order to fill the gap.

**Why this priority**: Media cleanup is essential for maintaining a polished tour listing — admins need to remove unwanted or duplicate images.

**Independent Test**: Can be tested by hovering an image card, clicking the delete button, confirming the image disappears from the grid, and refreshing to verify permanent removal.

**Acceptance Scenarios**:

1. **Given** a tour media grid with multiple images, **When** the admin hovers over an image card, **Then** a quick-action overlay appears containing a delete button styled with red tokens.
2. **Given** an admin clicks the delete button on an image, **When** the action completes, **Then** the image is removed from the grid and remaining images renumber their display order.

---

### User Story 3 - Admin views images grouped by tour (Priority: P3)

An admin can navigate to a media organization view scoped to a specific tour, showing only that tour's uploaded images in order. The grid shows thumbnail previews with filenames, and the admin can see at a glance which images are assigned to each tour.

**Why this priority**: Tour-scoped filtering provides the necessary context for meaningful reordering — without it the admin cannot tell which tour's images they are organizing.

**Independent Test**: Can be tested by navigating to the media organizer for a tour with known images and confirming only that tour's images appear in the correct order.

**Acceptance Scenarios**:

1. **Given** a tour with 5 images assigned, **When** an admin opens the media organizer for that tour, **Then** only that tour's 5 images are displayed in a responsive grid ordered by displayOrder.
2. **Given** a tour has no images assigned, **When** an admin opens the media organizer for that tour, **Then** an empty state message is displayed with guidance to upload images.

---

### Edge Cases

- What happens when an image is dragged to the same position? No API call is made — the grid remains unchanged.
- What happens when the network fails during a reorder save? The optimistic UI update is preserved, and a subtle error toast appears with a retry option.
- What happens when an image is being deleted by multiple admins simultaneously? The first delete succeeds; the second receives a "not found" response which is handled gracefully (image already removed).
- What happens when the tour ID provided is invalid or does not exist? A clear error message is displayed.
- What happens when an image file is corrupt or missing from storage? The thumbnail shows a broken-image placeholder, but the record can still be deleted or reordered.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a responsive grid of images for a given tour, ordered by displayOrder ascending.
- **FR-002**: Grid MUST support HTML5 native drag-and-drop reordering without third-party animation libraries.
- **FR-003**: During a drag operation, the dragged card MUST display a ghost overlay (semi-transparent, slightly scaled down, Coral dashed border).
- **FR-004**: On drop, the grid MUST update instantly (optimistic update) showing the new order before the server confirms.
- **FR-005**: After drop, a background request MUST persist the new ordering to the server.
- **FR-006**: System MUST recalculate displayOrder values sequentially starting from 0 after each drop.
- **FR-007**: Each image card MUST show a quick-action overlay with a delete button on hover, styled with red accents.
- **FR-008**: Deleting an image MUST remove it from the grid immediately (optimistic) and persist the deletion + renumber remaining images in the background.
- **FR-009**: MediaAsset records MUST be stored in the existing PostgreSQL database via Prisma, alongside Tour and Booking models.
- **FR-010**: MediaAsset entries MUST reference images already uploaded via Feature 001 (Supabase Storage URL in filePath). No separate upload mechanism is needed.
- **FR-011**: The server reorder endpoint MUST update displayOrder for all modified records in an atomic transaction.
- **FR-012**: The server delete endpoint MUST remove the record and renumber remaining displayOrder values atomically.
- **FR-013**: The media organizer view MUST be scoped by tourId — only images for the specified tour are shown.

### Key Entities

- **MediaAsset**: A metadata record in PostgreSQL referencing a Supabase-stored image (from Feature 001), with tour association and display ordering. Contains id, filename, filePath (Supabase URL), tourId, displayOrder, mimeType.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dragging and dropping an image to a new position updates the grid in under 100ms (optimistic update).
- **SC-002**: The server persists the new ordering in under 1 second from drop.
- **SC-003**: The grid experiences zero cumulative layout shift during drag, drop, and delete operations.
- **SC-004**: Image cards maintain consistent aspect ratios across all viewport sizes.
- **SC-005**: Media grid loads all images for a tour in under 2 seconds.

## Assumptions

- Images are already uploaded via Feature 001's MediaUploader (or similar upload mechanism) before the organizer is used.
- The admin user is already authenticated via the existing admin auth system.
- A tour ID is always provided to scope the media view — there is no "all images" global view for v1.
- Display order is zero-indexed and sequential with no gaps.
- FilePath references the Supabase Storage URL generated by Feature 001's upload flow — all images are stored in the cloud, not locally.
- The number of images per tour is expected to be small (<50), so full-grid reorder payloads are acceptable.
- MediaAsset thumbnail URLs are derived from the stored Supabase URL (using image transformation parameters).
- MediaAsset is a new Prisma model in the existing PostgreSQL schema — a migration is required to create the table.
