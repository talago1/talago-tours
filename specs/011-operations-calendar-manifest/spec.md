# Feature Specification: Operations Calendar & Daily Tour Manifest

**Feature Branch**: `011-operations-calendar-manifest`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Interactive Operations Calendar & Daily Tour Manifest Engine for admin dispatch control center"

## User Scenarios & Testing

### User Story 1 - Operator views daily manifest grouped by tour type (Priority: P1)

An operations dispatch operator opens the control center and sees a calendar view. They select a date and the system displays all confirmed bookings for that day, grouped by tour type (e.g., Safari, Boat Trip, Spa). Each booking row shows passenger name, hotel, room number, pax count, payment status, booking channel, and check-in status.

**Why this priority**: The daily manifest is the core operational tool — without it dispatchers cannot organize tour logistics.

**Independent Test**: Can be tested by opening the operations panel, selecting a date with confirmed bookings, and verifying all bookings appear grouped by tour type with correct columns.

**Acceptance Scenarios**:

1. **Given** a date with 10+ confirmed bookings across 3 tour types, **When** the operator selects that date, **Then** bookings are grouped by tour type with subtotals per group.
2. **Given** a date with no bookings, **When** the operator selects that date, **Then** an empty state message is displayed.
3. **Given** the manifest is loaded, **When** the operator inspects a row, **Then** all required columns are present: passenger name, hotel, room number, pax count, payment status, channel, check-in status.

---

### User Story 2 - Operator filters and searches the manifest (Priority: P2)

An operator needs to quickly find a specific booking on a busy day. They type a passenger name or hotel name into a search field, and the manifest filters instantly in real-time. They can also toggle the manifest to show only specific tour types.

**Why this priority**: Real-time filtering saves operators significant time during peak checkout periods.

**Independent Test**: Can be tested by loading a manifest with 20+ bookings, typing part of a passenger name, and confirming only matching rows remain visible.

**Acceptance Scenarios**:

1. **Given** a manifest with 20+ bookings from different hotels, **When** the operator types a hotel name, **Then** only bookings from that hotel remain visible.
2. **Given** a manifest with multiple tour types, **When** the operator selects a single tour type filter, **Then** only bookings for that tour type are shown.

---

### User Story 3 - Operator uses calendar to navigate between dates (Priority: P3)

An operator uses an interactive calendar strip to quickly jump between dates. Days with active departures show a visual badge. The operator can switch between weekly and monthly calendar layouts.

**Why this priority**: The calendar view gives operators situational awareness of upcoming departure volumes.

**Independent Test**: Can be tested by opening the calendar, viewing a month layout with badge indicators on departure days, clicking a date, and seeing the manifest load for that date.

**Acceptance Scenarios**:

1. **Given** the calendar is in monthly view, **When** it renders, **Then** days with confirmed bookings display an alert badge indicator.
2. **Given** the calendar is visible, **When** the operator switches from monthly to weekly view, **Then** the layout updates without a page reload.
3. **Given** the operator clicks a date in the calendar, **When** the click completes, **Then** the manifest loads for that date and the calendar highlights the selected day.

---

### Edge Cases

- What happens when a tour has bookings with mixed payment statuses (some PAID, some PENDING)? Each row displays its own status independently.
- What happens when the departure date is in the past? The manifest still loads and displays past data — no write operations are affected.
- What happens when the API returns an error? A user-friendly error message replaces the manifest content with a retry button.
- What happens when a booking has no room number assigned? The column displays "—" (dash) instead of an empty field.
- What happens when there are 200+ bookings for a single day? The manifest loads all rows with client-side search for instant filtering.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a responsive calendar showing the current month/week with date selection.
- **FR-002**: Days with confirmed bookings MUST display a visual badge indicator using Coral accent styling.
- **FR-003**: Operators MUST be able to switch between weekly and monthly calendar views.
- **FR-004**: Clicking a date in the calendar MUST load that date's manifest of confirmed bookings.
- **FR-005**: The manifest MUST group bookings by tour type with per-group passenger subtotals.
- **FR-006**: Each manifest row MUST display: passenger name, hotel name, room number, total pax count, payment status, booking channel, and check-in QR status.
- **FR-007**: The manifest MUST be sorted by pickup zone order or pickup time to optimize guide logistics.
- **FR-008**: Operators MUST be able to search/filter the manifest by passenger name in real-time.
- **FR-009**: Operators MUST be able to search/filter the manifest by hotel name in real-time.
- **FR-010**: Operators MUST be able to filter the manifest to show only a specific tour type.
- **FR-011**: The system MUST display skeleton loading placeholders during data fetch.
- **FR-012**: The manifest list MUST be printable from the browser without layout issues.

### Key Entities

- **Manifest**: A daily snapshot of all confirmed bookings for a specific departure date, grouped by tour type. Contains per-booking rows with passenger details, hotel, pax count, payment status, channel, and check-in status.
- **Operations Calendar**: An interactive date picker showing weekly/monthly views with departure-day indicators. Tied to the manifest — clicking a date shows that day's manifest.
- **Booking** (existing entity): Extended with optional `roomNumber` field for manifest display. Existing channel enum (VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE) used for channel column.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Manifest loads and renders for a date with 200 bookings in under 3 seconds.
- **SC-002**: Client-side search filters results in under 200ms per keystroke.
- **SC-003**: Calendar navigation between dates completes in under 500ms.
- **SC-004**: Printed manifest fits within standard A4 page width without column truncation.
- **SC-005**: Zero cumulative layout shift during loading, filtering, and calendar switching.

## Assumptions

- Room number is an optional field added to the Booking model — admins can fill it via manifest or create booking flow. Empty room numbers display as "—".
- Pickup time sorting is based on zone-level configuration (each zone has a default pickup window).
- The manifest only includes bookings with CONFIRMED or COMPLETED status — PENDING and CANCELLED bookings are excluded.
- Payment status refers to the existing `paymentStatus` field on Booking (null, PROCESSING, PAID, FAILED).
- Check-in status refers to the existing `isCheckedIn` field on Booking.
- The operator is already authenticated via the existing admin auth system.
- The feature targets desktop/laptop browsers in the operations center — mobile responsiveness is not required for v1.
