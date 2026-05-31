# Research: Automated Post-Booking Notification Engine

**Date**: 2026-05-30  
**Feature**: 017-notification-engine

## Decision 1: WhatsApp Messaging Strategy

### Decision: Use free-form messages via WhatsApp API (Option A)

**Rationale**:
- The spec assumes admin can edit templates and have changes take effect immediately (SC-005: "under 2 minutes")
- Meta WhatsApp template messages require pre-approval (hours/days delay), breaking the success criteria
- Free-form messages work within the 24-hour customer service window
- Customers opt in at checkout (Feature 016), establishing the session window

**Alternatives considered**:
- **Option B (Template messages)**: Would require Meta pre-approval workflow, incompatible with "immediate template edit" requirement
- **Option C (Hybrid)**: Unnecessary complexity for this feature's scope

## Decision 2: Async Dispatch Mechanism

### Decision: Use Next.js `after()` for background dispatch

**Rationale**:
- Framework-native, provider-agnostic (works on Vercel, self-hosted)
- Non-blocking: response sent immediately while background work continues
- No external queue infrastructure needed for <200 notifications/day
- Simple error handling via `.catch()` on background promises

**Alternatives considered**:
- **Unawaited promises**: Unreliable on serverless — function may terminate before background work completes
- **External queue (BullMQ, Inngest)**: Overkill for this volume; adds Redis/infra complexity

## Decision 3: Email Provider

### Decision: Resend (assumed from spec)

**Rationale**:
- Transactional email service with good Next.js integration
- Simple REST API or SDK
- Generous free tier

## Decision 4: Template Placeholder Implementation

### Decision: Simple regex-based string replacement

**Rationale**:
- Deterministic, no external dependencies
- Easy to debug and test
- Supports the 8 specified placeholders: `{{customer_name}}`, `{{tour_title}}`, `{{pickup_time}}`, `{{voucher_url}}`, `{{departure_date}}`, `{{pickup_location}}`, `{{booking_reference}}`, `{{amount_due_on_arrival}}`

## Decision 5: Retry Mechanism

### Decision: In-process retry with setTimeout

**Rationale**:
- Low volume (50-200/day)
- Simple to implement within the dispatch function
- Uses the `after()` context to avoid blocking

**Alternatives considered**:
- **Queue-based retries**: Would require external infrastructure (Redis, queue service)

## Decision 6: WhatsApp API Configuration

### Decision: Store credentials in environment variables

**Required env vars**:
- `WHATSAPP_ACCESS_TOKEN` - Bearer token from Meta Business Suite
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID from WhatsApp Manager
- `WHATSAPP_WEBHOOK_SECRET` - For verifying webhook signatures (future)

**API Endpoint**: `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`

## Decision 7: Email API Configuration

### Decision: Resend with API key from environment

**Required env vars**:
- `RESEND_API_KEY` - Transactional email API key

**From address**: Use `notifications@talago.tours` (to be configured)