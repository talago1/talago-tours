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

## IMPORTANT ARCHITECTURAL RULE

Do NOT make Phase 1 a UI-only abstraction that gets redesigned later.

The editor must be designed around the final global tour contract.

Create a strongly typed canonical `TourEditorData` interface/schema from the beginning.

Recommended sections:

1. Basic Info
2. Destination & Location
3. Media
4. Pricing
5. Guest Types
6. Availability
7. Schedule
8. Pickup
9. Meeting Point
10. Route
11. Itinerary
12. Activities
13. Transportation
14. Inclusions
15. Exclusions
16. Requirements
17. Accessibility
18. What to Bring
19. Safety
20. Add-ons
21. Booking Questions
22. Cancellation
23. SEO
24. Publishing
25. Advanced
26. Operator / Operations
27. Completeness

Admin may save a Draft at any point.

Advanced configuration must not block Draft creation.

---

# PHASE 2 — GLOBAL LOCATION MODEL

Do this before implementing the final Route/Availability system.

Current:

Zone + Destination

must remain compatible.

Add global location information.

Minimum:

Destination:

* countryCode
* region
* city
* slug
* latitude
* longitude
* timezone

Tour may optionally override:

* countryCode
* region
* city
* latitude
* longitude
* timezone

Otherwise it falls back to Destination.

Use standardized codes where appropriate:

countryCode:
ISO 3166-1 alpha-2

Timezone:
IANA timezone

Example:

EG
Africa/Cairo

or:

IT
Europe/Rome

or:

FR
Europe/Paris

The database MUST NOT assume Egypt.

Existing URLs:

/destinations/[slug]

must continue working.

New structure may support:

/destinations/[country]/[city]

Create redirects where required.

---

# PHASE 3 — STRUCTURED TOUR DATA CONTRACT

Before connecting more UI functionality, define canonical typed schemas.

Use a validation layer such as Zod or the equivalent already used by the project.

At minimum define:

Tour
GuestType
RoutePoint
ItineraryItem
MeetingPoint
PickupOption
TourOption
BookingQuestion
Availability
TourVariant

Do not allow arbitrary unvalidated JSON.

Existing JSON fields may continue to store these structures, BUT they must become versioned and validated.

Example:

itineraryVersion: 1

routeVersion: 1

This avoids future migration problems.

---

# PHASE 4 — ROUTE + ITINERARY BUILDER

Replace the current unstructured itinerary experience.

Admin gets:

Drag & Drop Timeline

Every Route Point supports:

* order
* type
* title
* location
* address
* latitude
* longitude
* arrival time
* departure time
* duration
* description
* image
* notes

Types:

START
PICKUP
MEETING_POINT
TRANSFER
ATTRACTION
ACTIVITY
MEAL
PHOTO_STOP
FREE_TIME
REST_STOP
CHECKPOINT
END

---

## Public Tour Page

Render structured data as:

Visual timeline

and optionally:

Interactive route map

If coordinates exist.

Never rely only on raw itinerary text.

---

# PHASE 5 — GUEST TYPES + PRICING ENGINE

Replace hardcoded:

Adult
Child
Infant

with configurable guest types.

Tour can define:

Adult
Child
Infant
Teen
Senior
Certified Diver
Beginner Diver
etc.

Each guest type:

* id
* label
* minAge
* maxAge
* price
* required
* minQuantity
* maxQuantity

Checkout must render guest types dynamically.

---

## Pricing

Pricing must be server-authoritative.

Support:

* base price
* per-person
* per-group
* guest-type prices
* discount
* deposit
* fixed deposit
* percentage deposit
* currency
* optional fees

Do NOT trust prices from the browser.

The server calculates final total.

---

# PHASE 6 — DATE AVAILABILITY + CAPACITY

This phase should be implemented early because the booking engine depends on it.

Create Availability model.

Minimum:

tourId
date
status
capacity
priceOverride
notes

Status:

AVAILABLE
SOLD_OUT
CLOSED
WEATHER_CANCELLED
PRIVATE_EVENT
BLACKOUT

Support:

* recurring days
* specific dates
* blackout dates
* seasonal periods
* capacity
* date-specific pricing
* departure times
* pickup times

---

## CRITICAL BOOKING SAFETY

Availability must be protected from race conditions.

Booking creation must use a transaction / atomic capacity operation.

Never:

1. Read capacity
2. Wait
3. Write capacity

without concurrency protection.

Use safe transactional logic.

Prevent:

* overbooking
* double submission
* duplicate payment callback
* duplicate booking from browser refresh

Add booking idempotency where appropriate.

---

# PHASE 7 — SCHEDULE + PICKUP + MEETING POINT

Create a unified structured system.

Support:

No Pickup
Meeting Point
Hotel Pickup
Airport Pickup
Port Pickup
Station Pickup
Private Address

Pickup zone must support:

* zone name
* location
* fee
* pickup window
* instructions
* availability

Meeting Point:

* type
* address
* coordinates
* landmark
* instructions
* map reference
* optional image

Do not assume that every global tour has hotel pickup.

---

# PHASE 8 — ADD-ONS + BOOKING QUESTIONS

Connect existing `tourOptions` to checkout.

Add:

Tour Add-ons

Each:

* id
* title
* description
* price
* pricing model
* optional/required
* availability

Checkout:

Guests
→ Pickup
→ Add-ons
→ Questions
→ Payment

---

## Booking Questions

Dynamic per-tour questions:

Text
Number
Phone
Select
Radio
Checkbox
Date

Each:

* id
* label
* type
* required
* options

Store the answers inside the booking record.

---

# PHASE 9 — PUBLISHING + COMPLETENESS

Admin receives:

Tour Completeness

Example:

Basic Information ✓
Media ✓
Pricing ✓
Location ✓
Route ✓
Itinerary ✓
Availability ✓
Pickup ✓
Booking ✓
Cancellation ✓
SEO ✓

Draft can always save.

Publish requires production-critical fields.

Statuses:

Draft
Active
Hidden
Coming Soon
Archived

Public APIs must return only active/public tours.

---

# PHASE 10 — PUBLIC TOUR PAGE

Upgrade the tour detail page to international marketplace standard.

Top area:

* gallery
* title
* destination
* rating
* duration
* language
* group size
* cancellation
* price
* availability
* booking widget

Then:

Overview
Highlights
Route
Map
Itinerary
Pickup
Meeting Point
Included
Excluded
Requirements
Accessibility
What to Bring
Important Information
Safety
Cancellation
Reviews
FAQ
Related Tours

Hide empty sections.

---

# PHASE 11 — TOUR VARIANTS

Add:

TourVariant

Examples:

Standard
VIP
Private
Shared
Sunrise
Sunset

Each variant may have:

* price
* capacity
* itinerary
* inclusions
* duration
* pickup
* availability

Avoid duplicate tours when the difference can be represented by a variant.

---

# PHASE 12 — TEMPLATE LIBRARY

After the Unified Editor is stable:

Create reusable templates.

Examples:

Boat Tour
Safari
City Tour
Museum Tour
Walking Tour
Diving Tour
Snorkeling Tour
Private Tour
Day Trip
Multi-Day Tour
Food Tour
Water Sport
Cultural Experience

Template action:

Create from Template

MUST:

1. Create a Draft Tour
2. Populate fields
3. Open the SAME Unified Tour Editor
4. Allow full editing
5. Save/Publish normally

Templates are NOT a second creation workflow.

---

# PHASE 13 — GLOBAL PRODUCT MODEL

The system must support tours outside Egypt without code changes.

Do NOT create:

EgyptTour
HurghadaTour
RedSeaTour

Create:

Tour

Global entities:

Tour
Destination
Country
Region
City
RoutePoint
Availability
GuestType
TourVariant
Activity
Transportation
MeetingPoint
PickupZone
Operator

Regional differences are data.

Not separate code.

---

# PHASE 14 — MULTI-DAY SUPPORT

Implement after the one-day architecture is stable.

Support:

Day 1
Day 2
Day 3
etc.

Each day:

* route
* itinerary
* meals
* accommodation
* transportation
* activities
* notes

---

# PHASE 15 — OPERATOR / OPERATIONS MODEL

Implement after core booking is stable.

Admin-only operator data:

* supplier
* guide
* driver
* captain
* vehicle
* emergency contact
* backup operator
* internal notes
* operational instructions

Keep sensitive operational information private.

---

# PHASE 16 — SEED TALAGO INITIAL GLOBAL CATALOG

Only after the core system works correctly.

Create the initial Egypt catalog as editable Draft/Active records.

Marsa Alam:

* Super Safari
* Marsa Mubarak
* Sataya Dolphin Reef
* Hamata Islands
* Abu Dabbab
* Sea Scope
* Nefertari
* Wadi El Gemal
* Elphinstone Reef
* Luxor
* Cairo + Grand Egyptian Museum

Hurghada:

* Orange Bay
* Paradise Island
* Dolphin House
* Giftun Island
* Mahmya
* Magawish
* Utopia
* Sharm El Naga
* Sea Scope
* Nefertari
* Parasailing
* Super Safari
* Diving
* Snorkeling
* Private Speedboat
* Luxor
* Cairo + Grand Egyptian Museum

Sharm El Sheikh:

* Ras Mohammed
* White Island
* Tiran Island
* Sea Scope
* Nefertari
* Parasailing
* Super Safari
* Quad Bike
* Bedouin Dinner
* Dahab
* Blue Hole
* Colored Canyon
* Mount Sinai
* Saint Catherine
* Cairo
* Diving
* Private Yacht

IMPORTANT:

Seed realistic product structures.

Do NOT create fake:

* reviews
* ratings
* bookings
* availability
* prices
* credentials
* guaranteed wildlife sightings

Unknown operational values must remain editable Draft values.

---

# PHASE 17 — GLOBAL QUALITY & QA

Before production release test:

TOUR CREATION
✓ Create
✓ Save Draft
✓ Edit
✓ Preview
✓ Publish

BOOKING
✓ Date
✓ Guest Types
✓ Availability
✓ Pickup
✓ Meeting Point
✓ Add-ons
✓ Questions
✓ Pricing
✓ Deposit
✓ Cash
✓ Online Payment

CAPACITY
✓ Available
✓ Limited
✓ Sold Out
✓ Overbooking prevention

GLOBAL
✓ Egypt
✓ Another country test record
✓ Currency
✓ Timezone
✓ Language
✓ No-pickup tour
✓ Meeting-point tour

BACKWARD COMPATIBILITY
✓ Existing tours
✓ Existing bookings
✓ Existing reviews
✓ Existing URLs
✓ Existing destinations
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