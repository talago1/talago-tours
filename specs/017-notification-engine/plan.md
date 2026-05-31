# Implementation Plan: Automated Post-Booking Notification Engine & WhatsApp/Email Voucher Delivery

**Branch**: `017-notification-engine` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-notification-engine/spec.md`

## Summary

Automatically dispatch WhatsApp (free-form, 24h session window) and email notifications to customers upon booking confirmation. Includes an admin template editor with dynamic placeholders, a delivery audit log, and async non-blocking dispatch via background queue. Option A (free-form WhatsApp without Meta template pre-approval) validated via client opt-in at checkout.

## Technical Context

**Language/Version**: TypeScript (strict mode, no `any`), Next.js 14+ (App Router)

**Primary Dependencies**: Prisma Client (PostgreSQL), Resend (email), Meta WhatsApp Business API (REST), TailwindCSS

**Storage**: PostgreSQL via Prisma (NotificationLog + NotificationTemplate models, Booking.whatsappOptIn field)

**Testing**: Vitest (unit: compiler, gateway channels), Playwright (E2E: admin template editor, delivery log)

**Target Platform**: Linux server (Vercel / Node.js runtime)

**Project Type**: Web application (Next.js fullstack — Server Components + API routes)

**Performance Goals**: Notifications dispatched within 30s of booking confirmation (SC-001); admin page loads <3s (SC-007)

**Constraints**: Async non-blocking dispatch (FR-010); atomic audit logging; zero Meta template review delay; server-side placeholder parsing only

**Scale/Scope**: ~50–200 notifications/day (early), scaling to 1000+/day; log retention append-only; up to 3 retries per failed notification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Justification |
|------|--------|---------------|
| I.1 Server-First (RSC by default) | ✅ PASS | Admin page is client-side (template editing, log table), trigger API is server-only RSC |
| I.2 Strict Type-Safety (no `any`) | ✅ PASS | All NotificationLog, NotificationTemplate, and compiler types strictly typed |
| I.3 Zero Tailwind Bloat | ✅ PASS | Standard componentized layout (2-column admin, log table, status badges) |
| I.4 Semantic HTML | ✅ PASS | Admin page uses semantic `<main>`, `<section>`, `<table>` |
| II.1 PageSpeed ≥90/95 mobile/desktop | ✅ PASS | Admin page is lightweight — no heavy assets |
| II.2 LCP ≤1.5s / CLS 0 | ✅ PASS | No images on admin notifications page |
| II.3 Media Treatment | N/A | No images processed in this feature |
| II.4 Zero Third-Party Animation | ✅ PASS | Native Tailwind transitions only |
| III.1 Conversion Palette | ✅ PASS | Coral for FAILED status badges, Forest for DELIVERED badges |
| III.2 Sticky/Floating Widget | N/A | No checkout widgets in this feature |
| III.3 Fail-Safe Forms | ✅ PASS | Template save validation, placeholder syntax checking |
| IV.1 Multi-Currency Precision | N/A | No currency operations |
| IV.2 Zone Edge Calculation | N/A | No pricing operations |
| IV.3 Cross-Device Fluidity | ✅ PASS | Admin page responsive via Tailwind breakpoints |
| IV.4 Edge-Case Form Resilience | ✅ PASS | Missing phone/email handled gracefully (FR-011) |
| V. Developer's Pledge | ✅ PASS | All components production-grade, no placeholders |

**Constitution violations**: None. Feature aligns fully with TALAGO principles.

## Project Structure

### Documentation (this feature)

```text
specs/017-notification-engine/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── notifications-trigger-api.md
│   ├── notifications-templates-api.md
│   └── notifications-logs-api.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── notifications/
│   │       ├── trigger/route.ts        # POST - fire notification dispatch
│   │       ├── templates/route.ts      # GET/PUT - admin template CRUD
│   │       └── logs/route.ts           # GET - admin delivery log
│   └── admin/
│       └── notifications/page.tsx      # Admin template editor + log viewer
├── lib/
│   ├── notification/
│   │   ├── compiler.ts                 # Placeholder interpolation engine
│   │   ├── gateway-whatsapp.ts         # WhatsApp Business API client
│   │   ├── gateway-email.ts            # Resend/SendGrid email client
│   │   └── dispatcher.ts              # Orchestrator: compile → dispatch → log
│   └── types/
│       └── notification.ts            # Shared types (NotificationLog, Template, Channel, Status enums)
├── components/
│   └── admin/
│       ├── notification-template-editor.tsx  # Left column: template textareas
│       ├── notification-delivery-log.tsx     # Right column: status table
│       └── notification-status-badge.tsx     # Coral/emerald status indicator
└── utils/
    ├── notificationCompiler.ts         # Standalone compiler utility
    └── gatewayChannels.ts              # WhatsApp + Email channel clients
```

**Structure Decision**: Standard Next.js App Router fullstack layout. API routes under `app/api/notifications/`, shared lib under `lib/notification/`, admin UI under `app/admin/notifications/`.

## Complexity Tracking

No constitution violations. No complexity justification needed.

## Milestones

### Milestone 1: Schema Expansion & Checkout Opt-In Tracking
- **Files to Modify**: `prisma/schema.prisma`, Feature 16 Booking model
- Add `Booking.whatsappOptIn` (Boolean, default true)
- Add `NotificationLog` model with enums: Channel (WHATSAPP, EMAIL), Status (SENT, DELIVERED, FAILED)
- Add `NotificationTemplate` model (single-row per channel, editable body text)
- Add `@@index([bookingId])` on NotificationLog

### Milestone 2: Free-Form Custom Compiler & Admin Console
- **Files to Create**: `lib/notification/compiler.ts`, `app/admin/notifications/page.tsx`
- Compiler: regex-based placeholder replacement (`{{customer_name}}`, `{{tour_title}}`, `{{voucher_url}}`, etc.)
- Admin UI: 2-column layout — template textareas (left) + delivery log table (right)

### Milestone 3: Gateway Connector Pipelines
- **Files to Create**: `lib/notification/gateway-whatsapp.ts`, `lib/notification/gateway-email.ts`
- WhatsApp: REST fetch to Meta Business API, free-form text within 24h session window
- Email: Resend/SendGrid client, HTML with QR voucher from Feature 12

### Milestone 4: Post-Checkout Webhook Sync & Async Queues
- **Files to Create**: `app/api/notifications/trigger/route.ts`
- Triggered by Feature 16 payment webhook
- Checks `whatsappOptIn`, extracts booking data, compiles templates, dispatches async
- Both channels dispatched in parallel without blocking checkout response
