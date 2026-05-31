# Feature Specification: Media & Storage Engine

**Feature Branch**: `001-media-storage-engine`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Advanced Media & Storage Engine for TALAGO — Admin drag-and-drop image uploader with asymmetric preview grid, client-side image compression, and secure direct-to-storage upload flow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Preview Tour Images (Priority: P1)

As an admin, I want to drag and drop multiple images onto an uploader and see instant previews so I can visually confirm my selection before saving.

**Why this priority**: Image selection is the foundation of all media management — without this, no other media workflow is possible.

**Independent Test**: Can be fully tested by dragging 5 images onto the uploader and verifying each appears as a preview thumbnail immediately, without any upload delay blocking the UI.

**Acceptance Scenarios**:

1. **Given** I am on the tour creation page, **When** I drag 5 image files from my file explorer onto the upload zone, **Then** all 5 images appear as visual previews arranged in an asymmetric grid layout (one large card and four smaller cards).
2. **Given** I have preview images displayed, **When** I continue editing other tour fields, **Then** all interactions remain responsive with no UI freezes during background processing.
3. **Given** I click the upload zone instead of dragging, **When** the file picker opens, **Then** I can select multiple image files and they appear as previews just like the drag flow.

---

### User Story 2 - Designate Primary Cover Image (Priority: P2)

As an admin, I want to mark one image as the main cover so it appears as the hero visual on the tour listing page.

**Why this priority**: Cover images drive click-through rates on tour listings and are essential for SEO. Without cover designation, the first uploaded image is used by default.

**Independent Test**: Can be fully tested by uploading 3 images, clicking the star icon on image 3, and verifying it moves to the first position with a "Main Cover" badge.

**Acceptance Scenarios**:

1. **Given** I have uploaded multiple images, **When** I click the star icon on any non-cover image, **Then** that image moves to the first position in the grid and receives a "Main Cover" badge.
2. **Given** a cover image is already designated, **When** I click the star icon on a different image, **Then** the cover badge transfers to the newly selected image.
3. **Given** I have a set of images, **When** I save the tour, **Then** the first image in the stored array is always the designated cover.

---

### User Story 3 - Remove Unwanted Images (Priority: P2)

As an admin, I want to remove images from the collection so that only relevant media is saved with the tour.

**Why this priority**: Mistaken uploads and outdated images must be removable before saving to avoid incorrect media appearing on live listings.

**Independent Test**: Can be fully tested by uploading 3 images, clicking the trash icon on the middle image, and verifying only 2 images remain.

**Acceptance Scenarios**:

1. **Given** I have uploaded images displayed in the grid, **When** I hover over any image and click the trash icon, **Then** the image is removed from the preview grid and excluded from the final save payload.
2. **Given** I remove the designated cover image, **When** the removal completes, **Then** the next image in the array automatically becomes the cover.

---

### User Story 4 - Automatic Image Compression on Upload (Priority: P2)

As an admin, I want large images to be automatically compressed so the tour page loads quickly for customers without me needing to manually resize photos.

**Why this priority**: Page load speed is critical for SEO and user experience. Manually compressing images before upload creates friction and is often skipped.

**Independent Test**: Can be fully tested by uploading a 10MB high-resolution photo and verifying the stored file is under 500KB while maintaining acceptable visual quality.

**Acceptance Scenarios**:

1. **Given** I upload a 4000x3000 pixel image (12MB), **When** the compression completes, **Then** the stored image does not exceed 1920px in width.
2. **Given** I upload any image, **When** processing is complete, **Then** the stored version uses a modern compressed format suitable for web delivery.
3. **Given** I upload a raw camera photo, **When** compression finishes, **Then** the visual quality remains acceptable for showcasing Red Sea scenery (rich colors, minimal artifacts).

---

### User Story 5 - Monitor Upload Progress for Each Image (Priority: P3)

As an admin, I want to see individual upload progress for each image so I know when the collection is fully ready to save.

**Why this priority**: Without progress feedback, admins may navigate away prematurely or submit the form before uploads complete, causing data loss.

**Independent Test**: Can be fully tested by uploading large image files and verifying each thumbnail card displays a live progress indicator that reaches 100%.

**Acceptance Scenarios**:

1. **Given** I upload multiple large images, **When** they are being processed and uploaded, **Then** each image card shows a distinct progress indicator with a percentage value.
2. **Given** an image upload fails, **When** the error occurs, **Then** the failed image card disappears from the grid and no partial or corrupted file is saved.

---

### Edge Cases

- What happens when a user uploads a non-image file (e.g., PDF, text file)? Non-image files are silently filtered out.
- What happens when a user uploads more than the maximum allowed files? Only the first N files are accepted; excess files are ignored.
- What happens during a network failure mid-upload? The failed upload asset is removed from the collection; successfully uploaded images are preserved.
- What happens when a user closes the browser tab during upload? In-progress uploads are aborted; only previously completed uploads are persisted.
- What happens with extremely large files (50MB+)? The client-side compression reduces them to standard web dimensions before upload.
- What happens when a user drags files over the upload zone but drops them outside? The drag-over visual feedback resets to normal with no action taken.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Administrators MUST be able to upload images via drag-and-drop or file browser selection.
- **FR-002**: The system MUST accept multiple image files in a single upload action.
- **FR-003**: Non-image files MUST be silently filtered out with no error shown.
- **FR-004**: Each uploaded image MUST display an instant visual preview before any upload or processing begins.
- **FR-005**: Images MUST be automatically compressed and converted to a web-optimized format before network transmission.
- **FR-006**: Compressed images MUST NOT exceed 1920px in width.
- **FR-007**: Each image card MUST display a live progress indicator during upload.
- **FR-008**: Administrators MUST be able to designate any single image as the primary cover.
- **FR-009**: The primary cover image MUST always occupy the first position in the image array.
- **FR-010**: A visual "Main Cover" badge MUST appear on the designated cover image.
- **FR-011**: Administrators MUST be able to remove any image from the collection before saving.
- **FR-012**: When the cover image is removed, the next image MUST automatically become the cover.
- **FR-013**: All image compression MUST complete on the administrator's device before any data is transmitted over the network.
- **FR-014**: Each image upload MUST use a secure, time-limited authorization token that expires after a short duration.
- **FR-015**: The final collection of image URLs MUST be stored as an ordered array where index 0 is always the cover image.

### Key Entities

- **Tour**: The primary entity that owns a collection of images. Each tour holds an ordered array of image URLs.
- **Image Asset**: Represents a single uploaded photo with a unique identifier, its public URL, and its upload status. The first asset in the array functions as the primary cover.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Images appear as visual previews within 2 seconds of being dropped or selected.
- **SC-002**: Uploaded images are stored at or below their original file size after compression (measured as file size reduction percentage).
- **SC-003**: Administrators can complete a full image set upload (5 images, 5MB each) and save the tour in under 30 seconds on a standard broadband connection.
- **SC-004**: The cover image designation toggle responds within 200ms of clicking the star icon.
- **SC-005**: The system does not keep any intermediate or temporary copies of uploaded images once the upload is complete.
- **SC-006**: Administrators can successfully upload and remove images without any page reload.

## Assumptions

- Administrators have stable internet connectivity during uploads.
- The existing tour creation/edit form already has all other fields implemented; this feature adds only the media upload component.
- Administrators use modern browsers (Chrome, Firefox, Safari, Edge) that support client-side image processing capabilities.
- Image compression quality is tuned for tourism photography (vibrant colors, high detail) and does not require per-image quality adjustment.
- The storage backend supports time-limited signed URLs for secure uploads.
- The maximum practical number of images per tour is 20.
- The authentication and authorization system is already in place and integrated with the admin interface.
- No mobile app or tablet-optimized upload flow is required — this is a desktop admin panel feature.
