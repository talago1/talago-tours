# Feature Specification: Viator-Style Public Tour Catalog, Interactive Search & Filtering Engine

**Feature Branch**: `015-featurename-public-tour`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Viator-Style Public Tour Catalog with interactive search grid, card grid layout, client-side filtering, and public search API"

## User Scenarios & Testing

### User Story 1 - Visitor browses the tour catalog (Priority: P1)

A potential customer visits the tours page on the public website. They see a modern, responsive grid of tour cards displaying a destination badge, title, rating stars, live price, and a Coral call-to-action button. Each card has a consistent 4:3 aspect ratio image. The layout adapts from 1 column on mobile to 4 columns on large screens. The visitor can scroll through available tours and click a card to view details.

**Why this priority**: The catalog is the primary entry point for all tour discovery — without it, visitors cannot see what tours are available, making every other feature inaccessible.

**Independent Test**: Can be tested by visiting the tours page, confirming the grid renders with tour cards showing destination badges, images, titles, ratings, prices, and CTA buttons, and verifying the layout is responsive across screen sizes.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to the tours page, **When** the page loads, **Then** a grid of active tour cards is displayed with destination badge, image, title, rating stars, and price.
2. **Given** the page is viewed on a mobile device, **When** rendered, **Then** tours appear in a single-column layout.
3. **Given** the page is viewed on a large desktop screen, **When** rendered, **Then** tours appear in a four-column grid.
4. **Given** there are no active tours, **When** the page loads, **Then** a clear "No tours available" message is displayed.

---

### User Story 2 - Visitor searches and filters tours (Priority: P2)

A visitor uses the sticky search bar at the top of the catalog to narrow down tours. They can select a destination from a dropdown, choose a tour category (e.g., Safari, Boat Trip), set a price range using a slider, and type keywords to search titles and descriptions. As they adjust filters, results update instantly without a page reload. The visitor can also use the filter sidebar to toggle category checkboxes and see the count of matching results update in real-time.

**Why this priority**: Search and filtering is what converts browsing into bookings — visitors need to quickly find tours matching their preferences.

**Independent Test**: Can be tested by selecting a destination filter, setting a price range, typing a keyword, and confirming the grid updates to show only matching tours within 100ms of the last input.

**Acceptance Scenarios**:

1. **Given** the catalog is loaded, **When** the visitor types in the search field, **Then** the grid updates to show only tours whose title or description matches the input after a short debounce delay.
2. **Given** the catalog is loaded, **When** the visitor selects a destination from the dropdown, **Then** only tours in that destination are shown.
3. **Given** the catalog is loaded, **When** the visitor adjusts the price range slider, **Then** only tours within the selected price range are shown.
4. **Given** the catalog is loaded, **When** the visitor toggles a category checkbox, **Then** only tours of that category type are shown.
5. **Given** no tours match the active filters, **When** the grid updates, **Then** a "No tours match your search criteria" message is displayed with suggestions.

---

### Edge Cases

- What happens when the visitor searches for text that matches no tours? The grid shows a "No tours match" message with a suggestion to broaden filters.
- What happens when the visitor clears all filters? The grid returns to showing all active tours.
- What happens when the API is slow or fails? The grid shows a loading skeleton state on initial load, and an error message with retry on failure. Filters continue to work client-side on the last successfully fetched data.
- What happens when a tour has no images? The card displays a default tour placeholder image.
- What happens when images fail to load? The card displays the fallback placeholder image without breaking the grid layout (fixed aspect ratio).
- What happens when too many filters are applied (price + destination + category + keyword)? All filters combine with AND logic — only tours matching ALL criteria are shown.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a responsive grid of active tour cards with destination badge, image, title, rating, and price.
- **FR-002**: System MUST render tour cards with a consistent 4:3 image aspect ratio and zero layout shift.
- **FR-003**: System MUST include a sticky search bar with destination dropdown, tour category selector, and keyword search input.
- **FR-004**: System MUST provide a filter sidebar with price range slider and category checkboxes.
- **FR-005**: Search and filter changes MUST update the visible tour results instantly (within 100ms of user input).
- **FR-006**: Keyword search MUST debounce input (minimum 300ms) before filtering to avoid performance issues.
- **FR-007**: All filters (destination, category, price range, keyword) MUST combine with AND logic — only tours matching all criteria are shown.
- **FR-008**: System MUST provide a public API endpoint returning filtered tour data without authentication.
- **FR-009**: The public API MUST accept query parameters for destination slug, tour category, min/max price, and keyword search.
- **FR-010**: The public API MUST return only active tours with selected columns (id, title, slug, thumbnail, destination name, duration, price, rating).
- **FR-011: Tours with no rating MUST default to 0 stars (unrated).

### Key Entities

- **Tour (extended for catalog)**: The existing Tour entity gains category type, price, duration, rating, and thumbnail fields to support the public catalog display and filtering.
- **Destination (Feature 014)**: Provides destination name, slug, and image for the card badge and dropdown filter.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The tour catalog page loads the initial grid of tours in under 2 seconds on a standard broadband connection.
- **SC-002**: Filtering results updates the visible grid in under 100ms after the last user input.
- **SC-003**: Price range slider and category checkboxes respond within 50ms of user interaction.
- **SC-004**: The tour card grid displays 50+ tours without performance degradation or layout shift.
- **SC-005**: The catalog layout renders correctly on mobile (320px), tablet (768px), and desktop (1920px) widths with no horizontal overflow.
- **SC-006**: The public API responds to search queries in under 500ms under normal load.

## Assumptions

- Tour category types are predefined and managed via database enum or application-level constants — examples based on Red Sea tourism: SNORKELING, DIVING, BOAT_TRIP, SAFARI, DESERT, CITY, ADVENTURE.
- Tour ratings are set by administrators on the Tour entity (range 0–5, default 0) — no public review system is part of this feature.
- Tour pricing uses a `basePrice` in the Tour model representing the standard adult price. Dynamic pricing per Feature 003 is separate.
- The date picker placeholder in the search bar is a UI element only — date-based filtering is not implemented in this version.
- The destination dropdown relies on the Destination model and API from Feature 014 being implemented.
- The public API is rate-limited at the application level to prevent abuse (no authentication required, but abuse protection assumed).
- Tour images are managed via the existing media upload pipeline — the Tour model gains a `thumbnailUrl` for the catalog card image.
- The sticky search bar becomes fixed below the site header on scroll but does not overlap with the header.
