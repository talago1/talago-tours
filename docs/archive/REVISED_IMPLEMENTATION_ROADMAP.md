<USER_REQUEST>
# TALAGO — REVISED IMPLEMENTATION ROADMAP

## Objective

Transform the existing TALAGO platform into a global, data-driven experience booking platform while preserving:

* All existing tours
* Existing bookings
* Existing payment flows
* Existing URLs
* Existing multilingual system
* Existing SEO
* Existing reviews
* Existing destination pages
* Existing WhatsApp notifications
* Existing admin functionality

NO blind rewrite.

NO destructive migrations.

NO removal of working features.

The system must become:

ONE global Tour model
ONE Unified Tour Editor
ONE Booking Engine
ONE Pricing Engine
ONE Availability Engine
ONE Route / Itinerary Engine

Egypt is only the initial catalog.

---

# PHASE 0 — SAFETY AUDIT & BASELINE

Before modifying functionality:

1. Inspect the complete current architecture.
2. Inspect database schema.
3. Inspect Prisma/ORM models.
4. Inspect all tour creation flows.
5. Inspect all booking flows.
6. Inspect payment logic.
7. Inspect pickup logic.
8. Inspect current `tourOptions`.
9. Inspect current `itinerary`.
10. Inspect destination/zone relationships.
11. Inspect existing URLs.
12. Inspect current booking records.
13. Inspect review relationships.
14. Inspect multilingual implementation.
15. Inspect admin permissions.

Create a baseline test set for:

* Create tour
* Edit tour
* Publish tour
* Tour page
* Checkout
* Cash payment
* Deposit payment
* Online payment
* Pickup
* WhatsApp notification
* Existing booking
* Existing destination URL
* Existing SEO pages

Do not proceed with destructive changes until this baseline passes.

---

# PHASE 1 — UNIFIED TOUR EDITOR FOUNDATION

## Critical requirement

Remove the separation between:

Quick Create
and
Full Create

There must be ONLY:

Create Tour
Edit Tour

Both must use the same `UnifiedTourEditor`.

Routes:

/admin/tours/new
/admin/tours/[tourId]

must use the same editor component.

---

## IMPORTANT ARCHITECTUR
<truncated 10262 bytes>
tions
✓ Existing payment methods

MOBILE
✓ Admin
✓ Tour page
✓ Checkout
✓ Date picker
✓ Timeline
✓ Booking confirmation

---

# FINAL EXECUTION ORDER

PHASE 0
Audit + Tests

↓

PHASE 1
Unified Editor Foundation

↓

PHASE 2
Global Location Model

↓

PHASE 3
Typed / Validated Tour Data Contracts

↓

PHASE 4
Route + Itinerary Builder

↓

PHASE 5
Guest Types + Pricing

↓

PHASE 6
Availability + Capacity

↓

PHASE 7
Pickup + Meeting Points + Schedule

↓

PHASE 8
Add-ons + Booking Questions

↓

PHASE 9
Completeness + Publishing

↓

PHASE 10
Public Tour Page

↓

PHASE 11
Tour Variants

↓

PHASE 12
Templates

↓

PHASE 13
Globalization

↓

PHASE 14
Multi-day

↓

PHASE 15
Operator

↓

PHASE 16
Initial Tour Catalog

↓

PHASE 17
Final QA

---

# NON-NEGOTIABLE RULES

1. No blind rewrite.
2. No destructive migration.
3. No breaking existing URLs.
4. No breaking existing bookings.
5. No duplicate Create Tour systems.
6. No hardcoded business prices.
7. No hardcoded pickup rules.
8. No hardcoded guest types.
9. No client-side authoritative pricing.
10. No client-side authoritative availability.
11. No fake reviews or operational data.
12. No country-specific architecture.
13. No duplicated business logic.
14. No unvalidated arbitrary JSON for new structures.
15. Every feature must remain editable from Admin where appropriate.

The final product must feel like:

A GLOBAL EXPERIENCE BOOKING PLATFORM

not:

A local Egyptian tour website.

</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-25T06:37:59+03:00.

The user's current state is as follows:
Active Document: d:\talago-tours\TALAGO_MASTER_GLOBAL_TOUR_PLATFORM_PROMPT.md (LANGUAGE_MARKDOWN)
Cursor is on line: 1
Other open documents:
- d:\talago-tours\TALAGO_MASTER_GLOBAL_TOUR_PLATFORM_PROMPT.md (LANGUAGE_MARKDOWN)
- d:\talago-tours\.env (LANGUAGE_UNSPECIFIED)
</ADDITIONAL_METADATA>