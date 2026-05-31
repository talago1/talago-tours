# Feature Specification: Booking Queue & WhatsApp Automation

**Feature Branch**: `006-booking-queue-whatsapp`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Operational Booking Queue & WhatsApp Automation Payload..."

## Clarifications

### Session 2026-05-30

- Q: WhatsApp message template and localization → A: Full 6-language localization (EN, DE, RU, FR, IT, TR) with separate translation strings per language
- Q: Allowed status lifecycle transitions → A: Linear forward progression (PENDING → CONFIRMED → COMPLETED); CANCELLED allowed from PENDING or CONFIRMED; no backward transitions (CANCELLED → CONFIRMED, COMPLETED → CONFIRMED, etc.)
- Q: Booking reference format → A: Date-based format `TLG-{YYYYMMDD}-{XXXX}` with a 4-digit daily counter. Example: `TLG-20260530-0001`. Generated server-side on booking creation.
- Q: Expected booking volume → A: Small volume (fewer than 100 active bookings at any time). Pagination not required for v1.
- Q: Loading state on page load → A: Skeleton rows matching the table/card layout dimensions (muted gray placeholder bars)
- Q: WhatsApp not available on admin's device → A: Silent fail — `wa.me` URL handles the fallback natively by showing the WhatsApp web page with a download prompt

## User Scenarios & Testing

### User Story 1 - View and Manage Booking Queue (Priority: P1)

An admin opens the booking queue and sees all bookings in a responsive view — clean spreadsheet on desktop, action cards on mobile. Each booking shows reference, customer name, date, guests, price, hotel, status, and a WhatsApp button.

**Why this priority**: The queue is the primary operational dashboard — without it, admins cannot see or manage bookings.

**Independent Test**: Can be fully tested by loading the booking queue page and confirming all bookings display with correct fields, status badges, and WhatsApp buttons per row.

**Acceptance Scenarios**:

1. **Given** the admin opens the booking queue, **When** the page loads, **Then** all bookings are displayed with columns: booking reference, customer name, tour, travel date, guests, total price, hotel, status, and actions.
2. **Given** the admin views the queue on a desktop browser (≥1024px), **When** the page renders, **Then** bookings appear in a horizontal multi-column table layout.
3. **Given** the admin views the queue on a mobile browser (<1024px), **When** the page renders, **Then** each booking appears as an independent action card with all fields stacked vertically.
4. **Given** the queue displays bookings, **When** each booking row/card renders, **Then** its status is shown as a color-coded badge matching the status type.

---

### User Story 2 - Update Booking Status (Priority: P1)

An admin changes a booking's status (e.g., from PENDING to CONFIRMED) using a dropdown in the queue. The status updates instantly on screen and persists to the database.

**Why this priority**: Status management is the core operational workflow — admins need to track booking progress through its lifecycle.

**Independent Test**: Can be fully tested by changing a PENDING booking's status to CONFIRMED via the dropdown, then refreshing the page and confirming the change persisted.

**Acceptance Scenarios**:

1. **Given** a booking is displayed in the queue, **When** the admin selects a new status from the dropdown, **Then** the badge updates immediately to reflect the new status without waiting for server confirmation.
2. **Given** the admin changes a status, **When** the page is refreshed, **Then** the new status is still displayed (persisted correctly).
3. **Given** the status update fails due to a network error, **When** the admin changes it, **Then** the badge reverts to the original status and an error message appears.

---

### User Story 2 - Send WhatsApp Message to Customer (Priority: P2)

An admin clicks the WhatsApp button on a booking row and a pre-formatted message opens in WhatsApp Web or the WhatsApp desktop app, addressed to the customer with booking details.

**Why this priority**: WhatsApp is the primary customer communication channel for TALAGO. Quick-access deep links save admin time and reduce errors.

**Independent Test**: Can be fully tested by clicking any booking's WhatsApp button and confirming a WhatsApp chat window opens with the customer's number and a pre-filled booking confirmation message.

**Acceptance Scenarios**:

1. **Given** a booking is displayed in the queue, **When** the admin clicks the WhatsApp button, **Then** a new browser tab or WhatsApp window opens with a deep link to chat with the customer's phone number.
2. **Given** the WhatsApp button is clicked, **When** the deep link opens, **Then** the message is pre-populated with the tour name, booking reference, travel date, pickup time, and a welcome greeting.
3. **Given** the customer has a preferred language, **When** the WhatsApp message is composed, **Then** the message text is in that language (falling back to English if no translation available).

---

### Edge Cases

- What happens when the booking queue has no bookings? Show an empty state: "No bookings yet" with illustration.
- What happens while the queue is loading? Show skeleton bars matching the table/card dimensions.
- What happens when a booking's phone number is invalid or missing? The WhatsApp button is disabled or hidden for that row with a tooltip explaining why.
- What happens when the status dropdown fails to save? The UI reverts to the previous status and shows an error toast.
- What happens when two admins modify the same booking's status simultaneously? The last save wins (no conflict resolution for v1).
- What happens when there are hundreds of bookings? The queue supports pagination or virtual scrolling to handle large volumes.
- What happens when the admin clicks WhatsApp but doesn't have WhatsApp installed? The `wa.me` URL opens a web fallback page with a download prompt — silent fail, acceptable for v1.

## Requirements

### Functional Requirements

- **FR-001**: Administrators MUST be able to view all bookings in a single queue view.
- **FR-002**: The queue MUST display each booking's reference, customer name, tour title, travel date, guest count, total price, hotel name, status, and actionable buttons.
- **FR-003**: The queue MUST be responsive — desktop shows a multi-column table layout, mobile shows stacked cards.
- **FR-004**: Each booking status MUST be displayed as a color-coded badge: PENDING (amber), CONFIRMED (emerald), COMPLETED (blue), CANCELLED (gray).
- **FR-005**: Administrators MUST be able to change a booking's status via a dropdown or selector on each row.
- **FR-006**: Status changes MUST render optimistically — the badge updates immediately on selection before the server confirms.
- **FR-007**: If a status update fails server-side, the badge MUST revert to the previous status.
- **FR-008**: The status dropdown MUST only present valid transitions for the current status — CONFIRMED for PENDING, COMPLETED or CANCELLED for CONFIRMED, CANCELLED for PENDING. Invalid transitions (e.g., PENDING → COMPLETED) MUST be hidden or disabled.
- **FR-009**: Each booking row MUST have a WhatsApp action button styled with WhatsApp brand green.
- **FR-010**: Clicking the WhatsApp button MUST open a WhatsApp deep link with the customer's phone number.
- **FR-011**: The WhatsApp deep link MUST include a pre-formatted message with booking details (tour name, reference, date, pickup details).
- **FR-012**: The WhatsApp message MUST be localized to the customer's language if available, falling back to English.
- **FR-013**: The WhatsApp button MUST be disabled or hidden for bookings without a valid phone number.
- **FR-014**: The queue MUST display an empty state when no bookings exist.
- **FR-015**: The queue SHOULD support pagination to handle large volumes of bookings.
- **FR-016**: Booking references MUST follow the format `TLG-{YYYYMMDD}-{XXXX}` (e.g., `TLG-20260530-0001`), generated server-side with a 4-digit daily counter.

### Key Entities

- **Booking**: A customer reservation record with reference, customer details, tour details, travel date, guest count, price, hotel, and status. The core entity managed in the queue.
- **ActiveQueueTicket**: A display-oriented representation of a booking in the queue, including all fields shown in the table plus computed fields like tour title and pickup time for WhatsApp message composition.
- **Booking Status**: One of four lifecycle states — PENDING (awaiting processing), CONFIRMED (verified and accepted), COMPLETED (tour occurred), CANCELLED (no longer active). Allowed transitions: PENDING → CONFIRMED, PENDING → CANCELLED, CONFIRMED → COMPLETED, CONFIRMED → CANCELLED. No backward or circular transitions permitted.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admins can locate any booking in the queue within 5 seconds of loading the page.
- **SC-002**: Status changes appear instantly on screen (optimistic update) and complete server-side within 2 seconds.
- **SC-003**: The WhatsApp deep link opens within 1 second of clicking the button.
- **SC-004**: The queue renders with zero Cumulative Layout Shift (CLS) on page load.
- **SC-005**: The queue is fully usable and scannable at all viewport widths from 320px to 1920px.
- **SC-006**: Zero cases of stale status display — the queue reflects the latest status from the server on each page load.

## Assumptions

- **Pickup time source**: The `pickupTime` field for WhatsApp messages is derived from the earliest itinerary milestone's time tag on the associated tour. If no itinerary exists, pickup time is omitted from the message.
- **Language detection**: The customer's preferred language for WhatsApp messages is determined by the tour page's active language at time of booking, defaulting to English if not captured. A per-booking language preference is stored on the Booking record.
- **Booking model extended**: The Booking model from feature 005 is extended to support all 4 statuses (PENDING, CONFIRMED, COMPLETED, CANCELLED — not just binary) and a `language` field for WhatsApp message localization.
- **Admin authentication**: The admin is already authenticated via the existing authentication system. No additional auth changes are needed.
- **WhatsApp numbers**: Phone numbers stored as E.164 strings are valid for WhatsApp. The system does not validate WhatsApp availability per number.
- **Single admin user**: The queue is designed for a single concurrent admin operator. No conflict resolution for concurrent status edits.
- **Pagination**: For v1, the queue loads all bookings without pagination (confirmed volume: fewer than 100 active bookings at any time). Pagination is noted as a future enhancement for 500+ volumes.
- **Message template**: The WhatsApp message template is available in all 6 project languages (EN, DE, RU, FR, IT, TR). Each language has its own translated template string. The template format is: "Hello {customerName}! Your booking {bookingReference} for {tourTitle} on {travelDate} is confirmed. Pickup: {pickupTime}. Thank you for choosing TALAGO!" with equivalent translations in other languages.

