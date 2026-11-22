# Specification: Customer Account & Profile Dashboard

## 1. Existing Behavior and Actual Problem
- The `/account` page suffered from race conditions: if session verification was delayed, the page prematurely flashed "Authentication Required" with a login button.
- Profile editing and booking adoption were separated across different views.
- `/my-bookings` route existed alongside `/account?tab=bookings`, creating duplicate maintenance burdens.

## 2. Desired Behavior
- **Unified Account Portal**: `/account` is the single authoritative hub for travelers, organized into clear tabs:
  1. `Overview`: Fast summary of upcoming trips, quick actions, and concierge support.
  2. `My Bookings`: Active vouchers, upcoming trips, past excursions, and cancellation requests.
  3. `Messages`: Live direct concierge messages linked to bookings or general inquiries.
  4. `Profile`: Name, WhatsApp phone with verified badge, Telegram identity link, and preferences.
  5. `Saved`: Wishlist tours with live prices and direct booking buttons.
- **Zero-Flicker Hydration**: Page displays a polished loader while authentication is being verified; never flashes the unauthenticated view during legitimate session resolution.
- **Automatic Booking Adoption**: Whenever a customer updates their phone or signs in via Telegram/Google, any unlinked bookings matching their verified phone number or email are adopted automatically.
- **Legacy Route Consolidation**: `/my-bookings` permanently issues a lightweight 308 redirect to `/account?tab=bookings`.

## 3. Source-of-Truth Data and Module Ownership
- **Component**: `src/app/(public)/account/page.tsx`.
- **Backend Service**: `src/server/customerBookings.ts` (`adoptOwnedBookings`, `formatUserProfile`).
- **APIs**:
  - `GET /api/public/my-bookings`
  - `PATCH /api/auth/session` (profile updates)
  - `POST /api/public/my-bookings/link` (manual booking claim)

## 4. User Journeys & Acceptance Criteria
1. Signed-in traveler opens `/account` -> Profile loads with traveler name and verified badge.
2. Traveler views upcoming trip -> voucher reference, pickup details, and hotel information are clearly visible.
3. Traveler edits phone number -> updates immediately and automatically links historical bookings matching that phone.
4. Traveler accesses `/my-bookings` -> redirected seamlessly to `/account?tab=bookings`.

## 5. Required APIs and Database Relationships
- Models: `CustomerProfile`, `Booking`, `BookingLead`, `Review`.

## 6. Validation and Security Requirements
- Profile updates validate phone numbers with international prefix (`src/utils/sanitize.ts`).
- Booking lookup requires reference match AND phone number match to prevent ID enumeration.

## 7. Required Tests
- E2E journey for account tabs, profile edit, and booking listing.
