# Contracts: Notification API Endpoints

**Feature**: 017-notification-engine

## 1. Trigger Notification Endpoint

`POST /api/notifications/trigger`

- **Purpose**: Called by Feature 016 payment webhook after a booking is confirmed.
- **Request Body** (JSON):
  ```json
  {
    "bookingId": "<UUID>"
  }
  ```
- **Behavior**:
  1. Load booking, verify `whatsappOptIn` (if false, skip WhatsApp path).
  2. Fetch `NotificationTemplate` for WHATSAPP and EMAIL.
  3. Compile each template using `utils/notificationCompiler.ts`.
  4. Dispatch messages via `utils/gatewayChannels.ts` (WhatsApp, Email) **asynchronously** using Next.js `after()`.
  5. Create `NotificationLog` entries with status `SENT`.
  6. Return `200 OK` with `{ "status": "triggered" }`.

- **Responses**:
  - `200 OK` – trigger accepted.
  - `400 Bad Request` – missing/invalid `bookingId`.
  - `404 Not Found` – booking not found.
  - `500 Internal Server Error` – unexpected failure (log and monitor).

## 2. Template Management Endpoint

`GET /api/notifications/templates`

- **Purpose**: List current templates (admin view).
- **Auth**: Admin session required.
- **Response** (JSON array):
  ```json
  [
    {
      "id": "<UUID>",
      "channel": "WHATSAPP",
      "subject": null,
      "body": "Your booking ..."
    },
    {
      "id": "<UUID>",
      "channel": "EMAIL",
      "subject": "Booking Confirmation",
      "body": "Dear {{customer_name}}, ..."
    }
  ]
  ```

`PUT /api/notifications/templates/:id`

- **Purpose**: Update a template.
- **Auth**: Admin session.
- **Request Body** (JSON):
  ```json
  {
    "subject": "<string>",
    "body": "<string>"
  }
  ```
  - `subject` required for EMAIL, ignored for WHATSAPP.
- **Responses**:
  - `200 OK` – updated.
  - `400 Bad Request` – validation errors (missing placeholders, empty body).
  - `404 Not Found` – template ID not found.

## 3. Notification Log Endpoint

`GET /api/notifications/logs`

- **Purpose**: Admin view of audit log.
- **Auth**: Admin session.
- **Query Params** (optional):
  - `bookingId=<UUID>` – filter by booking.
  - `channel=WHATSAPP|EMAIL`
  - `status=SENT|DELIVERED|FAILED`
  - `page=<int>` & `limit=<int>` – pagination (default 1/20).
- **Response** (JSON):
  ```json
  {
    "data": [
      {
        "id": "<UUID>",
        "bookingId": "<UUID>",
        "channel": "WHATSAPP",
        "recipient": "+14155551234",
        "status": "DELIVERED",
        "errorMessage": null,
        "sentAt": "2026-05-30T12:34:56Z",
        "deliveredAt": "2026-05-30T12:35:02Z"
      }
    ],
    "meta": {
      "total": 124,
      "page": 1,
      "limit": 20
    }
  }
  ```

- **Responses**:
  - `200 OK` – log data.
  - `401 Unauthorized` – not admin.

## 4. Webhook Endpoints (WhatsApp Delivery)

`POST /api/notifications/webhook/whatsapp`

- **Purpose**: Receive delivery status callbacks from Meta.
- **Headers**: `X-Hub-Signature` – HMAC‑SHA256 using `WHATSAPP_WEBHOOK_SECRET`.
- **Payload** (example):
  ```json
  {
    "messages": [{
      "id": "wamid.GBG...",
      "status": "delivered",
      "timestamp": "2026-05-30T12:35:02Z",
      "recipient_id": "14155551234"
    }]
  }
  ```
- **Behavior**:
  1. Verify signature.
  2. Look up `NotificationLog` by `recipient` and `sentAt` (or store WhatsApp message ID).
  3. Update status to `DELIVERED` (or `FAILED`).
- **Responses**:
  - `200 OK` – processed.
  - `400 Bad Request` – invalid payload.
  - `401 Unauthorized` – invalid signature.

All endpoints must respect the **TALAGO Constitution** (server‑first mindset, strict type safety, zero tailwind bloat for API routes, observability via logging).