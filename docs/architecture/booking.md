# Talago Tours — Booking & Checkout Architecture

> [!IMPORTANT]
> **Approved Architecture (Final — Do Not Change):**
> Talago uses **two separate records** for the booking lifecycle:
> - `BookingLead` (preliminary interest, `status: LeadStatus`) — created when a customer expresses interest but has not yet completed checkout.
> - `Booking` (confirmed reservation, `status: BookingStatus`) — created when checkout is completed.
>
> Both share a stable `attemptId` / `idempotencyKey` and a single `LiveChatConversation`.
> PR #29's approach of merging interests into `Booking.status = INTERESTED` was **rejected** — do not reintroduce it.

## 1. Booking Entrypoints

Customers can reserve tours through three distinct UI workflows depending on their device and entry point:

1. **Full Page Checkout (`/checkout/[tourId]`):**
   - Direct, dedicated page with comprehensive tour summary, add-ons list, pickup location selector, and guest tiers.
   - Recommended for complex tours, multiple passengers, and airport transfers.
2. **Continuous Booking Modal (`ContinuousBookingModal.tsx`):**
   - Modern sliding drawer / modal launched from tour detail pages without full page reload.
   - Fast 2-step process (Date & Guests -> Traveler & Pickup Info).
3. **Stepped Inline Checkout (`BookingFormSteps.tsx`):**
   - Embedded stepped booking widget used in tour cards and sidebars.

---

## 2. Checkout Initialization (`POST /api/checkout/initialize`)

All three frontends submit payloads to the single authoritative endpoint `/api/checkout/initialize`.

### Request Lifecycle
```
[Client / Checkout Form]
          │
          │ 1. POST /api/checkout/initialize
          │    Headers: Authorization: Bearer <token>
          │    Credentials: same-origin (talago_session cookie)
          ▼
[resolveRequestUser(request)]
          │ Checks talago_session cookie first, then Bearer token, then refresh_token
          ▼
[Prisma $transaction (Serializable)]
          ├─► enforceCapacity(...) [Atomic capacity check inside tx]
          ├─► PromoCode validation & increment
          ├─► CustomerProfile resolution:
          │     - Authenticated: Find or update profile (sets isShadow = false)
          │     - Guest: findProfileByContact or create isShadow profile
          ├─► Booking.create(...) [Sets bookingReference, accessToken, customerProfileId]
          └─► Transaction.create(...) [Status: SUCCESS for Pay on Arrival, PENDING for Paymob]
          ▼
[Post-Transaction Asynchronous Tasks]
          ├─► adoptOwnedBookings(...) [Binds previous guest records by phone/email]
          ├─► Link active BookingLead & transfer LiveChat conversation
          ├─► Dispatch background notifications (Boarding Pass PDF + WhatsApp + Telegram)
          └─► Initiate Paymob gateway session (if scheme != PAY_ON_ARRIVAL)
          ▼
[Response Payload]
          {
            bookingId: "...",
            accessToken: "...",
            transactionId: "...",
            amountPaidOnline: 0,
            amountDueOnArrival: 45.00,
            scheme: "pay_on_arrival",
            confirmationUrl: "/booking/<accessToken>",
            gatewayIframeUrl?: "https://..."
          }
```

---

## 3. Payment Schemes
- **`pay_on_arrival` (Cash on arrival):**
  - Booking is immediately set to `BookingStatus.CONFIRMED`.
  - Transaction marked as `SUCCESS` (Provider: `CASH`).
  - Redirects straight to `/booking/[accessToken]` or `/tours/checkout/success?token=[accessToken]`.
- **`full_online` & `deposit_online` (Paymob):**
  - Booking is set to `BookingStatus.PENDING`.
  - Paymob payment session is initiated via `/utils/paymob.ts`.
  - Client loads Paymob iframe; upon successful webhook callback (`/api/payments/webhook`), booking flips to `CONFIRMED`.

---

## 4. Post-Booking Confirmation & Access
- The customer is directed to `/booking/[accessToken]` or `/tours/checkout/success?token=[accessToken]`.
- Note: Access to booking data does NOT rely on sequential numeric IDs; it uses an unguessable cryptographic `accessToken` (UUIDv4/nano).
- **Voucher:** Accessible at `/tours/voucher/[accessToken]`.
- **Boarding Pass:** Accessible at `/tours/boarding-pass/[accessToken]`.
- **Account View:**
  - If authenticated, visible immediately under `/account?tab=bookings`.
  - If guest, retrievable via `/my-bookings` by entering `bookingReference` and `customerPhone`.

---

## 5. Preliminary Interest (BookingLead) Lifecycle

> [!NOTE]
> The `BookingLead` model captures customer intent before checkout is completed. It is **separate** from the `Booking` model and uses its own `LeadStatus` enum.

### LeadStatus flow
```
INTERESTED → IN_PROGRESS → CONTACTED → CONVERTED
                                     ↘ ABANDONED  (customer withdrew)
```

### Key invariants
- Each preliminary interest has a stable `sessionId` (the `attemptId`) shared with the eventual `Booking.idempotencyKey`.
- One `LiveChatConversation` per attempt — the same conversation is reused when the lead converts to a booking.
- A lead with `status = ABANDONED` **blocks** any further checkout attempt using the same `idempotencyKey` (returns `409 REQUEST_WITHDRAWN`).
- When a lead converts, its `bookingId` field is set and the lead `status` becomes `CONVERTED`.

### API surface

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/public/booking-interest` | Create a new preliminary interest |
| `GET`  | `/api/public/bookings/resume?leadId=…` | Resume a lead (auth required) |
| `GET`  | `/api/public/bookings/resume?token=…` | Resume a booking by accessToken |
| `POST` | `/api/public/booking-interest/withdraw` | Mark a lead as ABANDONED |
| `POST` | `/api/public/my-bookings/adopt` | Adopt guest leads into authenticated profile |

### Customer-facing entry points
- **My Account (`/account`):** "My Requests" section lists all leads — customer can Continue, Open Conversation, or Withdraw.
- **Tour page (`/tours/[slug]?resumeLead=<leadId>`):** Deep-links open the booking modal pre-filled with lead data.

---

## 6. Admin Notification Pipeline

Three event channels fire in-app `NotificationLog` entries that surface in the admin bell:

| Channel | Trigger |
|---------|---------|
| `NEW_BOOKING_ALERT` | Confirmed booking created in `checkout/initialize` |
| `LEAD_INTEREST_ALERT` | New preliminary interest created in `booking-interest` |
| `CUSTOMER_MESSAGE_ALERT` | Customer sends a live-chat message in `live-chat/messages` |

Notifications are idempotent (keyed on `messageId`). The `GET /api/admin/notifications` endpoint reads
`NotificationLog` with a live-chat fallback for pre-existing unread conversations.
Admin marks notifications read via `PATCH /api/admin/notifications`.

