# Specification: Unified Notifications & Conversation Architecture

## 1. Existing Behavior and Actual Problem
- Admin and customer notifications were previously fragmented between database logs, in-memory flags, and local storage.
- Clicking a message notification opened a generic bookings list rather than the exact customer inquiry or chat message.
- Ghost badges and unread counters remained stuck even after viewing conversations.

## 2. Desired Behavior
- **Customer Notification Center**:
  - Accessible via the top navbar bell icon.
  - Accurate unread badge count synced across tabs.
  - Clicking a booking notification navigates directly to `/account?tab=bookings&ref={bookingRef}`.
  - Clicking an inquiry/concierge reply navigates directly to `/account?tab=messages&ref={ref}` with the exact chat thread active.
- **Admin Notification Center**:
  - Portal-mounted top-layer component (`z-[9999]`) preventing clipping or stacking context errors.
  - Displays customer name, phone, tour reference, and inquiry excerpt.
  - Actionable direct link to `/admin/bookings?search={ref}` or `/admin/crm`.
  - Single-click "Mark all as read" and persistent read state in database.
- **Bi-directional Live Concierge Sync**:
  - Admin replies automatically trigger customer unread flags and update the timestamp.
  - Customer messages immediately alert admin via the notification feed.

## 3. Source-of-Truth Data and Module Ownership
- **Database Models**: `NotificationLog`, `LiveChatConversation`, `LiveChatMessage`, `Booking`.
- **Admin Component**: `src/components/admin/AdminNotificationCenter.tsx`.
- **Customer Component**: Integrated within `src/app/(public)/account/page.tsx` and Navbar.
- **APIs**:
  - `GET/POST /api/notifications` (Admin notifications).
  - `GET/POST /api/public/live-chat/messages` (Customer chat & admin replies).

## 4. User Journeys & Acceptance Criteria
1. Traveler books a tour or asks an inquiry -> Admin bell increments immediately with notification summary.
2. Admin clicks notification -> opens exact booking detail or live chat modal.
3. Admin replies -> Traveler's account messages tab displays unread reply badge.
4. Traveler opens conversation -> unread badge clears automatically and persists across page reloads.

## 5. Required APIs and Database Relationships
- Models: `NotificationLog` (`id`, `channel`, `recipient`, `templateKey`, `status`, `metadata`, `readAt`, `createdAt`).
- `LiveChatConversation` (`visitorToken`, `bookingReference`, `lastAdminMessage`, `lastAdminMessageAt`, `hasUnreadAdminReply`).

## 6. Validation and Security Requirements
- Admin endpoints protected by `safeTokenCompare` against `ADMIN_API_TOKEN`.
- Customer endpoints scoped strictly to verified `talago_session` or visitor token.

## 7. Required Tests
- `e2e/auth-booking-notifications.spec.ts`: Admin notification portal mount and top-layer visibility test.

## 8. Dependencies & Implementation Order
- Depends on Customer Account and Live Chat session resolution.
