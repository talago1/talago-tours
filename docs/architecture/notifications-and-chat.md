# Notifications & Live Chat Architecture — Talago Tours

## 1. Notification Subsystems & Lifecycles

Talago Tours features two synchronized notification systems:
1. **Admin Notification Center:** Operational alerts (new bookings, payments, inquiries, system events) with audible chimes, real-time unread counts, and priority filters.
2. **Customer Notification & Messages:** Booking confirmations, itinerary updates, and interactive live chat with support.

---

## 2. Portal Layering & Z-Index Architecture

### Problem Solved:
Historically, dropdowns and chat panels rendered inside nested containers were clipped or trapped behind navigation sticky bars (`z-50`) or modals.

### Canonical Pattern:
All floating overlay centers mount directly to `document.body` via `createPortal`:

```tsx
import { createPortal } from 'react-dom';

// In AdminNotificationCenter:
{isOpen && typeof document !== 'undefined' && createPortal(
  <div className="fixed inset-0 z-[9999]">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="fixed top-16 right-4 sm:right-6 w-full max-w-sm sm:max-w-md ...">
      {/* Notification items */}
    </div>
  </div>,
  document.body
)}
```

---

## 3. Deep Linking to Conversations & Bookings

Every notification links directly to its authoritative action target:
- **Booking Alerts:** Deep link to `/admin/bookings?search={bookingReference}`
- **Customer Messages / Live Chat:** Open the exact live conversation in `/account?tab=chat&ref={bookingReference}`
- **Leads:** Link to `/admin/leads?id={leadId}`

---

## 4. Unread State & Persistence

- Read state is tracked in the database on `NotificationLog` (`isRead: boolean`, `readAt: Date`).
- When a user views or marks a notification as read, an optimistic state update immediately clears badges across tabs via `BroadcastChannel('talago_notifications_sync')`.
