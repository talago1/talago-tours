# Feature Specification: Automated Digital Tour Voucher & QR Check-In Engine

**Feature Branch**: `008-voucher-qr-checkin`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Feature: Automated Digital Tour Voucher Generator & QR Check-In Engine"

## Clarifications

### Session 2026-05-30

- Q: How does staff authenticate when scanning a QR code on a mobile device off-site? → A: Staff pre-logs into the admin system on their phone before the shift; the verification page is optimized for mobile within the existing authenticated session.
- Q: What level of audit logging should be captured for check-in events? → A: Log every check-in with timestamp and booking reference, stored in a JSON array on the Booking record (analogous to `paymentGatewayLogs` from the payment feature).
- Q: How does the tourist access their voucher URL? → A: Both channels — the voucher link is shown on the checkout success page (Feature 005) AND included in the WhatsApp confirmation message (Feature 006).

## User Scenarios & Testing

### User Story 1 - Tourist views and prints digital boarding pass (Priority: P1)

A tourist with a confirmed booking navigates to their voucher page using their booking reference. They see a premium digital boarding pass showing their tour title (in their checkout language), full name, travel date, guest breakdown, hotel name, and pickup time. A QR code is displayed encoding a secure verification link. The tourist can print the voucher directly from their browser, producing a clean A4-optimized output with no web UI elements.

**Why this priority**: The voucher is the primary deliverable the tourist needs for their tour day — without it the operational check-in flow cannot function.

**Independent Test**: Can be fully tested by creating a confirmed booking record and navigating to its voucher URL. The full boarding pass renders with all details, the QR code appears, and the print button triggers a print-ready layout.

**Acceptance Scenarios**:

1. **Given** a booking has status CONFIRMED, **When** the tourist navigates to the voucher page for that booking, **Then** a full digital boarding pass is displayed with tour title, customer name, travel date, guest counts, hotel name, and pickup time.
2. **Given** a digital boarding pass is displayed, **When** the tourist clicks the print button, **Then** the browser print dialog opens with a clean A4 layout that hides navigation, buttons, and shadows.
3. **Given** a digital boarding pass is displayed, **When** the page has loaded, **Then** a scannable QR code is rendered that encodes the secure verification URL for that booking.

---

### User Story 2 - Staff verifies tourist via QR code scan (Priority: P2)

A tour operator or boat coordinator, already logged into the admin system on their mobile device, scans the QR code from the tourist's voucher. The verification page displays the booking details in a mobile-optimized view and allows the staff member to mark the tourist as checked in with a single action. If the tourist has already been checked in, the system displays a clear alert preventing duplicate check-in.

**Why this priority**: Enables the operational check-in workflow that ensures accurate headcounts and prevents boarding issues.

**Independent Test**: Can be fully tested by navigating to the verification URL and completing a check-in. A second attempt on the same URL shows the duplicate alert.

**Acceptance Scenarios**:

1. **Given** a QR code from a confirmed booking, **When** a staff member navigates to the verification URL, **Then** a check-in page displays the booking details with a confirm action.
2. **Given** a booking has not been checked in yet, **When** a staff member confirms check-in, **Then** the booking is marked as checked in and a success confirmation is shown.
3. **Given** a booking has already been checked in, **When** a staff member navigates to the verification URL, **Then** a clear bright alert is displayed indicating the tourist was already checked in, and no further check-in action is available.

---

### User Story 3 - Unconfirmed booking renders error screen (Priority: P3)

A tourist with a PENDING or CANCELLED booking attempts to view their voucher page. Instead of a boarding pass, they see a clean secure error screen explaining that a voucher can only be generated for confirmed bookings and advising them to contact support.

**Why this priority**: Prevents unauthorized voucher generation, protects booking integrity, and guides users to the correct next steps.

**Independent Test**: Can be tested by navigating to the voucher URL for a PENDING and a CANCELLED booking — both show the error screen.

**Acceptance Scenarios**:

1. **Given** a booking with status PENDING, **When** the tourist navigates to the voucher page, **Then** a secure error screen is displayed stating the voucher is not yet available.
2. **Given** a booking with status CANCELLED, **When** the tourist navigates to the voucher page, **Then** a secure error screen is displayed stating the voucher is not available.
3. **Given** an error screen is displayed for an unconfirmed booking, **When** the page renders, **Then** no booking details (tour title, customer name, dates) are leaked on the error screen.

---

### Edge Cases

- What happens when the booking reference does not exist in the system? A generic "not found" error screen is shown with no information leakage.
- How does the system handle a booking with zero guests or missing hotel/pickup data? The voucher renders with available data and graceful empty states for missing optional fields.
- What happens if the QR code cannot be generated? The voucher still renders all text details; the QR code area shows a fallback message.
- How does a printed voucher behave on different paper sizes? The print layout is optimized for A4 as the primary target, with graceful scaling for Letter size.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a digital boarding pass voucher only for bookings with status CONFIRMED.
- **FR-002**: System MUST display a secure error screen for bookings with status PENDING or CANCELLED, with no booking detail leakage.
- **FR-003**: System MUST display a generic "not found" error screen for invalid or non-existent booking references.
- **FR-004**: Voucher MUST show the tour title in the language stored on the booking record at checkout time.
- **FR-005**: Voucher MUST display the full customer name, travel date, guest breakdown (adults/children), hotel name, and pickup time from the booking record.
- **FR-006**: Voucher MUST include a QR code that encodes the secure administrative verification URL for that booking.
- **FR-007**: QR code MUST be generated entirely on the client side without loading external resources or libraries from third-party CDNs.
- **FR-008**: Voucher MUST provide a print action that triggers the browser's native print dialog.
- **FR-009**: When printed, the voucher MUST produce a clean layout optimized for A4 paper with all web UI elements (navigation, buttons, shadows) hidden.
- **FR-010**: System MUST provide a secure verification endpoint accessible by QR code scan that displays booking summary and a check-in action.
- **FR-011**: Verification endpoint MUST atomically mark a booking as checked in upon staff confirmation, appending a timestamped audit entry to a JSON log field on the booking record.
- **FR-012**: If a booking has already been checked in, the verification endpoint MUST display a clear visual alert and prevent duplicate check-in.
- **FR-013**: Verification endpoint MUST be protected by the existing admin authentication system to prevent unauthorized check-in manipulation.
- **FR-014**: The verification page MUST be optimized for mobile devices (readable layout, large tap targets) since staff access it from phones at off-site locations.
- **FR-015**: Staff MUST authenticate into the admin system on their device before accessing the verification page; the QR code alone does not provide authentication.
- **FR-016**: The voucher link MUST be displayed on the checkout success page so the tourist can immediately access their boarding pass after payment.
- **FR-017**: The voucher link MUST be included in the WhatsApp confirmation message sent to the tourist (Feature 006 integration), providing persistent access from their messaging app.

### Key Entities

- **Booking**: Core booking record containing reference number, status (CONFIRMED/PENDING/CANCELLED), customer name, travel date, guest counts, hotel name, pickup time, language context, and check-in status.
- **Voucher**: A rendered read-only representation of a confirmed booking, designed as a digital boarding pass with QR code and print-optimized layout.
- **Check-In Event**: An atomic state transition on a booking record marking the tourist as boarded, with clear duplicate detection and a timestamped audit trail stored on the booking record.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Tourists with confirmed bookings can view a complete digital boarding pass in under 2 seconds from navigation.
- **SC-002**: Staff can complete a QR-based check-in verification in a single action (one tap/click after scan).
- **SC-003**: Duplicate check-in attempts are detected and display a clear visual alert 100% of the time.
- **SC-004**: Unconfirmed bookings (PENDING/CANCELLED) always show a secure error screen with no data leakage.
- **SC-005**: Printed voucher produces a clean A4 output with zero web UI elements visible.
- **SC-006**: QR code renders reliably across all modern mobile and desktop browsers without external library dependencies.

## Assumptions

- The booking record already contains all required fields (customer name, travel date, guest counts, hotel name, pickup time, language) from the existing checkout system.
- The existing admin authentication system will protect the verification endpoint.
- The booking language context stored at checkout determines the tour title localization displayed on the voucher.
- Print functionality relies on the native browser print dialog — no server-side PDF generation is needed.
- QR code verification is performed on-device (mobile phone or tablet) by tour staff.
- A4 is the primary print target, with graceful scaling for other paper sizes.
- The `isCheckedIn` status is tracked directly on the booking record (no separate check-in table needed).
- Hotel name and pickup window data are already populated by the booking flow from Feature 005/006.
- Staff use their personal mobile devices to scan QR codes and must log into the admin system at the start of their shift. There is no dedicated hardware or separate mobile app.
