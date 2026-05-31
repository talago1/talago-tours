# Feature Specification: Hybrid Checkout & Payment Pipeline

**Feature Branch**: `016-checkout-payment-pipeline`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Viator-Style Public Checkout Pipeline, Local Payment Gateway Integration & Dynamic Hybrid Payment Engine"

## User Scenarios & Testing

### User Story 1 - Tourist completes checkout with any payment scheme (Priority: P1)

A tourist who has selected a tour visits the checkout page. They enter the lead traveler's name, email address, and WhatsApp number for contact. They provide pickup details: hotel name, room number (optional), and preferred pickup time. The tourist then chooses how to pay from three clear options: pay the full amount online, pay a deposit online and the rest on arrival, or pay everything in cash on arrival.

As they make their selection, a live price breakdown updates instantly showing: the base tour price multiplied by the number of guests, the amount due online now (if applicable), and the balance due to the guide on the day of the tour. If they choose Pay on Arrival, the booking is confirmed immediately with a clear statement of the amount due on the tour day.

**Why this priority**: The checkout page is the conversion point — without a working checkout flow, no bookings can be completed regardless of how good the catalog is.

**Independent Test**: Can be tested by navigating to a tour checkout, filling in passenger and pickup details, selecting Pay on Arrival, submitting, and confirming the booking is created with a PENDING payment status and the amount due on arrival is displayed clearly.

**Acceptance Scenarios**:

1. **Given** a tourist is on the checkout page, **When** they enter passenger details (name, email, phone), **Then** the form validates the inputs and shows errors for invalid email or phone format.
2. **Given** a tourist has entered passenger details, **When** they enter pickup information (hotel name, optional room number, pickup time), **Then** the fields accept and display the entered values.
3. **Given** a tourist is on the checkout page, **When** they select "Pay on Arrival" as their payment scheme, **Then** the price breakdown shows $0 due online and the full amount highlighted as due on arrival.
4. **Given** a tourist selects "Full Online Payment", **When** they submit the form, **Then** they are securely redirected to the payment page.
5. **Given** a tourist selects "Deposit Online (20%)", **When** they submit the form, **Then** they are securely redirected to the payment page with the deposit amount calculated.
6. **Given** a tourist submits a Pay on Arrival booking, **When** the system checks availability, **Then** the booking is created only if passenger capacity for that date is not exceeded.
7. **Given** a tourist submits a booking for a date at full capacity, **When** the system checks availability, **Then** a clear "Sold out" message is shown and the booking is not created.

---

### User Story 2 - Tourist pays online via secure payment gateway (Priority: P2)

After submitting their booking with Full Online or Deposit Online payment, the tourist is securely redirected to the payment gateway page. They complete the transaction using their preferred payment method — debit/credit card or Fawry mobile wallet. After successful payment, they are returned to the website where a confirmation page shows their booking reference, payment status, and any remaining balance due on arrival.

**Why this priority**: Online payment is required for the deposit and full-payment schemes, which handle the majority of advance bookings.

**Independent Test**: Can be tested by selecting Full Online Payment on checkout, being redirected to the payment gateway, completing a test payment, and returning to the confirmation page showing a successful booking with CONFIRMED status.

**Acceptance Scenarios**:

1. **Given** a tourist has submitted an online payment booking, **When** they are redirected to the payment gateway, **Then** the correct amount is displayed and the merchant details are visible.
2. **Given** a tourist completes a successful payment, **When** they are returned to the website, **Then** a confirmation page shows the booking reference, CONFIRMED status, and any balance due on arrival.
3. **Given** a tourist's payment fails or is declined, **When** they are returned to the website, **Then** a clear failure message is shown with an option to retry payment.
4. **Given** a tourist leaves during payment and returns later, **When** they revisit the checkout, **Then** they see the option to resume or retry their pending payment.

---

### User Story 3 - System verifies payment notifications and updates booking (Priority: P3)

When a payment is completed via the gateway, the payment provider sends a notification to the system. The system cryptographically verifies that the notification is genuine and not a forged request. Once verified, the system updates the booking status, records the transaction details, and if a balance remains due on arrival, flags it for the guide's collection list on the tour day.

**Why this priority**: Reliable payment verification prevents fraud, ensures booking integrity, and enables the operations team to prepare accurate daily collection sheets.

**Independent Test**: Can be tested by simulating a payment notification with a valid cryptographic signature, confirming the booking status changes to CONFIRMED, and verifying the daily operations report reflects any outstanding collection amounts.

**Acceptance Scenarios**:

1. **Given** a payment notification is received, **When** the cryptographic signature is invalid, **Then** the notification is rejected and the booking status is not changed.
2. **Given** a payment notification is received with a valid signature, **When** the transaction was successful, **Then** the booking status changes to CONFIRMED and the transaction is recorded.
3. **Given** a booking has a balance due on arrival, **When** the payment is confirmed, **Then** the outstanding amount is flagged for the guide's daily collection sheet.
4. **Given** a Full Online Payment booking is confirmed, **When** the transaction is recorded, **Then** the amount due on arrival is zero and no collection flag is set.
5. **Given** a Deposit Online Payment booking is confirmed, **When** the transaction is recorded, **Then** the remaining balance is displayed as due on arrival.

---

### Edge Cases

- What happens if the tourist's session expires during checkout? The system should preserve the draft booking and allow resumption with a clear message.
- What happens if the payment gateway is unreachable? The system should show a friendly error message and allow the tourist to retry or switch to Pay on Arrival.
- What happens if the tourist refreshes the confirmation page? The booking details should remain visible and the status should reflect the current state (no duplicate booking).
- What happens if the tourist navigates away during payment? Their pending booking should be retrievable with a "Resume payment" option.
- What happens if the payment notification arrives after the tourist closed the browser? The system should still process it and the booking will be confirmed. The tourist will see the confirmed status when they next check.
- What happens if a tourist submits a Pay on Arrival booking for a date that was just filled by another booking? The system checks capacity at submission time and rejects with a "Sold out" message.
- What happens for bookings with amountDueOnArrival > 0 at the end of the tour day? The guide should have a clear list of outstanding collections.

## Requirements

### Functional Requirements

- **FR-001**: The checkout page MUST collect lead traveler name, email, WhatsApp phone number, hotel name, optional room number, and preferred pickup time.
- **FR-002**: The system MUST validate email format and phone number format before accepting the booking.
- **FR-003**: The tourist MUST be able to choose from three payment schemes: Full Online Payment, Deposit Online Payment (20%), or Pay on Arrival.
- **FR-004**: The system MUST display a real-time price breakdown that updates when the payment scheme changes, showing: base price × guest count, amount due online now, and balance due on arrival.
- **FR-005**: The system MUST check passenger capacity for the selected tour date before creating any booking.
- **FR-006**: The system MUST reject the booking with a clear message if the selected date has reached capacity.
- **FR-007**: For Pay on Arrival bookings, the system MUST create the booking immediately with a PENDING payment status and return a confirmation.
- **FR-008**: For online payment schemes, the system MUST redirect the tourist to the payment gateway with the correct amount calculated.
- **FR-009**: After successful online payment, the system MUST display a confirmation page showing the booking reference, CONFIRMED status, and any balance due on arrival.
- **FR-010**: After failed payment, the system MUST display a clear failure message and allow the tourist to retry.
- **FR-011**: The system MUST verify payment notifications using cryptographic signature verification before processing any status changes.
- **FR-012**: The system MUST reject payment notifications with invalid signatures without making any changes to the booking or transaction records.
- **FR-013**: Upon verified successful payment, the system MUST update the booking status to CONFIRMED and record the transaction details.
- **FR-014**: If a balance remains due on arrival after payment, the system MUST flag the outstanding amount for the guide's daily collection report.
- **FR-015**: The system MUST allow a tourist to resume a pending payment if they left during the payment process.

### Key Entities

- **Booking**: Contains the tourist's personal and pickup details, selected tour, departure date, guest count, and current status (PENDING, CONFIRMED, CANCELLED).
- **Payment Transaction**: Records each payment attempt including the amount paid online, amount due on arrival, payment scheme (Full Online, Deposit Online, Pay on Arrival), payment provider used, gateway reference, and status (PENDING, SUCCESS, FAILED).
- **Tour Capacity Schedule**: Tracks the maximum number of passengers per departure date and the current number of confirmed bookings for capacity checking.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A tourist can complete the checkout form and submit a Pay on Arrival booking in under 3 minutes.
- **SC-002**: A tourist completes an online payment booking, including gateway redirect and return, in under 5 minutes total.
- **SC-003**: The price breakdown updates within 200ms of the tourist changing their payment scheme selection.
- **SC-004**: Payment notifications are processed and booking status is updated within 10 seconds of receipt.
- **SC-005**: Invalid or forged payment notifications are rejected with zero false acceptances.
- **SC-006**: Tourist sees a clear confirmation with booking reference after any successful booking, regardless of payment scheme.
- **SC-007**: The guide's daily collection report accurately reflects all outstanding amounts due on arrival for each confirmed booking.

## Assumptions

- The tour catalog and tour selection (Feature 015) exist — the checkout page receives a pre-selected tour and guest count.
- The payment gateway provider (Paymob/Fawry) handles PCI compliance and card data security — the system never stores raw payment credentials.
- The 20% deposit rate is a fixed rate for all tours and all dates — configurable via environment settings if needed.
- Currency is EGP by default; if multi-currency is needed in the future, it will be a separate feature.
- The daily operations manifest (Feature 011) displays the outstanding collections for guides.
- The QR voucher generation (Feature 012) is triggered by the payment confirmation process for applicable bookings.
- Internet connectivity is assumed for both the tourist and the system — offline payment processing is out of scope.
- The system uses server-side logic for all price calculations — the client never determines prices or payment splits.
