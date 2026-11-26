# Talago Tours — Architectural & Product Decisions

## Record of Key Technical Decisions

### 1. Database & Consistency
- **Decision:** Execute capacity checks and booking creation inside a single `Serializable` database transaction.
- **Rationale:** Prevents double-booking and overselling of limited-capacity boat or safari tours under concurrent traffic spikes.

### 2. Session Management
- **Decision:** Dual-token httpOnly cookies (`talago_session` + `talago_refresh`) with server-side supremacy over client-side tokens.
- **Rationale:** Eliminates client-side hydration race conditions where requests fired before `supabaseClient` restored localStorage tokens returned 401 Unauthorized.

### 3. Customer Identity & Phone Matching
- **Decision:** Strict national number normalization (`phoneMatchKey` in `src/utils/phoneMatch.ts`) instead of naive substring matching.
- **Rationale:** Egyptian and Middle Eastern customers enter numbers with variable formats (`010...`, `+2010...`, `002010...`). Normalizing to national digits ensures 100% accurate identity matching while preventing short suffix collisions.

### 4. Internationalization (i18n)
- **Decision:** Hand-written React context (`LanguageContext`) + localized JSON dictionaries (8 locales: EN, DE, RU, IT, FR, PL, ES, UK) without heavy external libraries (`next-intl`, `i18next`).
- **Rationale:** Keeps bundle sizes light, eliminates routing proxy overhead, and allows dynamic multilingual content stored in tour/destination JSON columns.

### 5. Multi-Interface Checkout Parity
- **Decision:** Maintain 3 dedicated checkout interfaces (Page, Modal, Steps) that all target the identical backend handler `/api/checkout/initialize`.
- **Rationale:** Different devices and funnel sources require tailored UX (e.g. instant mobile drawer vs. detailed desktop checkout), but the underlying business rules (pricing, promo codes, capacity, notifications) must stay strictly unified.

### 6. Non-Destructive Database Evolution
- **Decision:** Never execute destructive schema alters; shadow profiles are transitioned to verified profiles rather than deleted.
- **Rationale:** Preserves historical financial audits, transaction logs, reviews, and customer lifetime value metrics.

### 7. Separate BookingLead + Booking Records (FINAL — Do Not Revert)
- **Decision (2026-11-26):** Preliminary customer interest is captured in a `BookingLead` record (with `LeadStatus`). A confirmed checkout creates a separate `Booking` record (with `BookingStatus`). They share a stable `attemptId` / `idempotencyKey` and a single `LiveChatConversation`.
- **Rejected alternative:** PR #29 proposed setting `Booking.status = INTERESTED` to merge interests into the booking table. This was rejected because it conflates two different lifecycle stages, pollutes the booking table with unconverted leads, complicates revenue reporting, and breaks the idempotency model (a withdrawn interest must block future checkout without creating a cancelled booking).
- **Rationale:** Clean separation of concern — leads are pre-sales data; bookings are financial commitments. Conversion is tracked via `BookingLead.bookingId` and `BookingLead.status = CONVERTED`. This model is non-destructive to customer history and allows the admin to track lead-to-booking conversion rates independently.
- **Enforcement:** A withdrawn lead (`status = ABANDONED`) returns `409 REQUEST_WITHDRAWN` on any subsequent checkout attempt with the same `idempotencyKey`. This guard lives in `src/app/api/checkout/initialize/route.ts`.

### 8. In-App Admin Notifications via NotificationLog
- **Decision (2026-11-26):** Admin event notifications (new booking, new lead, customer message) are stored as `NotificationLog` entries with a typed `channel` field. The `errorMessage` column is repurposed to store JSON metadata (title, link, customer name) since it is the only available freeform text column.
- **Rationale:** Avoids a schema migration while providing persistent, idempotent, in-app notifications. The `messageId` field ensures each event creates at most one notification record. The admin notification endpoint (`GET /api/admin/notifications`) reads these records and falls back to live `liveChatConversation` for pre-existing unread chats without `NotificationLog` entries.
- **Future:** When a schema migration is approved, rename `errorMessage` to `metadata` and add a proper `NotificationLog.readAt` timestamp column to replace the `status = READ/UNREAD` pattern.

