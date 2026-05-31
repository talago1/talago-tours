# Feature Specification: Dynamic Multi-Destination Architecture Upgrade

**Feature Branch**: `014-featurename-destination-architecture`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Dynamic Multi-Destination Architecture Upgrade — Destination CRUD grid, Destination model with tour relation, client-side slug normalization, admin API, and downstream analytics/manifest filtering by destination"

## User Scenarios & Testing

### User Story 1 - Admin manages tour destinations (Priority: P1)

An operations or marketing manager opens the destination management panel in the admin dashboard. They see a grid of existing destination cards (Hurghada, Sharm El-Sheikh, Dahab, Marsa Alam). They can add a new destination by entering the city name and uploading a location thumbnail image. The system automatically generates a URL-safe slug from the city name. They can also edit the name or thumbnail of an existing destination, or delete a destination that has no tours assigned to it.

**Why this priority**: Destination data is foundational — all tours must be assigned to a destination before the Tour Builder can use the dynamic selector. Without this story, no other part of the feature can function.

**Independent Test**: Can be tested by opening the destination panel, adding a new city (e.g., "Marsa Alam"), confirming the card appears in the alphabetical grid, clicking edit to change the name, and verifying the slug updates accordingly.

**Acceptance Scenarios**:

1. **Given** the destination manager is open, **When** the admin enters a city name and uploads a thumbnail image, **Then** a new destination card appears in the grid with the auto-generated slug.
2. **Given** a destination exists in the grid, **When** the admin clicks edit and changes the name, **Then** the card updates with the new name and slug.
3. **Given** a destination with no tours assigned, **When** the admin clicks delete, **Then** the destination is removed from the grid.
4. **Given** a destination with tours assigned, **When** the admin attempts to delete, **Then** the system blocks deletion and shows an explanatory message.

---

### User Story 2 - Tour builder uses dynamic destination selector (Priority: P2)

A product manager creating or editing a tour in the Admin Tour Builder Form sees a polished searchable dropdown labelled "Destination". As they type, matching destinations appear in real-time. They select one from the list, and the selection is saved as part of the tour. Previously selected destinations are pre-populated when editing an existing tour.

**Why this priority**: This replaces the current static/hardcoded city field in the Tour Builder, enabling multi-destination operations and downstream filtering.

**Independent Test**: Can be tested by opening the Tour Builder, typing a partial city name in the destination dropdown, selecting a match, saving the tour, and reopening to confirm the destination is pre-populated.

**Acceptance Scenarios**:

1. **Given** the Tour Builder form is open, **When** the admin types in the destination field, **Then** a filtered dropdown appears with matching destinations from the database.
2. **Given** multiple destinations exist, **When** the admin types a partial match (e.g., "mar"), **Then** only destinations containing "mar" appear (e.g., "Marsa Alam").
3. **Given** a tour is being edited, **When** the form loads, **Then** the previously assigned destination is selected and visible in the dropdown.

---

### User Story 3 - Analytics and daily manifest filter by destination (Priority: P3)

A manager viewing the analytics dashboard (Feature 009) or the daily operations manifest (Feature 011) can optionally filter by a specific destination. For example, selecting "Hurghada" in the analytics dashboard shows revenue and margin data only for tours departing from Hurghada. The same filter applies to the daily manifest to show only tours assigned to a selected city.

**Why this priority**: Closing the loop by enabling destination-level operational and financial analysis — this completes the multi-destination architecture.

**Independent Test**: Can be tested by opening the analytics dashboard with no destination filter (shows all data), then applying a filter for "Hurghada" and confirming only Hurghada-related data appears.

**Acceptance Scenarios**:

1. **Given** the analytics dashboard is open, **When** the admin selects a destination filter, **Then** gross revenue, net margin, and passenger count update to reflect only that destination's tours.
2. **Given** the daily manifest is open, **When** the admin selects a destination filter, **Then** only tours assigned to that destination appear on the manifest.
3. **Given** no destination filter is selected, **When** analytics or manifest loads, **Then** all tours across all destinations are shown (backward-compatible default).

---

### Edge Cases

- What happens when a destination name contains special characters (e.g., "Sharm El-Sheikh")? The slug generator must produce a clean URL-safe string ("sharm-el-sheikh") by lowercasing, trimming whitespace, replacing spaces with hyphens, and stripping non-alphanumeric characters.
- What happens when a duplicate slug is generated (same city name added twice)? The API must reject the second entry with a "slug already exists" error.
- What happens when the admin uploads a very large thumbnail image? The existing media upload pipeline imposes client-side WebP compression at 0.80 quality and 1920px max width — consistent with Feature 001/010.
- What happens when a destination has no image? The destination card displays a placeholder/default thumbnail.
- What happens when the destination dropdown has no results for a search query? The dropdown shows a "No destinations found" message.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow admins to view all destinations in an alphabetical grid with name, thumbnail, slug, and tour count.
- **FR-002**: System MUST allow admins to add a new destination with a city name and optional thumbnail image, auto-generating a URL-safe slug.
- **FR-003**: System MUST allow admins to edit an existing destination's name and thumbnail image, auto-updating the slug on name change.
- **FR-004**: System MUST allow admins to delete a destination only if it has no tours assigned to it (restricted delete).
- **FR-005**: System MUST provide a searchable dropdown selector for destinations in the Tour Builder form, filtering results as the user types.
- **FR-006**: System MUST pre-populate the destination selector when editing an existing tour.
- **FR-007**: System MUST require a destination for every tour (destinationId is mandatory on the Tour entity).
- **FR-008**: System MUST support an optional `destinationId` query parameter on the analytics summary endpoint to filter results by destination.
- **FR-009**: System MUST support an optional `destinationId` query parameter on the daily manifest endpoint to filter tours by destination.
- **FR-010**: System MUST reject duplicate destination slugs with a clear error message.
- **FR-011**: System MUST display a thumbnail placeholder when no image is provided for a destination.

### Key Entities

- **Destination**: A city or location where a tour operates (e.g., Hurghada, Sharm El-Sheikh). Contains name, auto-generated slug, optional thumbnail image URL, and a one-to-many relationship to Tours.
- **Tour (extended)**: The existing Tour entity gains a mandatory destinationId field linking it to a Destination. This enables per-destination filtering in analytics and manifests.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An admin can add a new destination and see it in the grid within 2 seconds of saving.
- **SC-002**: The destination dropdown in the Tour Builder filters results in under 200ms per keystroke.
- **SC-003**: Applying a destination filter in analytics or manifest updates the displayed data in under 2 seconds.
- **SC-004**: Deleting a destination with no tours completes in under 1 second.
- **SC-005**: The destination grid displays 50+ destinations without performance degradation or layout shift.

## Assumptions

- Admins are already authenticated via the existing admin auth system — no new authentication logic required.
- Image uploads use the existing media upload pipeline (client-side WebP compression, signed Supabase URLs) established in Feature 001/010.
- The existing analytics summary endpoint (Feature 009) and daily manifest endpoint (Feature 011) exist and will be extended with an optional destinationId query parameter — no new endpoints required for filtering.
- Thumbnail images are single images per destination (not a gallery).
- Destination management is admin-only — there is no public-facing destination CRUD.
- Deleting a destination does not cascade-delete its tours — the onDelete: Restrict constraint prevents deletion when tours exist.
