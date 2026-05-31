# Feature Specification: Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine

**Feature Branch**: `019-promo-codes-campaigns`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine"

## User Scenarios & Testing

### User Story 1 - Customers apply promo codes at checkout to receive discounts (Priority: P1)

As a customer on the checkout page, I want to enter a promo code in a dedicated input field, see instant feedback on whether the code is valid, and watch the discount be applied to my booking total before I complete payment.

**Why this priority**: Discounts and promo codes are a powerful conversion lever during checkout. Without this, the platform cannot run promotional campaigns or offer price incentives at the point of purchase.

**Independent Test**: Can be tested by navigating to the checkout page, entering a valid promo code in the promo input field, clicking "Apply", and verifying that the booking total updates with the correct discount applied. Entering an expired, invalid, or fully used code must show a clear error message with no price change.

**Acceptance Scenarios**:

1. **Given** a customer is on the checkout page with a valid cart total, **When** they enter a valid, active promo code and click Apply, **Then** the discount is calculated server-side, the total updates to reflect the discount, and a green success indicator appears alongside the slashed final price.
2. **Given** a customer enters a promo code that has exceeded its usage limit, **When** they submit the code, **Then** an error message informs them the code is no longer available.
3. **Given** a customer enters a promo code that has expired, **When** they submit the code, **Then** an error message informs them the code has expired.
4. **Given** a customer enters a promo code whose minimum booking value requirement is not met, **When** they submit the code, **Then** an error message informs them the minimum spend required to use this code.
5. **Given** a customer enters a promo code that does not exist, **When** they submit the code, **Then** an error message informs them the code is invalid.

---

### User Story 2 - Administrators create and manage promo code campaigns (Priority: P1)

As an operations manager, I want to create new promo codes with configurable discount types, values, usage limits, minimum spend thresholds, and expiry dates, so that I can run targeted marketing campaigns and track their performance.

**Why this priority**: Without the ability to create and manage promo codes, the checkout experience has no effect. The admin campaign console is the backbone that powers all promotional pricing.

**Independent Test**: Can be tested by logging into the admin panel, navigating to the campaigns page, creating a new promo code with a percentage discount and usage limit, then using that code at checkout and verifying the admin dashboard shows the usage count increment.

**Acceptance Scenarios**:

1. **Given** an admin is on the campaigns page, **When** they fill in the code name, select a discount type (percentage or fixed amount), set a value, usage limit, minimum booking value, and expiry date, and click Save, **Then** the new promo code is created and appears in the campaign grid.
2. **Given** a promo code exists, **When** an admin views the campaign grid, **Then** they see its current usage count compared to the maximum limit displayed as a progress bar.
3. **Given** a promo code has fully expired, **When** an admin views the grid, **Then** the code is visually indicated as inactive.

---

### User Story 3 - Checkout backend securely validates and applies promo codes atomically (Priority: P2)

As the system, I want to ensure that promo code validation and usage-count incrementing happens strictly server-side within a single atomic operation during the checkout flow, preventing race conditions, code reuse, and client-side price tampering.

**Why this priority**: Without atomic server-side enforcement, a malicious user could repeatedly apply the same code before the counter updates, exploit client-side price modification, or use a code beyond its intended limit.

**Independent Test**: Can be tested by sending two simultaneous checkout requests with the same promo code when only one use remains, verifying that exactly one succeeds and the other is rejected. Client-side price modifications must be rejected by the server before any payment communication.

**Acceptance Scenarios**:

1. **Given** a promo code has only one remaining use, **When** two concurrent checkout requests are submitted with that code, **Then** exactly one booking is created with the discount applied and the other is rejected.
2. **Given** a client-side price has been tampered with after a promo validation, **When** the checkout initialization runs, **Then** the server re-validates the pricing and rejects the transaction.

---

### Edge Cases

- **Concurrent usage**: If two checkouts attempt to use the same promo code simultaneously when only one slot remains, atomic database operations must prevent overselling.
- **Expired during checkout**: If a promo code expires between the time the customer applies it and the time they complete payment, the checkout should re-validate and reject the code with a clear message.
- **Currency mismatch**: If a promo code is configured for EGP but the booking total is in USD, the system must reject the code or convert values — default to reject with an explanation.
- **Zero or negative totals**: If a fixed-amount discount would reduce the booking total to zero or below, the system must cap the discount so the final total is never negative.
- **Stacking prevention**: Multiple promo codes applied to the same booking must not be allowed — only one code per booking.
- **Admin editing live codes**: If an admin reduces the maxUses limit below the current usedCount, the code should immediately become unavailable without breaking existing bookings.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow customers to enter a promo code at checkout and receive real-time validation feedback.
- **FR-002**: Promo code validation MUST occur entirely server-side, never trusting client-side calculations or discount amounts.
- **FR-003**: The system MUST support two discount types: percentage-based (PERCENTAGE) and fixed amount (FIXED_AMOUNT).
- **FR-004**: Percentage discounts MUST be calculated against the booking subtotal before any other discount.
- **FR-005**: Fixed amount discounts MUST use the currency matching the booking's billing currency.
- **FR-006**: The system MUST enforce usage limits: a promo code cannot be used more times than its configured maxUses limit.
- **FR-007**: The system MUST enforce expiry validation: expired promo codes must be rejected.
- **FR-008**: The system MUST enforce minimum booking value: the booking subtotal must equal or exceed the promo code's minBookingValue.
- **FR-009**: Promo code usage count MUST be incremented atomically within the same transaction as booking creation to prevent race conditions.
- **FR-010**: Administrators MUST be able to create, view, and manage promo codes via an admin campaigns dashboard.
- **FR-011**: The admin campaigns dashboard MUST display each promo code's usage count as a progress indicator relative to its maxUses limit.
- **FR-012**: Only one promo code may be applied per booking — stacking is not permitted.
- **FR-013**: When a discount would reduce the total below zero, the system MUST cap the final total at zero (non-negative pricing).

### Key Entities

- **PromoCode**: A promotional pricing rule linked to bookings. Attributes include: unique code string, discount type (percentage or fixed amount), discount value (decimal), currency, minimum booking value, maximum uses, current usage counter, expiry date, active flag, and creation/update timestamps.
- **Booking (existing)**: The checkout record that may optionally reference an applied PromoCode for discount tracking and audit purposes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Coupon validation lookups complete in under 100ms for customers during checkout.
- **SC-002**: Zero cases of promo code usage-limit overshoot after atomic transaction enforcement (verified via audit logs).
- **SC-003**: Administrators can create a new promo code campaign and have it live and usable at checkout in under 2 minutes.
- **SC-004**: The checkout discount display updates within 500ms of a customer clicking the "Apply" button.
- **SC-005**: 100% of promo code applications are verifiable against the booking record for audit trail purposes.

## Assumptions

- **Single-code only**: Only one promo code per booking; stacking multiple codes is explicitly prohibited.
- **Admin session**: The admin campaign dashboard reuses the existing admin authentication framework from prior features.
- **Currency alignment**: Promo codes are created with a specific currency. If checkout currency differs, the code is rejected rather than converted.
- **No retroactive changes**: Modifying a promo code after bookings have used it does not retroactively change existing booking prices.
- **Manual deactivation**: Admins can manually deactivate codes by setting isActive to false if they need to halt a running campaign immediately.
- **Checkout integration**: The promo code validation API is called both during initial Apply (for UX feedback) and again atomically during checkout initialization to prevent tampering, as outlined in the design.