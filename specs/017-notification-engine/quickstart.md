# Quickstart: Automated Notification Engine

**Feature**: 017-notification-engine

## Overview

The Notification Engine handles the automatic dispatch of WhatsApp and Email notifications upon booking confirmation. It consists of an admin interface for template management and a background dispatch pipeline.

## Development Setup

### 1. Environment Variables

Add the following to `.env.local`:

```bash
# Meta WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=EAAG... (Permanent System User Token)
WHATSAPP_PHONE_NUMBER_ID=1234567890... (From WhatsApp Manager)
WHATSAPP_WEBHOOK_SECRET=your_secret... (For webhook validation)

# Email (Resend)
RESEND_API_KEY=re_...
```

### 2. Database Migration

Apply the schema changes to `prisma/schema.prisma` and migrate:

```bash
npx prisma migrate dev --name add_notifications_schema
```

### 3. Running the Feature

1. **Admin UI**: Go to `/admin/notifications` to configure templates.
2. **Triggering**: 
   - Manually trigger a notification for a specific booking:
     `curl -X POST http://localhost:3000/api/notifications/trigger -d '{"bookingId": "<UUID>"}'`
   - Or trigger via a Feature 16 payment webhook simulation.
3. **Verification**: Check the admin log grid in `/admin/notifications` for `SENT` or `DELIVERED` statuses.

## Architecture Reference

- **Trigger**: `app/api/notifications/trigger/route.ts` (Next.js Route Handler)
- **Compiler**: `utils/notificationCompiler.ts` (Regex-based interpolation)
- **Gateways**: `utils/gatewayChannels.ts` (WhatsApp REST, Resend SDK)
- **Background Work**: `after()` from `next/server` used in the trigger route.

## Testing Guide

### Unit Tests

```bash
# Test the compiler logic
npm test utils/notificationCompiler.test.ts

# Test the gateway channel logic (mocked API)
npm test utils/gatewayChannels.test.ts
```

### E2E Tests (Playwright)

```bash
# Test the admin template editor and log view
npx playwright test tests/admin/notifications.spec.ts
```

## Troubleshooting

- **WhatsApp messages not sending**: Check the `WHATSAPP_ACCESS_TOKEN` and ensure the customer is within the 24h session window.
- **Email not sending**: Check `RESEND_API_KEY` and ensure the "From" email is verified in Resend dashboard.
- **Logs not updating**: Verify the WhatsApp delivery webhook is correctly configured in Meta Business Suite.

## Design Specs Reference

- **Data Model**: `specs/017-notification-engine/data-model.md`
- **API Contracts**: `specs/017-notification-engine/contracts/notifications-api.md`
- **Compiler Specs**: `specs/017-notification-engine/contracts/template-compiler.md`