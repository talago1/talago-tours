# Feature Specification: Secure Regional Payment Integration & Webhook Orchestrator

**Feature Branch**: `007-payment-webhook-orchestrator`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Secure Regional Payment Integration (Paymob/Fawry) & Webhook Orchestrator..."

## Clarifications

### Session 2026-05-30

- Q: Post-payment redirect destination → A: Dedicated success page at `/tours/checkout/success` showing booking reference and trust message

## User Scenarios & Testing

### User Story 1 - Customer Pays for Booking via Payment Gateway (Priority: P1)

A customer completes the checkout form and lands on a transitional payment page. The system securely initiates a payment session with the gateway (Paymob). The customer is redirected to the gateway's hosted page, completes payment via card or Fawry, and is redirected back to the site.

**Why this priority**: Without payment, the booking cannot be confirmed. This is the revenue-critical step in the checkout flow.

**Independent Test**: Can be fully tested by completing checkout, landing on the payment page, and confirming the redirect to the Paymob payment gateway with correct amount and booking reference.

**Acceptance Scenarios**:

1. **Given** a customer has submitted the checkout form, **When** the system processes the payment initiation, **Then** the booking's payment status is set to PROCESSING.
2. **Given** the payment initiation is successful, **When** the payment page renders, **Then** the customer is automatically redirected to the Paymob gateway within 3 seconds.
3. **Given** the customer's browser blocks popups or redirects, **When** automatic forwarding fails, **Then** a fallback button is displayed allowing the customer to navigate to the gateway manually.
4. **Given** the payment initiation fails (e.g., gateway unreachable), **When** the system cannot create a payment session, **Then** the customer sees an error message with an option to retry.

---

### User Story 2 - Payment Gateway Webhook Updates Booking Status (Priority: P1)

After the customer completes payment, Paymob sends a server-to-server webhook notification to the system. The system validates the HMAC signature, verifies the transaction, and atomically updates the booking's payment status to PAID and operational status to CONFIRMED.

**Why this priority**: This is the secure server-side verification that confirms payment and unlocks the booking. Without it, no booking is confirmed and no revenue is captured.

**Independent Test**: Can be fully tested by sending a valid signed webhook payload to the webhook endpoint and confirming the booking transitions to PAID/CONFIRMED in the database.

**Acceptance Scenarios**:

1. **Given** Paymob sends a valid webhook with correct HMAC signature, **When** the endpoint processes the payload, **Then** the booking's paymentStatus is updated to PAID and status is updated to CONFIRMED in a single atomic transaction.
2. **Given** the webhook payload includes a transaction reference ID, **When** the booking is updated, **Then** the reference ID is stored in the payment gateway logs for audit purposes.
3. **Given** an unauthorized request is sent without a valid HMAC signature, **When** the endpoint receives it, **Then** the request is rejected with a 401 status and no database records are modified.
4. **Given** a duplicate webhook is received for an already PAID booking, **When** the endpoint processes it, **Then** it responds successfully without modifying the booking again (idempotent).

---

### Edge Cases

- What happens if the customer closes the browser before completing payment? The booking remains at PROCESSING — no charge is captured. An admin can manually cancel stale PROCESSING bookings.
- What happens if the webhook arrives before the customer is redirected back? The booking is already PAID/CONFIRMED — the redirect success page will reflect the correct status.
- What happens if the HMAC signature validation fails? The webhook is rejected with 401 and logged for security monitoring.
- What happens if the gateway sends the same webhook twice? The endpoint is idempotent — duplicate webhooks are accepted but do not modify the booking again.
- What happens if the database update fails after successful HMAC validation? The booking may be left as PROCESSING — monitoring should detect this and manual reconciliation may be needed.
- What happens if the customer's payment is declined by the gateway? The gateway redirects the customer back with a failure status; the customer sees a decline message and can retry.

## Requirements

### Functional Requirements

- **FR-001**: System MUST create a payment session with the gateway (Paymob) when the customer reaches the payment page, using the booking reference and total amount.
- **FR-002**: System MUST set the booking's paymentStatus to PROCESSING upon successful payment initiation.
- **FR-003**: The payment page MUST automatically redirect the customer to the gateway's hosted payment page.
- **FR-004**: The payment page MUST display a manual fallback button if automatic redirect is blocked.
- **FR-005**: System MUST expose a webhook endpoint that accepts POST requests from the payment gateway.
- **FR-006**: The webhook endpoint MUST validate the HMAC signature of incoming payloads using a secret key before processing.
- **FR-007**: Requests with invalid or missing HMAC signatures MUST be rejected with HTTP 401 and no database changes.
- **FR-008**: Upon receiving a valid payment-success webhook, the system MUST atomically update the booking's paymentStatus to PAID and operational status to CONFIRMED.
- **FR-009**: The system MUST store the external gateway transaction ID and raw response in a payment gateway logs field on the booking.
- **FR-010**: The webhook endpoint MUST be idempotent — duplicate webhooks for the same booking must not cause errors or duplicate state changes.
- **FR-011**: System MUST redirect the customer back to the site after payment completion with a clear success or failure outcome.
- **FR-012**: If payment fails or is declined, the customer MUST see a clear failure message with the option to retry payment.

### Key Entities

- **Booking**: Extended with paymentStatus (PROCESSING, PAID, FAILED) and paymentGatewayLogs (JSON field storing external transaction IDs, gateway response, timestamps for audit trail).
- **PaymentTransaction** (ephemeral): The payment session created with the gateway — contains the booking reference, amount, currency, and gateway token. Not persisted as a separate entity; the gateway return reference is captured in the Booking's paymentGatewayLogs.
- **HMAC Signature**: A cryptographic hash computed from the webhook payload and a shared secret key (PAYMOB_HMAC_SECRET) used to verify that webhooks genuinely come from Paymob.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Customers complete the payment redirect within 3 seconds of landing on the payment page (automatic redirect).
- **SC-002**: The webhook endpoint processes and validates incoming payloads in under 500ms.
- **SC-003**: 100% of unauthorized webhook requests (invalid HMAC) are rejected with 401 before any database modification.
- **SC-004**: The payment status transition (PROCESSING → PAID + CONFIRMED) is atomic — no case where paymentStatus updates but operational status is left unchanged.
- **SC-005**: Duplicate webhooks for the same transaction produce no errors or duplicate state changes (idempotency confirmed).
- **SC-006**: All gateway transaction IDs are stored in the audit log — zero loss of external reference data.

## Assumptions

- **Primary gateway**: Paymob is the primary payment gateway. Fawry is treated as a payment method within Paymob (not a separate gateway integration).
- **Post-payment redirect**: After payment, Paymob redirects the customer to a success page on the site. The redirect URL is configured in the Paymob dashboard and passed during session creation.
- **HMAC algorithm**: Paymob uses HMAC-SHA256 for webhook signatures, consistent with their standard API documentation.
- **Payment methods**: Paymob is configured to accept card payments (Visa/Mastercard) and Fawry — exact methods are configured in the Paymob dashboard, not in application code.
- **Webhook reliability**: Paymob sends webhooks with at-least-once delivery. The application handles duplicates via idempotency.
- **Post-payment redirect destination**: After completing payment, the customer is redirected to `/tours/checkout/success` — a dedicated success page showing the booking reference and a trust message. This URL is passed to Paymob during session creation as the `return_url`.
- **Currency**: All payments are processed in EGP (Egyptian Pounds) by default, as TALAGO operates in the Egyptian Red Sea region. Amounts are displayed in USD on the frontend and converted to EGP at the gateway level.

