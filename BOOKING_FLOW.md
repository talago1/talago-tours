# Talago Tours — Booking & Checkout Architecture

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

