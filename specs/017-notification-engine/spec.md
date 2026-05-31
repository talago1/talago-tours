# Feature Specification: Automated Post-Booking Notification Engine & WhatsApp/Email Voucher Delivery

**Feature Branch**: `017-notification-engine`

**Created**: 2026-05-30

**Updated**: 2026-05-31

**Status**: Draft

**Input**: User description: "Automated Post-Booking Notification Engine & WhatsApp/Email Voucher Delivery"

## User Scenarios & Testing

### User Story 1 - Customer receives automated booking confirmation via WhatsApp and Email (Priority: P1)

After a tour booking is confirmed (payment cleared or Pay on Arrival booking created), the customer automatically receives two messages: a WhatsApp message and an email. Both messages include their name, the tour title, departure date, pickup time and location, and a link to their digital voucher. The messages arrive within seconds of the booking being confirmed. If a message fails to send, the system retries automatically and logs the failure for the operations team.

**Why this priority**: Automated notification delivery is the primary value of this feature — without it, customers would have no way to receive their booking confirmation, vouchers, or pickup instructions, leading to confusion and missed tours.

**Independent Test**: Can be tested by confirming a booking (either via Pay on Arrival checkout or payment webhook), then checking the customer's WhatsApp and email inbox for the notification messages containing the correct booking details and voucher link. The notification log in the admin panel shows a SENT status.

**Acceptance Scenarios**:

1. **Given** a booking has been confirmed, **When** the notification trigger fires, **Then** a WhatsApp message is sent to the customer's phone number with the booking details and voucher link within 30 seconds.
2. **Given** a booking has been confirmed, **When** the notification trigger fires, **Then** an email is sent to the customer's email address with the full booking details and voucher link within 30 seconds.
3. **Given** the WhatsApp message was sent successfully, **When** the delivery confirmation is received, **Then** the notification log entry is updated to DELIVERED status.
4. **Given** the WhatsApp message failed to send, **When** the delivery error is received, **Then** the notification log entry is updated to FAILED status with the error message recorded.
5. **Given** a notification failed to send, **When** the retry mechanism runs, **Then** the system attempts to resend up to 3 times before marking as permanently failed.
6. **Given** the customer's phone number is invalid or missing, **When** the WhatsApp dispatch is triggered, **Then** the notification is logged as FAILED with a descriptive error and the system still sends the email independently.
7. **Given** a booking is confirmed, **When** both dispatch channels are triggered simultaneously, **Then** neither channel blocks the other — a failure on one channel does not prevent the other from being sent.

---

### User Story 2 - Admin configures notification templates and monitors the live delivery log (Priority: P2)

An operations manager can access the notification settings console in the admin panel. The layout presents a clean two-column workspace: the left panel provides rich text-area editors for each channel's message template (WhatsApp and email), with clearly labelled dynamic placeholder tokens; the right panel shows a dense live table tracking every notification dispatch — showing recipient, channel, delivery status, timestamp, and any error messages. Status states are visually distinguished: successful deliveries use a calm emerald indicator, while transmission anomalies or retry-needed failures use the brand's signature Coral tone to demand immediate attention. Admins can save updated templates and immediately see them applied to the next booking confirmation.

**Why this priority**: Template management and delivery monitoring give the operations team full control over customer communication content and visibility into delivery health. Catching failures early and correcting template errors prevents customers from receiving incomplete or broken notifications.

**Independent Test**: Can be tested by navigating to the admin notifications page, editing the WhatsApp template to include a new message line, confirming a booking, and verifying the new template text appears in the outgoing WhatsApp message. The right-hand delivery log table updates to show the new notification row with correct status colour coding.

**Acceptance Scenarios**:

1. **Given** an admin is on the notification settings page, **When** they edit the WhatsApp template and save, **Then** the updated template is used for all subsequent WhatsApp notifications.
2. **Given** an admin is editing a template, **When** they insert a supported dynamic placeholder such as `{{customer_name}}`, `{{tour_title}}`, `{{pickup_time}}`, or `{{voucher_url}}`, **Then** that placeholder is replaced with the actual booking data when a message is sent.
3. **Given** an admin is on the notification settings page, **When** they view the delivery log panel, **Then** they see all notification dispatch records including channel, recipient, status badge, timestamp, and any error message text.
4. **Given** a notification has a FAILED status, **When** the admin views the log, **Then** the failed entry is visually highlighted with the Coral brand colour indicator for immediate identification.
5. **Given** a notification has a DELIVERED status, **When** the admin views the log, **Then** the entry is shown with an emerald-coloured status badge.
6. **Given** the admin settings page loads, **When** the page renders on a desktop display, **Then** the two-column template editor and delivery log sit side-by-side in a strict left-to-right layout without horizontal overflow.

---

### User Story 3 - Webhook-driven dispatch fires automatically after payment settlement (Priority: P1)

When the payment webhook from Feature 016 finishes recording a successful transaction, the notification pipeline fires automatically without any manual admin action. The system retrieves the confirmed booking's customer contact details, fetches the pickup assignment from the operations calendar, appends the digital QR voucher URL, compiles the full notification context, and dispatches both WhatsApp and email messages through independent asynchronous queues — without holding up the webhook response thread.

**Why this priority**: Automating the trigger ensures zero-latency notifications on every booking confirmation and removes any risk of operations staff forgetting to send confirmation messages manually. It is as critical as US1 to the core customer experience.

**Independent Test**: Can be tested by simulating a payment webhook (or using Feature 016's confirmation flow in staging), verifying that no noticeable delay is added to the webhook response time, and confirming that both a WhatsApp message and an email arrive in the customer's inboxes within the target window with correct pickup time and voucher link data.

**Acceptance Scenarios**:

1. **Given** a payment webhook marks a booking as CONFIRMED, **When** the webhook handler completes transaction recording, **Then** the notification dispatch pipeline is invoked without blocking the webhook response.
2. **Given** the dispatch pipeline is invoked, **When** it runs, **Then** it fetches the customer's contact details, the tour's pickup time from the operations calendar, and the voucher URL from the booking record.
3. **Given** all context data is compiled, **When** template placeholders are resolved, **Then** both WhatsApp and email payloads are dispatched as concurrent, independent asynchronous tasks.
4. **Given** the webhook response has already been returned to the caller, **When** the async dispatch tasks run in the background, **Then** the booking confirmation webhook response time is not degraded by message-sending latency.

---

### Edge Cases

- **Both channels fail**: Both WhatsApp and email are logged as FAILED with individual error details; the retry mechanism runs for each channel independently on separate schedules.
- **Missing email address**: The email notification is skipped and logged as FAILED with a "No email address" descriptor; WhatsApp dispatch proceeds unaffected.
- **Missing phone number**: The WhatsApp notification is skipped and logged as FAILED; email dispatch proceeds unaffected.
- **Invalid template placeholder**: An unrecognised placeholder such as `{{unknown_field}}` is left as literal text in the outgoing message; a warning is written to the server log but no crash or blocking occurs.
- **WhatsApp API temporarily unavailable**: The system retries up to 3 times with a back-off delay between attempts, then marks the log entry as permanently FAILED with the last error message.
- **Email provider rejects the request**: The provider's error message is captured and stored on the log entry; the entry is marked FAILED.
- **Pickup time not yet assigned at notification time**: The `{{pickup_time}}` placeholder resolves to a "To be confirmed" string; a warning is logged but the notification is still sent.
- **Voucher URL not yet generated at notification time**: The `{{voucher_url}}` placeholder resolves to a fallback admin-contact message; the notification is sent and the failure is logged.
- **Booking is cancelled after notification was sent**: No automatic reversal — cancellation communications are handled separately via the operations process.
- **Notification log growth over time**: Logs are append-only and accumulate for audit purposes. Admins can view and filter them in the console by date range or status.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST automatically send a WhatsApp notification to the customer when a booking transitions to CONFIRMED status.
- **FR-002**: The system MUST automatically send an email notification to the customer when a booking transitions to CONFIRMED status.
- **FR-003**: Notifications MUST include at minimum: customer name, tour title, departure date, pickup time, pickup location, booking reference, voucher URL, and amount due on arrival.
- **FR-004**: The system MUST support dynamic placeholders in notification templates that are resolved against real booking data at dispatch time.
- **FR-005**: The supported placeholder set MUST include at minimum: `{{customer_name}}`, `{{tour_title}}`, `{{departure_date}}`, `{{pickup_time}}`, `{{pickup_location}}`, `{{voucher_url}}`, `{{booking_reference}}`, and `{{amount_due}}`.
- **FR-006**: The system MUST log every notification attempt with: delivery channel (WhatsApp or email), recipient address or phone number, delivery status (SENT / DELIVERED / FAILED), timestamp, and any error message.
- **FR-007**: The system MUST retry failed notifications up to 3 times before marking the log entry as permanently failed.
- **FR-008**: The admin MUST be able to view and edit both WhatsApp and email notification templates through the admin console.
- **FR-009**: The admin MUST be able to view the notification delivery log in the admin console, sorted by most recent first.
- **FR-010**: Notifications MUST be dispatched asynchronously and MUST NOT delay the booking confirmation webhook response to the calling client.
- **FR-011**: The system MUST handle missing phone numbers and email addresses gracefully — logging the failure for the missing contact and continuing dispatch on the remaining available channel.
- **FR-012**: The notification dispatch pipeline MUST be triggered automatically when a booking's status transitions to CONFIRMED, without requiring any manual admin action.
- **FR-013**: The system MUST fetch pickup time and location data from the operations calendar assignment (Feature 011) at the time of dispatch.
- **FR-014**: The system MUST retrieve the digital voucher URL from the booking record (Feature 012) and append it to both outgoing messages.
- **FR-015**: Both WhatsApp and email dispatch channels MUST operate as independent queues — a failure in one channel MUST NOT block or cancel the other.

### Key Entities

- **Notification Template**: Stores the message template body for each delivery channel (WhatsApp, email) with dynamic placeholder tokens. Templates are versioned and editable by admins at any time.
- **Notification Log**: An append-only audit record of every notification dispatch attempt. Each entry captures: delivery channel, recipient contact address, current delivery status (SENT / DELIVERED / FAILED), error message if failed, and the timestamp of the attempt. Every log entry is linked to the originating booking.
- **Template Compiler**: The internal routine responsible for accepting a raw template and a booking data context, resolving all supported placeholder tokens, and producing the final ready-to-send message string.
- **Gateway Channel Adapter**: The abstraction layer that wraps the communication with each external messaging provider (one adapter for WhatsApp, one for email). Each adapter accepts a compiled message payload and handles the provider-specific send request, error parsing, and status callback.
- **Booking (existing)**: The source of all notification content — customer name, contact details (phone, email), tour title, departure date, pickup assignment, voucher URL, and booking reference.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Notifications are dispatched within 30 seconds of booking confirmation under normal operating conditions.
- **SC-002**: At least 95% of WhatsApp messages are delivered successfully on the first attempt.
- **SC-003**: At least 95% of emails are delivered successfully on the first attempt.
- **SC-004**: Failed notifications are retried within 5 minutes of the initial failure.
- **SC-005**: Admins can access, edit, and save notification templates in under 2 minutes from landing on the console page.
- **SC-006**: The delivery log updates to show new notification rows within 10 seconds of dispatch.
- **SC-007**: The admin notification console page loads in under 3 seconds on a standard connection.
- **SC-008**: The booking confirmation webhook response time is not increased by more than 50ms due to notification dispatch initiation.

---

## Clarifications

### Session 2026-05-30

- Q: How should WhatsApp Business API template approval requirements be handled? → A: Use free-form messages via WhatsApp API — no template pre-approval needed. Customers opt in via a "click to WhatsApp" checkbox at checkout (Feature 016), establishing the 24-hour service window required for free-form messaging. Admin template edits take effect immediately.

---

## Assumptions

- WhatsApp messages are sent via the Meta WhatsApp Business API (or equivalent service) using free-form messages within the 24-hour customer service window. Customers opt in at checkout (Feature 016) to establish this window.
- Emails are sent via a transactional email provider (Resend, SendGrid, or equivalent).
- The notification trigger fires immediately after the payment confirmation webhook (Feature 016) finishes recording the transaction, or when a Pay on Arrival booking is created directly.
- The digital voucher URL is generated by Feature 012 and stored on the Booking record prior to notification dispatch.
- Pickup time and pickup location are stored on the Booking record via the operations calendar assignment (Features 005/011). If not yet assigned, a "To be confirmed" fallback string is used.
- Notification templates are stored in a single language by default (English). Multi-language template support, if required in a future iteration, will follow the 6-language model defined in the constitution.
- The notification delivery log is append-only — entries are never edited or deleted once written, preserving a full audit trail.
- Admin authentication for the notification console uses the existing admin session middleware from previous features.
- The admin console layout is designed for LTR desktop displays. The template editor and delivery log sit side-by-side on desktop; they may stack vertically on smaller viewports.
- Retry back-off timing (delay between retry attempts) follows a simple fixed delay strategy in v1; exponential back-off may be introduced in a later iteration.
