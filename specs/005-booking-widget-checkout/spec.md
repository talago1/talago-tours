# Feature Specification: Booking Widget & Checkout Engine

**Feature Branch**: `005-booking-widget-checkout`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "High-Conversion Sticky Booking Widget & Automated Checkout Engine..."

## Clarifications

### Session 2026-05-30

- Q: Pricing formula → A: `(perPersonPrice * guestCount) + zoneSurcharge`
- Q: Capacity management → A: Date-based capacity with max per date; sold-out set by admin; no automatic inventory decrement
- Q: Booking lifecycle/status → A: Binary status — `confirmed` on creation, admin can toggle to `cancelled`
- Q: Booking confirmation delivery → A: Success page only. No email/SMS. The success page displays the booking reference with a high-trust message: "Our team is preparing your pickup details and will contact you directly via WhatsApp within 15 minutes." Admin handles follow-ups manually via WhatsApp Operational Queue dashboard.

## User Scenarios & Testing

### User Story 1 - Book a Tour from Tour Page (Priority: P1)

A customer visiting a tour page wants to book the tour for a specific date with their group. They see a sticky booking widget on the desktop tour page (or a floating action bar on mobile), select their travel date and number of guests, see the total price update instantly, enter their pickup zone, hotel name, and contact details, then submit to confirm the booking.

**Why this priority**: This is the core conversion flow — without it, no bookings can be made.

**Independent Test**: Can be fully tested by loading any tour page, completing the two-step form with valid data, and confirming the success redirect. Delivers the primary booking capability.

**Acceptance Scenarios**:

1. **Given** a customer is viewing a tour page on desktop, **When** the page loads, **Then** a sticky booking widget is visible on the right side of the layout with the tour's base price displayed.
2. **Given** the booking widget is displayed, **When** the customer selects a future date and increases the guest count, **Then** the total price updates instantly to reflect the selected configuration.
3. **Given** the customer has selected date and guests (Step 1), **When** they click "Continue" or "Next", **Then** Step 2 appears with zone picker, hotel name, name, email, and phone fields.
4. **Given** the customer fills in all required fields with valid data, **When** they submit the booking, **Then** the system creates a booking record and redirects to a success confirmation page displaying the unique booking reference (TLG-2026-XXXX) with the message: "Our team is preparing your pickup details and will contact you directly via WhatsApp within 15 minutes."
5. **Given** the customer submits the booking, **When** the request is processing, **Then** the submit button shows a loading state and cannot be clicked again.

---

### User Story 2 - Mobile Responsive Booking (Priority: P1)

A customer browsing on a mobile device wants to book a tour. They see a compact floating action bar at the bottom of the screen showing the total price and a checkout button.

**Why this priority**: Mobile traffic is essential for conversion; the widget must be fully functional at all screen sizes.

**Independent Test**: Can be tested by resizing the browser to mobile viewport width and verifying the widget transforms into a fixed-bottom bar with price summary and action button.

**Acceptance Scenarios**:

1. **Given** a customer is viewing a tour page on a screen narrower than the `lg:` breakpoint, **When** the page loads, **Then** the booking widget displays as a fixed-bottom bar showing the total price on the left and a checkout button on the right.
2. **Given** the mobile booking bar is displayed, **When** the customer taps the checkout button, **Then** a full-screen or modal form opens to complete steps 1 and 2 of the booking flow.

---

### User Story 3 - Input Validation Prevents Invalid Bookings (Priority: P2)

The system prevents customers from submitting bookings with invalid or incomplete data, ensuring only clean booking records are created.

**Why this priority**: Data quality directly affects operations — invalid bookings create support overhead and operational friction.

**Independent Test**: Can be tested by attempting to submit the form with past dates, empty required fields, and invalid phone numbers, and verifying each is blocked with a clear error message.

**Acceptance Scenarios**:

1. **Given** a customer has selected a past date, **When** they attempt to proceed, **Then** the system shows an error message: "Please select a future date."
2. **Given** a customer has entered an incomplete phone number (missing country code or too few digits), **When** they submit, **Then** the system shows an error: "Please enter a valid phone number including country code."
3. **Given** a customer has not entered their name, **When** they submit, **Then** the system shows an error: "Name is required."
4. **Given** a customer has not entered their email, **When** they submit, **Then** the system shows an error: "Email is required."

---

### User Story 4 - System Prevents Duplicate Submissions (Priority: P2)

The system protects against accidental duplicate booking submissions caused by double-clicking or network latency.

**Why this priority**: Duplicate bookings create customer confusion and operational overhead — prevention is critical for trust.

**Independent Test**: Can be tested by rapidly clicking the submit button multiple times and verifying only one booking record is created.

**Acceptance Scenarios**:

1. **Given** a customer has submitted a booking, **When** the request is in flight, **Then** the submit button enters a disabled loading state and cannot be clicked again.
2. **Given** a customer's browser is slow to respond, **When** they accidentally refresh or re-navigate to the page during submission, **Then** the system does not create a duplicate booking for the same request.

---

### Edge Cases

- What happens when a tour has no available dates (sold out)? The admin sets a max capacity per date; dates at or above that threshold are blocked in the date picker. If all future dates are sold out, the widget shows "Sold Out" instead of the booking form.
- How does the system handle network failures during submission? Show a clear error message with a retry option, and preserve the form data so the customer does not have to re-enter everything.
- What happens if the zone picker has no zones configured? The dropdown should show "No pickup zones available" and block submission.
- How does the system handle a guest count of zero? The minimum guest count should be 1 and the counter should not allow going below 1.
- What happens if the hotel name field is excessively long? The system should enforce a reasonable maximum length (e.g., 200 characters) with a character counter.

## Requirements

### Functional Requirements

- **FR-001**: The booking widget MUST display as a sticky sidebar on desktop (≥lg breakpoint) and as a fixed-bottom bar on mobile (<lg breakpoint).
- **FR-002**: The main checkout action button MUST use the coral color (#FF5B00) and show a loading spinner with disabled state during submission.
- **FR-003**: Trust indicators and badge highlights MUST use the forest green color (#00473F).
- **FR-004**: Customers MUST be able to select a future travel date via a calendar/date picker. Past dates MUST be blocked from selection.
- **FR-005**: Customers MUST be able to increment/decrement a guest counter with a minimum of 1 and a configurable maximum (based on tour capacity).
- **FR-005b**: Each date MUST have a configurable maximum guest capacity. Dates at or above capacity MUST be marked as sold out and blocked in the date picker.
- **FR-006**: The system MUST calculate and display the total price in real-time as the customer changes the guest count or pickup zone. The formula is: `(perPersonPrice * guestCount) + zoneSurcharge`.
- **FR-007**: Customers MUST select a pickup zone from a predefined dropdown list (e.g., El Gouna, Makadi Bay, Hurghada).
- **FR-008**: Customers MUST enter their hotel name as free text (maximum 200 characters).
- **FR-009**: Customers MUST provide their full name (required, minimum 2 characters).
- **FR-010**: Customers MUST provide a valid email address (standard email format validation).
- **FR-011**: Customers MUST provide a phone number in international format (E.164) suitable for WhatsApp contact.
- **FR-012**: The system MUST submit the complete booking data for processing when the customer clicks the final confirmation button.
- **FR-013**: Upon successful booking, the system MUST redirect the customer to `/tours/checkout/success?ref=TLG-2026-XXXX` where XXXX is a unique 4-character alphanumeric booking reference.
- **FR-014**: The system MUST persist booking records with fields: tourId, zoneId, hotelName, travelDate, guestCount, totalPriceUSD, and a unique booking reference.
- **FR-015**: The system MUST prevent duplicate submissions by disabling the submit button immediately after first click until the response is received.
- **FR-016**: The system MUST validate all inputs client-side before submission and show inline error messages for invalid fields.
- **FR-017**: The system MUST validate all inputs server-side upon receipt and return appropriate error responses for invalid data.
- **FR-018**: The checkout flow SHOULD be divided into two logical steps: Step 1 (date + guests) and Step 2 (pickup zone, hotel name, contact details).
- **FR-019**: The system SHOULD preserve all form data and show a friendly error with retry option if the submission fails due to network error.
- **FR-020**: The system SHOULD accept pricing configuration rules from the parent tour page to calculate the total cost.

### Key Entities

- **Booking**: A reservation record with binary status (`confirmed` or `cancelled`), containing booking reference, tour ID, customer contact details, travel date, guest count, pickup zone, hotel name, total price, and creation timestamp. Created as `confirmed` by default; admin can toggle to `cancelled` if needed.
- **Customer**: The end user browsing the tour page and completing the booking form. Represented by their name, email, and phone number captured in the booking.
- **Tour**: The product being booked. Provides pricing rules and capacity limits that feed into the widget's price calculation and guest count constraints.
- **Pickup Zone**: A geographic area (e.g., El Gouna, Makadi Bay) that customers select for hotel pickup. Zones have associated pricing adjustments that affect the total price.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Customers can complete a booking from the tour page in under 2 minutes (start to success redirect).
- **SC-002**: The total price updates and is visible to the customer within 100ms of changing guest count or zone selection.
- **SC-003**: The widget renders with zero Cumulative Layout Shift (CLS) on page load — the sticky sidebar does not cause content reflow.
- **SC-004**: Zero duplicate booking records are created as a result of double-clicks or rapid resubmissions.
- **SC-005**: The booking widget is fully usable and correctly transformed at all viewport widths from 320px to 1920px.

## Assumptions

- **No payment integration**: This feature creates booking records and confirms reservations but does not include payment gateway integration. Future features may add online payment collection.
- **Pricing rules provided by tour data**: The widget receives base price, per-person pricing, and zone-based pricing adjustments as props from the parent tour page component — it does not independently fetch pricing data.
- **Single-day bookings**: Tours are single-day experiences. Multi-day/multi-date tours are out of scope for this feature.
- **Desktop-first but mobile-ready**: The primary conversion flow is designed for desktop users, but the widget fully transforms for mobile viewports as specified.
- **WhatsApp-ready phone format**: Phone numbers are collected in E.164 format (+ followed by country code and number) for WhatsApp integration, but actual WhatsApp messaging is out of scope.
- **Existing Prisma schema requires extension**: The Booking database model must be added to the Prisma schema. Tour model is assumed to exist already.
- **Standard browser date picker**: The calendar/date picker uses the native HTML date input or a lightweight date picker — no heavy third-party date library.
- **Booking reference generation**: The booking reference format `TLG-2026-XXXX` uses a short random alphanumeric suffix that is unique and human-readable for customer support use.
- **No automated confirmation delivery**: The success page is the sole confirmation mechanism. No email or SMS gateway is integrated. Admin handles follow-up via WhatsApp Operational Queue dashboard.
- **PII handled per standard practice**: Customer name, email, and phone are stored with the booking record for operational use only. Data retention follows standard industry practice for booking records (retained for the duration of the booking lifecycle).
