# Sputnik8 Product Reference Blueprint & Architectural Mapping for Talago

This document serves as the persistent product reference guide reverse engineered from **Sputnik8** (`https://www.sputnik8.com/en`), our primary product benchmark for Talago's customer journey, checkout funnel, customer account architecture, and mobile experience.

---

## 1. Core Product Principles from Sputnik8

1. **Zero Registration Barrier (Guest-First Booking)**:
   - Sputnik8 never forces a user to register or choose a password before booking a tour.
   - Customers provide essentials (Full Name, Phone Number, Email) directly in the checkout form.
   - A verified customer profile is provisioned automatically behind the scenes, linking the booking to their identity.

2. **Phone-First Customer Identification**:
   - Phone number (normalized to E.164 / national digits) serves as the primary real-world anchor.
   - Email is used for receipts, vouchers, and calendar invites, but phone number ensures instant WhatsApp coordination and SMS / messenger lookup.

3. **Total Transparency in Checkout Badges**:
   - Every tour card and booking drawer prominently displays:
     - **Instant Confirmation** (or "Manual confirmation within X hours")
     - **Free Cancellation** (explicitly stating cancellation window, e.g. "Free cancellation up to 24h before")
     - **Payment Scheme** (e.g. "Pay on arrival / Cash to guide" vs "Full payment online" vs "Deposit online")
     - **Hotel Pickup Status** (Included / Meeting point)
   - Trust promises are strictly bound to the tour's real database configuration.

4. **Instant Post-Purchase Fulfillment (Action Strip)**:
   - On booking confirmation, customers are given:
     - 1-Click WhatsApp Concierge button pre-loaded with Booking Reference and Tour Name.
     - 1-Click Printable / Downloadable Voucher (PDF format formatted for mobile and A4 print).
     - Live Booking Lookup without requiring a pre-existing password.

5. **Silent Historical Booking Adoption**:
   - When a customer logs in later (via Email, Telegram OIDC, or Google OAuth), any booking previously made with their verified phone number or email is automatically adopted into their account.

---

## 2. Sputnik8 vs. Talago Implementation Matrix

| Capability | Sputnik8 Benchmark | Talago Implementation (`feature-consolidation` / `main`) |
|---|---|---|
| **Identity Creation** | Seamless during checkout; auto-account creation | `checkout/initialize` auto-creates/links `CustomerProfile`, marks shadow/verified appropriately |
| **Telegram Sign-In** | Phone and profile authentication | Telegram OIDC with `openid profile phone telegram:bot_access` claims + widget fallback |
| **Phone Persistence** | Verified phone stored directly on primary profile | Profile stores `phone`, `telegramPhone`, `telegramPhoneVerified`, and Supabase `user_metadata.phone` |
| **Booking Adoption** | Historical bookings unified by phone/email | `adoptOwnedBookings` & `listVisibleBookingIds` in `src/server/customerBookings.ts` |
| **Voucher Actions** | Mobile ticket with QR & WhatsApp agent | Voucher page (`/tours/voucher/[token]`) & Account page (`/account`) have WhatsApp Concierge & PDF print |
| **Trust Badges** | Dynamic per tour (instant confirmation, cancel window) | `PublicTourCard` & `BookingFormSteps` render dynamic badges from Prisma schema |
| **Payment Options** | Card online + Cash on Arrival | Cash on Arrival (CoA), Deposit + Balance, and Paymob card integration with CoA fallback |

---

## 3. Detailed Booking Funnel Specification

### Step 1: Tour Discovery & Selection
- Tour Card displays:
  - Rating, review count, duration.
  - Lowest price per person.
  - Badges: `Instant Confirmation` (if `tour.instantConfirmation !== false`), `Free cancel ({hours}h)` (if `freeCancellationHours > 0`), `Hotel pickup included` (if `hotelPickupIncluded`).

### Step 2: Date & Option Selection
- Calendar with disabled past dates.
- Time slot selection (if tour supports multiple departures).
- Participant counter (Adults, Children, Infants) with real-time price calculation.

### Step 3: Contact & Logistics Details
- Traveler Name, Phone (with international dial code picker), Email.
- Hotel Pickup details (Hotel Name, Room number if known, or Custom Meeting Point).
- Add-ons (e.g. VIP transfer, quad bike upgrade, photo package).

### Step 4: Payment & Instant Confirmation
- Payment Scheme selector:
  - **Pay on Arrival (Cash to Guide)**: Zero payment friction, instant booking creation.
  - **Pay Online / Deposit**: Secure payment gateway.
- Instant confirmation screen + immediate receipt email + WhatsApp concierge trigger.

---

## 4. Mobile Bottom Drawer & Responsive Design
- Sputnik8 utilizes a fixed sticky bottom bar on mobile:
  - Shows price and `Book Now` CTA.
  - Tapping opens a smooth bottom drawer preserving the current tour context without navigating away.
- Talago aligns with this pattern using responsive modals and sticky mobile action bars in `src/components/tours/` and `src/app/(public)/tours/[slug]/`.


---

## 5. Booking-Centered Messaging Architecture (Reverse-Engineered from Sputnik8)

### Core Model
1. **No Mixed/Aggregated Site Chat**:
   - Sputnik8 does not have a generic global live chat bubble that mixes different inquiries or bookings into one conversation.
   - Every conversation belongs strictly to a specific tour inquiry or a confirmed booking.

2. **Before Booking: Tour-Specific Question**:
   - Entry point: Located directly beside availability calendar ("Ask a question about this tour").
   - Creates a dedicated `BookingLead` with a unique reference number.
   - Spawns a dedicated `LiveChatConversation` with `visitorToken: "lead:<id>"`.
   - Customer and admin communicate specifically about that tour, date, and party size.

3. **Inquiry to Booking Progression**:
   - Travelers can proceed directly from their inquiry in `/account` to checkout via a dedicated "Book Tour" CTA.
   - When checking out, the inquiry reference and message history carry forward to the resulting booking record without creating disjointed threads.

4. **After Booking: Order-Centered Communication**:
   - Direct booking creates a dedicated `LiveChatConversation` with `visitorToken: "booking:<ref>"`.
   - Multiple bookings by the same customer always have separate, clean message threads.
   - Customers access conversation threads via their `/account` Bookings and Messages tabs.
   - Admins operate directly inside `/admin/bookings` with inline chat per booking, keeping operations unified.
