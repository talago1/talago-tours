# Feature Specification: Dynamic Milestone Timeline Itinerary Builder & Display

**Feature Branch**: `004-itinerary-timeline`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Dynamic Milestone Timeline Itinerary Builder & Display — admin milestone editing workspace and frontend chronological tour timeline viewer with multi-language milestone titles."

## Clarifications

### Session 2026-05-30

- Q: Should the itinerary support multiple days (day-grouped milestones) or is every tour assumed to be single-day? → A: Single-day only — milestones are a flat chronological list, no day grouping or day selector.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Itinerary Milestones (Priority: P1)

As an admin, I want to add, reorder, and remove itinerary milestones so that the tour's daily schedule is accurately represented for customers.

**Why this priority**: The itinerary is a core tour detail that customers review before booking. Without milestones, the tour page lacks essential schedule information.

**Independent Test**: Can be fully tested by adding 3 milestones with different time tags and icon selections, reordering them via move buttons, and removing one milestone — confirming the remaining milestones display in the correct order.

**Acceptance Scenarios**:

1. **Given** I am on the itinerary builder, **When** I click "Add New Milestone", **Then** a new milestone row appears with time input, localized title (linked to the active language tab), and an icon selector.
2. **Given** I have multiple milestone rows, **When** I click the move up or move down button on a milestone, **Then** it changes position with the adjacent milestone and the new order is reflected in real time.
3. **Given** I have a milestone row, **When** I click its delete button, **Then** the milestone is removed and the remaining milestones close the gap.

---

### User Story 2 - View Tour Itinerary Timeline (Priority: P1)

As a customer browsing a tour page, I want to see a chronological timeline of milestones so that I understand the tour schedule at a glance.

**Why this priority**: The timeline is the primary way customers consume itinerary information. Without it, the tour page lacks visual schedule clarity.

**Independent Test**: Can be fully tested by viewing a tour page that has 3 configured milestones and confirming they appear in order as a vertical timeline with icons, time tags, and titles.

**Acceptance Scenarios**:

1. **Given** a tour has 3 milestones configured, **When** I view the tour page, **Then** all 3 milestones are displayed in chronological order as a vertical timeline.
2. **Given** I view a milestone node, **When** the timeline renders, **Then** each node has an icon badge, time tag, and title visible.
3. **Given** I hover over a milestone card, **When** the cursor is over it, **Then** the card subtly scales up without altering the surrounding layout or causing any content to shift.

---

### User Story 3 - Enter Multi-Language Milestone Titles (Priority: P2)

As an admin, I want to provide milestone titles in all 6 supported languages so that customers see the itinerary in their preferred language.

**Why this priority**: Multi-language titles extend the platform's reach across all 6 launch markets. Without it, the itinerary is only visible in English.

**Independent Test**: Can be fully tested by switching the admin language tab to German, entering a German milestone title, switching to French and entering a French title, then switching back to German and confirming both titles are preserved independently.

**Acceptance Scenarios**:

1. **Given** the admin language tab is set to German, **When** I enter a milestone title in German, **Then** the title is stored under the German language key only.
2. **Given** I have entered titles in multiple languages, **When** I switch between language tabs, **Then** each language shows only its own titles and no data is lost or overwritten.
3. **Given** a tour page is viewed in a specific language, **When** the timeline renders, **Then** milestone titles display in that language (falling back to English if no translation exists).

---

### User Story 4 - Save Itinerary with Tour (Priority: P2)

As an admin, I want the itinerary milestones to be saved as part of the tour so that the timeline persists and displays to customers.

**Why this priority**: Unsaved milestones have no effect. This story completes the workflow from builder to live display.

**Independent Test**: Can be fully tested by adding 2 milestones, saving the tour, then reloading the tour page and confirming both milestones appear in the timeline with correct order, icons, time tags, and titles.

**Acceptance Scenarios**:

1. **Given** I have configured milestones, **When** I save the tour, **Then** the milestone data is persisted and associated with the tour.
2. **Given** a saved tour has milestones, **When** the tour page loads, **Then** the milestones are retrieved and rendered in the timeline.
3. **Given** I attempt to save with a milestone that has no time tag or no English title, **Then** a validation error appears indicating the missing required fields.

---

### Edge Cases

- What happens when a tour has no itinerary milestones? The timeline section is hidden or shows a simple "No itinerary details available" message.
- What happens when the admin adds a milestone but leaves the time tag empty? A validation error indicates the time tag is required before saving.
- What happens when the admin enters an unusually long title text? The milestone row allows scrolling or wraps text without breaking the layout.
- What happens when all milestones are deleted in the builder? The empty state returns with only the "Add New Milestone" button visible.
- What happens when the admin tries to reorder a single milestone? Move up/down buttons are disabled when the milestone is at the boundary or only one milestone exists.
- What happens when the API returns an error during save? A user-friendly error is displayed and the save button re-enables.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Administrators MUST be able to add new itinerary milestones via a dedicated button.
- **FR-002**: Each milestone MUST contain a time tag input (free text), a localized title input (linked to the active language tab), and an icon selector.
- **FR-003**: The icon selector MUST offer at least the following choices: boat, safari, swim, food, hotel, and generic.
- **FR-004**: Administrators MUST be able to reorder milestones up and down within the list.
- **FR-005**: Administrators MUST be able to delete individual milestone rows.
- **FR-006**: The milestone title input MUST be connected to the active admin language tab — switching tabs changes the language being edited without resetting other languages' data.
- **FR-007**: All 6 languages (EN, DE, RU, FR, IT, TR) MUST be supported for milestone titles.
- **FR-008**: Customers viewing a tour page MUST see a chronological vertical timeline of milestones.
- **FR-009**: Each timeline node MUST display an icon badge, a time tag, and a title.
- **FR-010**: Hovering over a timeline card MUST produce a subtle visual response without causing layout shifts.
- **FR-011**: The timeline MUST display titles in the viewer's selected language, falling back to English if no translation exists for that language.
- **FR-012**: Milestones MUST be saved as part of the tour data — no separate save operation for the itinerary alone.
- **FR-013**: Validation MUST require each milestone to have a non-empty time tag and a non-empty English title before the tour can be saved.
- **FR-014**: The save button MUST disable immediately upon click and show a loading state.
- **FR-015**: On save failure, the administrator MUST see a user-friendly error message and the save button MUST re-enable.

### Key Entities

- **Itinerary Milestone**: A single scheduled event or activity within a tour day/time. Contains a time tag, icon token, and localized titles across all 6 languages. Milestones are ordered by their position in the itinerary array.
- **Itinerary**: The complete ordered collection of milestones for a single-day tour. Stored as structured data associated with the tour record. All milestones are rendered as a flat chronological list.
- **Icon Token**: A predefined visual symbol representing an activity type (boat, safari, swim, food, hotel, generic). Each milestone selects one token which determines the icon displayed on both the admin builder and the public timeline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can build a 5-milestone itinerary with time tags, icons, and English titles in under 2 minutes.
- **SC-002**: Adding a new milestone row appears within 100ms of clicking the button.
- **SC-003**: Reordering milestones reflects the new order instantly with no page reload or visible delay.
- **SC-004**: Switching admin language tabs shows the correct language's titles for all milestones without any data loss — verified by switching through all 6 tabs.
- **SC-005**: The public timeline renders all milestones with zero Cumulative Layout Shift (CLS) on page load.
- **SC-006**: Customers see the timeline in their selected language; untranslated titles gracefully fall back to English.
- **SC-007**: Zero duplicate save requests — verified by rapid-click testing on the save button.

## Assumptions

- The itinerary builder integrates with the existing language tab system (from the Tour Builder feature) for multi-language title editing.
- The itinerary data is embedded within the tour record as part of the tour create/update operation — no standalone itinerary save endpoint.
- The admin user is already authenticated via the existing authentication system.
- All milestone titles are plain text — no rich text or markdown formatting is supported.
- The itinerary is single-day only — all milestones belong to one chronological timeline. Multi-day itineraries are out of scope for this version.
- The frontend timeline targets desktop browsers with a minimum width of 1024px.
- Icon SVGs for the predefined tokens (boat, safari, swim, food, hotel, generic) are provided as inline SVGs within the component files.
