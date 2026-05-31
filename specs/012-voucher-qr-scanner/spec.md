# Feature Specification: Digital Booking Voucher & Mobile QR Scanner

**Feature Branch**: `012-voucher-qr-scanner`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Digital Booking Voucher Generator & Mobile QR Code Verification Scanner for tourist boarding passes and field guide check-in"

## User Scenarios & Testing

### User Story 1 - Tourist views and prints digital boarding pass (Priority: P1)

A tourist with a confirmed booking opens their digital boarding pass from the checkout success page or WhatsApp link. They see a premium card with tour title, passenger details, total guest count, pickup hotel, and a prominent QR code. They can print the pass directly from the browser for a clean A4 handout.

**Why this priority**: The boarding pass is the primary deliverable the tourist needs to board the tour — without it the operational check-in cannot function.

**Independent Test**: Can be tested by creating a confirmed booking, opening the voucher URL, and confirming all details render correctly with a scannable QR code.

**Acceptance Scenarios**:

1. **Given** a booking with CONFIRMED status, **When** the tourist opens the voucher page, **Then** a digital boarding pass displays: tour title, passenger name, total pax, hotel name, and a QR code.
2. **Given** the boarding pass is displayed, **When** the tourist clicks print, **Then** the browser print dialog opens with a clean A4 layout hiding web chrome.
3. **Given** a QR code is rendered, **When** a guide scans it with the scanner app, **Then** the booking is identified and verification begins.

---

### User Story 2 - Guide scans QR code with mobile camera to check in (Priority: P2)

A tour guide opens the scanner on their mobile phone. The camera activates with a targeting reticle and animated scan line. The guide points the camera at a tourist's QR code (from phone or printed paper). On successful decode, the phone vibrates and the guide sees the tourist's booking details. One tap marks the tourist as checked in, and the result shows a green success card.

**Why this priority**: Camera-based scanning is faster and more reliable than manual URL entry, especially for large groups at boat docks or hotel lobbies.

**Independent Test**: Can be tested by opening the scanner on a mobile device, pointing at a valid QR code from a test booking, confirming the decode + vibration + details display + check-in success.

**Acceptance Scenarios**:

1. **Given** the scanner is open on a mobile device, **When** the camera activates, **Then** a targeting reticle with an animated scanning line appears over the camera feed.
2. **Given** a QR code is successfully decoded, **When** the scan completes, **Then** the device vibrates and the tourist's booking details are displayed.
3. **Given** booking details are displayed, **When** the guide confirms check-in, **Then** the booking is marked as checked in and the screen shows a green success card with passenger name and tour title.

---

### User Story 3 - Scanner handles errors gracefully (Priority: P3)

If the camera is denied, the code is invalid, the booking is already checked in, or the token is forged, the scanner shows a clear error message and allows the guide to retry.

**Why this priority**: Field operators need clear feedback when something goes wrong — silent failures cause operational chaos.

**Independent Test**: Can be tested by denying camera permission (error message shown), scanning an invalid QR code (error + retry), and scanning a QR from an already-checked-in booking (duplicate alert).

**Acceptance Scenarios**:

1. **Given** the user denies camera permission, **When** the scanner attempts to start, **Then** an error message explains how to enable camera access.
2. **Given** a QR code with an invalid or expired token, **When** the system verifies it, **Then** an error message is displayed and the guide can retry.
3. **Given** a booking is already checked in, **When** the guide scans its QR code, **Then** a clear duplicate check-in alert is shown preventing re-check-in.

---

### Edge Cases

- What happens when the tourist shows a printed QR code that is smudged or damaged? The scanner may not decode it — the guide can retry or use manual booking reference lookup.
- What happens when there is no rear camera on the device? The scanner defaults to the front camera with a warning.
- What happens when the device does not support camera APIs? A fallback manual booking reference input is shown.
- What happens if two guides scan the same QR code simultaneously? The first succeeds atomically; the second receives a "already checked in" response.
- What happens when the QR token has expired (based on timestamp)? The verification endpoint rejects the request as expired.

## Requirements

### Functional Requirements

- **FR-001**: System MUST generate a cryptographically signed QR code containing booking ID, secure token, and timestamp for every confirmed booking.
- **FR-002**: The voucher page MUST display a print-optimized digital boarding pass with all booking details.
- **FR-003**: The QR code MUST be scannable from both phone screens and printed paper.
- **FR-004**: The scanner MUST activate the device camera and display a live feed with a centered targeting reticle.
- **FR-005**: The scanner MUST display an animated horizontal scanning line within the reticle during active scanning.
- **FR-006**: On successful QR decode, the device MUST trigger haptic vibration feedback.
- **FR-007**: Decoded QR data MUST be verified server-side for token authenticity and expiration before allowing check-in.
- **FR-008**: Successful check-in MUST atomically set `isCheckedIn` to true and record the event timestamp.
- **FR-009**: Duplicate check-in attempts MUST be rejected with a clear alert.
- **FR-010**: Camera permission denial MUST show a helpful error message with setup instructions.
- **FR-011**: The scanner MUST default to the rear camera and fall back gracefully if unavailable.

### Key Entities

- **Booking Voucher**: A digital boarding pass rendered for a confirmed booking, containing tour details, passenger info, and a QR code encoding a cryptographically signed verification payload.
- **QR Payload**: A signed data structure containing bookingId, secureToken, and timestamp — encoded in the QR code and verified by the check-in endpoint.
- **Scanner Session**: A mobile camera session managed by the guide's browser, capturing and decoding QR codes in real-time for check-in processing.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Voucher page loads and renders in under 2 seconds on a standard mobile connection.
- **SC-002**: QR code decodes successfully within 3 seconds of appearing in the camera frame.
- **SC-003**: Check-in completes (scan → verify → confirm) in under 5 seconds for a valid booking.
- **SC-004**: The printed boarding pass fits within A4 dimensions without content cutoff.
- **SC-005**: Zero cumulative layout shift during voucher page rendering and scanner initialization.

## Assumptions

- The secure token is generated server-side using HMAC-SHA256 with a secret stored in environment variables (consistent with existing Paymob HMAC approach from Feature 007).
- QR codes are generated as pure SVG (no third-party dependencies) — consistent with Feature 008 convention.
- Camera QR decoding uses the browser's native BarcodeDetector API when available, with a lightweight JavaScript fallback for unsupported browsers.
- The verify endpoint is POST /api/admin/operations/verify-qr — a new endpoint alongside the existing Feature 008 URL-based verification.
- Haptic vibration uses the Navigator.vibrate API — silent fail if unsupported.
- The guide is already authenticated via the existing admin session (consistent with Feature 008 clarification).
- The feature builds on the existing Booking model fields (isCheckedIn, checkedInAt, checkInLog from Feature 008).
