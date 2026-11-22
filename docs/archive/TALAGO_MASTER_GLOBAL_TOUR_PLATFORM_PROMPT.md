# TALAGO MASTER — GLOBAL TOUR PLATFORM UPGRADE PROMPT

## Purpose

You are working on the existing TALAGO Tours website and its admin/booking system. Upgrade the current product into a production-ready global experience marketplace without rebuilding the application blindly or breaking existing functionality.

The current TALAGO website is an established tourism platform with customer-facing tour discovery, tour details, booking, pricing, pickup and payment concepts. Preserve what already works and refactor toward a unified, scalable architecture.

The most important architectural rule is:

**There must be ONE unified Tour Creation / Edit system.**

Do not keep separate Quick Creation and Full Creation workflows. Merge them into one tour editor containing every business, content, operational, pricing, availability, booking and SEO setting.

Egypt, Hurghada, Marsa Alam and Sharm El Sheikh are the initial catalog only. The platform must be destination-agnostic and ready for tours in any country or city without changing the core architecture.

---

# 1. EXISTING PRODUCT PRESERVATION

1. Inspect the current application before making structural changes.
2. Identify the current frontend routes, backend/API routes, database models, tour schema, booking schema, payment flow, admin routes, Quick Create, Full Create, availability logic and pickup logic.
3. Reuse existing components and services where practical.
4. Do not delete working functionality simply to simplify the code.
5. Do not remove existing tours, reviews, payments or URLs.
6. Use backward-compatible migrations when possible.
7. Preserve existing data.
8. If two systems contain overlapping data, map them into one unified model before removing duplication.
9. Never create a parallel second source of truth for tour prices, availability or business rules.

# 2. CORE ARCHITECTURE

TALAGO must behave like a global experience-booking platform, not a website hardcoded around one city or one country.

The architecture must be built around generic entities such as:

- Tour
- TourVariant
- Destination
- Country
- Region / State / Province
- City
- Category
- Activity
- Route
- RoutePoint
- ItineraryItem
- MeetingPoint
- PickupZone
- PickupOption
- PickupTime
- Availability
- GuestType
- AddOn
- BookingQuestion
- Booking
- BookingGuest
- Payment
- Review
- Operator
- SiteSettings
- Currency
- Tax / Fee configuration

Do not create Egypt-specific core models such as `EgyptTour`, `HurghadaPickup` or `RedSeaActivity`. These are data values, not architectural types.

# 3. MERGE QUICK CREATE + FULL CREATE

Remove the conceptual split between:

- Quick Create
- Full Create / Normal Create

There must be exactly one:

**Create Tour**

and one:

**Edit Tour**

experience.

The unified editor must contain every field from both previous systems.

Quick creation should remain available only as a fast path inside the same editor:

- show essential fields first
- allow Save Draft quickly
- progressively configure advanced sections later
- never create a separate data model
- never duplicate logic
- never require creating a tour in one system and completing it elsewhere

ONE TOUR = ONE COMPLETE CONFIGURATION.

# 4. UNIFIED TOUR EDITOR

Create a master tour editor organized into clear sections or tabs:

1. Basic Information
2. Identity & Categories
3. Destination & Location
4. Images & Media
5. Pricing
6. Guest Types
7. Tour Variants
8. Availability
9. Schedule & Pickup Times
10. Pickup & Meeting Points
11. Route Builder
12. Itinerary Builder
13. Activities
14. Included
15. Excluded
16. Requirements
17. Restrictions
18. Accessibility
19. Safety
20. Transportation
21. Guide / Language
22. Meals
23. Tickets / Entry Fees
24. Add-ons
25. Booking Questions
26. Cancellation
27. Weather / Conditions
28. Booking Rules
29. Operator Information
30. Reviews / Social Proof
31. SEO
32. Publishing / Visibility
33. Advanced / Operational Playbook

Use tabs, accordions or grouped sections so the editor remains usable.

The admin must be able to open one tour and reach every configuration from this single Edit Tour screen.

# 5. BASIC TOUR INFORMATION

Support:

- Title
- Short title
- Slug
- Short description
- Full description
- Primary category
- Secondary categories
- Activity types
- Destination
- Tags
- Status
- Draft / Published / Hidden / Coming Soon / Archived
- Featured
- Best Seller
- Recommended
- VIP
- Private
- Family Friendly
- New
- Limited Availability
- Promotional badge

Badges must be data-driven and editable, not hardcoded.

# 6. GLOBAL LOCATION MODEL

Every location must support:

- Country
- Region / State / Province
- City
- District / Area
- Address
- Latitude
- Longitude
- Timezone

The same schema must work for:

- Hurghada, Egypt
- Marsa Alam, Egypt
- Sharm El Sheikh, Egypt
- Rome, Italy
- Paris, France
- Dubai, UAE
- New York, USA
- Tokyo, Japan

No code change should be required to add a new country or city.

# 7. DESTINATIONS

Create data-driven destination management.

A destination can have:

- Name
- Slug
- Country
- Region
- City
- Description
- Hero image
- SEO title
- SEO description
- Coordinates
- Published/hidden state

Frontend destination pages must pull real tours dynamically.

If a destination has zero active tours, hide empty sections or show an intentional Coming Soon state. Never advertise a live destination with an unexplained “0 tours” state.

# 8. MEDIA MANAGEMENT

Every tour supports:

- Main image
- Gallery
- Thumbnail
- Optional video
- Image alt text
- Image ordering
- Featured image

Support drag-and-drop ordering if the current stack allows it.

Optimize images and use responsive formats.

Do not use random demo images in production.

# 9. PRICING ENGINE

Support:

- Adult price
- Child price
- Infant price
- Teen price
- Senior price
- Custom guest types
- Per-person pricing
- Per-group pricing
- Minimum participants
- Maximum participants
- Base currency
- Original price
- Discounted price
- Fixed discount
- Percentage discount
- Taxes
- Service fees
- Booking fees
- Date-based pricing
- Season-based pricing
- Weekend pricing
- Holiday pricing

Never hardcode business prices into UI components.

The database/backend must be the source of truth.

Do not trust client-side totals for final payment.

# 10. GUEST TYPES

Guest types must be configurable per tour.

Examples:

- Adults
- Children 3–11
- Infants 0–2
- Teens
- Seniors
- Certified Diver
- Beginner Diver

Admin can:

- create guest type
- set age range
- set price
- make required/optional
- set quantity limits

The booking total updates dynamically.

# 11. TOUR VARIANTS

A single tour can have variants instead of unnecessary duplicate tours.

Examples:

- Standard
- VIP
- Private
- Shared
- Private Vehicle
- Morning
- Afternoon
- Sunrise
- Sunset
- Premium

Each variant may have its own:

- price
- duration
- itinerary
- capacity
- pickup
- inclusions
- cancellation policy
- availability

# 12. DATE SELECTION

Date selection is mandatory for bookable tours unless the tour is explicitly configured as a request-based or flexible-schedule product.

Booking flow should support:

DATE → TIME → GUESTS → PICKUP / MEETING POINT → OPTIONS → PAYMENT

Admin controls:

- start date
- end date
- recurring days
- blackout dates
- seasonal ranges
- specific available dates
- specific unavailable dates
- minimum booking notice
- same-day booking allowed/disabled
- maximum booking window

Calendar must disable unavailable dates.

# 13. AVAILABILITY & CAPACITY

Support:

- unlimited capacity
- fixed capacity
- per-departure capacity
- per-variant capacity
- sold out
- limited availability
- available
- unavailable
- on request

Prevent overbooking.

Show “Only X spots left” only when based on actual capacity data.

# 14. OPERATING MODE

Each tour can be:

- Fixed Departure
- Flexible Departure
- On Request
- Private Schedule

Fixed departure: fixed start times.

Flexible: customer selects from configured availability.

On Request: requires operator approval.

Private schedule: customer selects or requests a custom time.

# 15. PICKUP SYSTEM — GLOBAL

Pickup must never be assumed to exist.

Supported modes:

- No pickup
- Meeting point only
- Hotel pickup
- Airport pickup
- Port pickup
- Train station pickup
- Private address pickup
- Multiple pickup options

Each pickup zone can define:

- zone name
- country/city/area
- fee
- currency
- pickup window
- pickup instructions
- restrictions
- optional hotel list

Example Egypt default rules can be configured, but must NOT be hardcoded:

- Hurghada: Free
- Makadi Bay: +€5
- Sahl Hasheesh: +€5
- El Gouna: +€10
- Soma Bay: +€10
- Safaga: +€10

These are configurable defaults and can be overridden per tour.

For hotel pickup, support:

- hotel/resort name
- room number when necessary
- pickup location
- pickup zone
- pickup time
- special instructions

Default instruction can be:

“Please wait at the main hotel entrance / main gate 10 minutes before pickup.”

But every tour must be able to customize this.

# 16. PICKUP TIME MANAGEMENT

A tour may have multiple pickup times.

Admin can:

- add time
- remove time
- select default time
- disable specific time slots for specific dates

Available pickup times must come from tour configuration.

# 17. MEETING POINT SYSTEM

Support a dedicated meeting point object with:

- exact address
- landmark
- building name
- gate
- terminal
- pier
- marina
- airport
- station
- hotel lobby
- map coordinates
- instructions
- photos
- contact person
- phone

Types:

HOTEL, AIRPORT, PORT, MARINA, TRAIN_STATION, BUS_STATION, LANDMARK, RESTAURANT, OFFICE, PRIVATE_ADDRESS, OTHER

A tour may have pickup + meeting point, meeting point only, or pickup only.

# 18. ROUTE BUILDER

Create a real route builder, not a plain text box.

Each route point must support:

- order
- stop name
- type
- location
- address
- latitude
- longitude
- map reference
- arrival time
- departure time
- duration
- description
- image
- internal note

Types:

START
PICKUP
MEETING_POINT
TRANSFER
ATTRACTION
ACTIVITY
MEAL
REST_STOP
PHOTO_STOP
FREE_TIME
CHECKPOINT
END

Example:

Hotel Pickup → Marina → Boat Departure → Snorkeling Site 1 → Lunch → Island → Snorkeling Site 2 → Marina → Hotel Drop-off

# 19. INTERACTIVE TOUR MAP

Every tour may optionally have a map.

Show:

- start
- pickup area
- meeting point
- attractions
- activities
- end point

Use latitude/longitude where available.

Allow Admin to override map coordinates.

Support approximate locations when exact coordinates should not be public.

# 20. ITINERARY BUILDER

Itinerary must be structured data.

Each item supports:

- time
- duration
- title
- location
- description
- activity type
- transportation
- included/excluded
- optional/required
- image
- notes

Example:

08:00 — Hotel pickup
09:00 — Marina arrival
09:30 — Boat departure
10:30 — Snorkeling
12:30 — Lunch
14:00 — Island visit
16:00 — Return to marina
17:00 — Hotel drop-off

Allow Admin override of calculated duration.

# 21. TIMELINE UI

Render the itinerary on the public page as a clean visual timeline using actual data.

Do not hardcode timeline entries.

# 22. ACTIVITIES

Activity types can include:

- Snorkeling
- Diving
- Hiking
- Museum Visit
- Walking Tour
- Boat Cruise
- Safari
- Zipline
- Food Tasting
- Cooking Class
- Photography
- Wildlife Viewing
- Beach
- Water Sports
- Cultural Experience
- Historical Visit
- Nature Experience

Each activity may define:

- duration
- intensity
- minimum age
- skill level
- equipment
- instructor
- safety requirements
- included/optional status

# 23. DURATION

Store duration structurally, not only as text.

Support:

- total hours
- total minutes
- travel duration
- activity duration
- meal duration
- free time

Display friendly text such as “10 hours” based on structured data.

# 24. TRANSPORTATION

Support:

- walking
- taxi
- private car
- minivan
- bus
- coach
- train
- metro
- tram
- boat
- ferry
- yacht
- speedboat
- jeep
- quad bike
- aircraft
- bicycle
- motorcycle
- other

Each segment may define:

- duration
- included/optional
- capacity
- accessibility
- safety notes

# 25. LANGUAGES & GUIDE

Support multiple languages:

English, Arabic, Russian, German, French, Spanish, Italian, Polish, Chinese, Dutch, Greek, Turkish and more.

Guide modes:

- live guide
- audio guide
- self-guided
- driver/guide
- no guide

Support guide language and type.

Only show verified professional qualifications.

# 26. GROUP SIZE

Support:

- minimum participants
- maximum participants
- private group
- shared group
- small group
- per-departure capacity

Public copy must be generated from actual data.

# 27. ACCESSIBILITY

Each tour must support:

- wheelchair accessible
- partially accessible
- not wheelchair accessible
- stroller accessible
- service animals allowed/not allowed
- accessible transportation
- accessible restroom
- walking required
- stairs required
- uneven terrain
- accessibility notes

Never hide accessibility information.

# 28. REQUIREMENTS & RESTRICTIONS

Support:

- minimum age
- maximum age
- infant allowed
- child allowed
- pregnancy policy
- physical requirements
- swimming ability
- diving certification
- passport/ID requirement
- driver license requirement
- medical restrictions

Separate Requirements from Restrictions.

Do not generate medical claims automatically. Safety/health text must be editable and reviewed by the operator.

# 29. WHAT TO BRING

Support unlimited items such as:

- passport
- swimwear
- sunscreen
- walking shoes
- water
- jacket
- camera
- valid diving certification
- comfortable clothes

# 30. SAFETY

Support:

- safety information
- required equipment
- qualified staff where actually true
- emergency procedure
- emergency contact
- weather conditions
- sea conditions
- activity restrictions

Only display verified claims.

# 31. WEATHER & CONDITIONS

Every outdoor/sea/air activity must support:

- weather dependent yes/no
- sea conditions dependent yes/no
- reschedule policy
- weather cancellation policy
- alternative activity
- customer notification procedure

Never guarantee wildlife sightings or weather conditions.

# 32. SEASONAL AVAILABILITY

Support:

- year-round
- seasonal months
- specific date ranges
- weekdays
- special dates
- blackout dates

# 33. OPERATING CALENDAR

Each date can be:

- available
- sold out
- closed
- weather cancelled
- private event
- maintenance
- holiday
- blackout

Each date can have:

- capacity
- departure times
- pickup times
- price override

# 34. DATE-SPECIFIC PRICING

Support season/weekend/holiday/date pricing overrides.

Examples:

+10%
+€20
-15%

Pricing must be calculated from backend data.

# 35. INCLUSIONS / EXCLUSIONS

Repeatable lists for:

What’s Included
What’s Excluded

Admin can add/remove/reorder.

# 36. MEALS

Support:

- breakfast
- lunch
- dinner
- snacks
- drinks

Each can be:

- included
- optional
- excluded

Also support dietary options.

# 37. TICKETS / ENTRY FEES

For attractions, define:

- ticket included
- ticket excluded
- ticket purchased on site
- ticket purchased online
- ticket required
- ticket optional

Never claim skip-the-line/priority access unless actually offered.

# 38. ADD-ONS / EXTRAS

Each tour can have:

- private transfer
- photography
- video
- lunch upgrade
- private guide
- VIP option
- equipment upgrade
- extra activity
- entry ticket
- insurance where available

Each add-on supports:

- name
- description
- price
- currency
- pricing model
- required/optional
- availability

# 39. BOOKING QUESTIONS

Admin can add tour-specific questions.

Types:

- text
- number
- dropdown
- radio
- checkbox
- date
- phone

Examples:

- hotel name
- room number
- passport name
- diving certification
- food preference
- WhatsApp number
- special request

Each can be required/optional.

# 40. CANCELLATION

Support configurable policies:

- free cancellation 24h
- free cancellation 48h
- partial refund
- non-refundable
- custom policy

Show the actual tour policy on the product page and booking confirmation.

# 41. BOOKING RULES

Support:

- minimum booking notice
- maximum advance window
- same-day booking
- cut-off time
- instant confirmation
- pending confirmation
- operator confirmation required
- no-show policy
- late arrival policy

# 42. PAYMENT METHODS

Each tour controls enabled methods:

1. Full online payment
2. Deposit
3. Cash on arrival
4. Other supported methods

Deposit can be:

- percentage
- fixed amount

Do not hardcode 20%.

Checkout must show:

Total
Due now
Remaining balance
Payment method

# 43. CURRENCY / TAX / FEES

Support globally:

USD
EUR
GBP
EGP
AED
SAR
RUB
and other currencies.

Support:

- base price
- display currency
- tax
- service fee
- booking fee
- discount
- deposit
- final total

Do not assume taxes are identical worldwide.

# 44. CHECKOUT

Checkout flow:

1. Tour summary
2. Date
3. Guests
4. Pickup / Meeting Point
5. Contact information
6. Add-ons
7. Payment method
8. Price breakdown
9. Confirmation

Required:

- full name
- email
- phone/WhatsApp
- country

Optional:

- special requests

Validate server-side and client-side.

# 45. BOOKING CONFIRMATION

Generate unique booking IDs, e.g.:

TALAGO-2026-000123

Show:

- tour
- date
- pickup time
- meeting point
- guests
- add-ons
- payment method
- amount paid
- remaining balance
- cancellation policy
- support contact

# 46. VOUCHER

Create a printable/downloadable/mobile booking voucher with:

- TALAGO branding
- booking ID
- tour
- date
- pickup/meeting point
- guest count
- payment status
- amount paid
- remaining balance
- contact information
- cancellation policy

# 47. ADMIN BOOKINGS

Booking statuses:

- pending
- confirmed
- paid
- partially paid
- cash on arrival
- completed
- cancelled
- refunded

Filters:

- date
- tour
- destination
- payment
- status
- pickup zone

# 48. ADMIN TOUR DASHBOARD

Tour list should show:

- tour
- destination
- category
- price
- status
- bookings
- availability
- rating
- created date

Actions:

- edit
- duplicate
- preview
- publish/unpublish
- archive

# 49. TOUR TEMPLATES

Create a Template Library, but do not create another Quick Create system.

Templates are shortcuts that instantiate a normal Tour record and immediately open it in the Unified Tour Editor.

Useful templates:

- City Tour
- Walking Tour
- Museum Tour
- Boat Tour
- Snorkeling Trip
- Diving Trip
- Safari
- Desert Tour
- Food Tour
- Cooking Class
- Adventure Activity
- Wildlife Experience
- Day Trip
- Multi-Day Tour
- Airport Transfer
- Private Transfer
- Private Tour
- Group Tour
- Shore Excursion
- Cruise Excursion
- Water Sport
- Cultural Experience
- Historical Tour
- Nature Tour
- Photography Tour

# 50. GLOBAL TOUR PRODUCT PAGE

The public tour page should contain, when data exists:

- Hero gallery
- Tour title
- destination
- rating/reviews
- duration
- language
- group size
- cancellation
- price
- booking widget
- overview
- highlights
- route/map
- itinerary timeline
- pickup/meeting point
- included
- excluded
- requirements
- accessibility
- what to bring
- important information
- safety
- cancellation
- reviews
- FAQ
- related experiences

Hide empty sections rather than showing blanks.

# 51. BOOKING WIDGET

The booking widget must be data-driven and dynamic.

Customer can select:

- date
- time
- guests
- pickup zone
- hotel name
- meeting point
- extras
- payment method

Price breakdown example:

Adult x 2
Child x 1
Pickup fee
Add-ons
Discount
Total

If deposit:

Due today
Remaining balance

# 52. GLOBAL TIMEZONE

Every tour location has a timezone.

Store timestamps safely and show times in the experience’s local timezone.

# 53. MULTI-DAY TOUR SUPPORT

Support:

- hours
- one day
- multiple days

For multi-day tours:

Day 1 / Day 2 / Day 3...

Each day can have:

- itinerary
- transportation
- meals
- accommodation
- activities
- notes

# 54. OPERATOR MODEL

Operator data is separate from tour data.

Support:

- name
- description
- city/country
- address
- phone
- email
- website
- languages
- public contact
- emergency contact
- verified licenses/certifications where applicable

Never expose private operator data publicly.

# 55. INTERNAL OPERATIONAL PLAYBOOK

Admin-only data may include:

- supplier
- driver
- captain
- guide
- vehicle
- backup vehicle
- backup guide
- departure port
- emergency procedure
- emergency contact
- daily notes
- weather decision
- special operational instructions

This is not necessarily public.

# 56. CONTENT COMPLETENESS

Create an internal Admin completeness indicator.

Check:

Basic info
Images
Pricing
Availability
Meeting point
Pickup
Route
Itinerary
Inclusions
Exclusions
Requirements
Accessibility
Cancellation
SEO
Safety

Do not show a fabricated quality score to customers.

# 57. HOMEPAGE

Keep TALAGO’s premium identity and existing structure.

Improve the search so it is functional and connected to actual tour data.

Support:

- destination
- date
- guests
- activity/category

Dynamic sections:

- Best Sellers
- Hurghada Experiences
- Marsa Alam Experiences
- Sharm El Sheikh Experiences
- Private Experiences
- Sea Adventures
- Safari & Desert
- Cultural Egypt
- Family Experiences

Admin controls which tours are featured.

Do not hardcode tour IDs into homepage sections.

# 58. FILTERS / DISCOVERY

Tour listing filters should be data-driven:

- destination
- category
- activity
- price
- duration
- private/shared
- pickup
- language
- rating
- date availability

Mobile filters must be easy to use.

# 59. TRUST & REVIEWS

Support:

- verified booking reviews
- rating
- review count
- review date
- language
- verified badge
- external review link when available

Never fabricate reviews, ratings or booking counts.

Trust claims must be factual and configurable.

# 60. WHATSAPP / CONTACT

Support:

- WhatsApp
- phone
- email
- live chat
- SMS
- emergency contact

WhatsApp is a primary channel for many travel markets, but do not make the global architecture dependent on WhatsApp.

Pre-fill useful booking context where possible.

# 61. FOOTER

Include:

- About
- Tours
- Destinations
- Contact
- WhatsApp
- FAQ
- Cancellation Policy
- Terms
- Privacy
- Refund Policy
- Cookie Policy
- Phone
- Email
- Location
- Social links

Make business contact values configurable globally.

# 62. MULTILINGUAL

Prepare for:

- English
- Arabic
- Russian
- German
- French
- Spanish
- Italian
- Polish
- Chinese
- more in future

Architecture must support:

- RTL for Arabic
- translated UI
- translated tour content
- translated booking flow
- translated errors
- translated emails
- translated confirmation

Do not hardcode translatable UI strings inside deep components.

# 63. SEO

Every tour supports:

- SEO title
- SEO description
- canonical URL
- slug
- Open Graph title
- Open Graph description
- social image
- alt text

Create scalable:

- sitemap
- robots.txt
- canonical URLs
- breadcrumbs
- appropriate structured data

Destination pages must also be SEO-ready.

# 64. URL STRUCTURE

Use generic structures such as:

/destinations/egypt/hurghada
/destinations/egypt/marsa-alam
/destinations/italy/rome
/destinations/france/paris

/tours/marsa-mubarak-snorkeling
/tours/colosseum-guided-tour
/tours/paris-food-tour

Do not hardcode Egypt-specific routes.

# 65. PERFORMANCE

Optimize:

- images
- lazy loading
- code splitting
- queries
- repeated API calls
- mobile performance

Avoid unnecessary dependencies.

# 66. ACCESSIBILITY

Support:

- keyboard navigation
- focus states
- accessible labels
- semantic HTML
- proper contrast
- screen readers
- meaningful form errors
- meaningful buttons
- useful image alt text

# 67. RESPONSIVE DESIGN

Fully support:

- mobile
- tablet
- laptop
- desktop

Pay special attention to:

- booking widget
- calendar
- guest selector
- filters
- gallery
- checkout
- admin tour editor
- admin tables

Consider a sticky mobile “Book Now” CTA.

# 68. SECURITY

Never trust client-side:

- price
- availability
- capacity
- payment total
- guest count

Validate important data server-side.

Protect admin routes.

Prevent duplicate bookings and manipulated totals.

Do not expose secrets.

# 69. NO HARDCODED BUSINESS LOGIC

Do not hardcode:

- prices
- pickup fees
- pickup times
- guest types
- cancellation rules
- payment methods
- categories
- destinations
- tour content
- availability
- business contacts

Business values must be stored/configured.

Static UI labels can remain in code.

# 70. CENTRAL BUSINESS SETTINGS

Create centralized settings for:

- company name
- logo
- email
- phone
- WhatsApp
- default currency
- default cancellation policy
- default pickup rules
- default guest types
- default payment methods
- social links
- booking settings

Tours can override defaults.

# 71. PREVIEW

Add “Preview Tour” from Admin.

Preview must use the same data as the public page and show the actual configured:

- content
- gallery
- price
- availability
- pickup
- route
- itinerary
- booking widget

# 72. ERROR / LOADING STATES

Design polished states for:

- no tours
- no available dates
- sold out
- payment failed
- booking failed
- network error
- invalid date
- invalid guest count
- unavailable pickup zone
- expired session

Never show raw technical errors to customers.

Use skeletons/loading states to avoid layout jumps.

# 73. GLOBAL TOUR SEED CATALOG

Populate TALAGO with a substantial initial catalog as editable Tour records.

Do not create fake reviews, fake bookings, fake availability, fake certificates or unverified claims.

If exact operational data is unknown, create the tour as Draft and make the values editable / marked for internal verification.

## Marsa Alam

Create at minimum:

1. Marsa Alam Super Safari
2. Marsa Mubarak Snorkeling Trip
3. Sataya Dolphin Reef / Sataya Dolphin House
4. Hamata Islands Snorkeling Trip
5. Abu Dabbab Bay Snorkeling
6. Royal Sea Scope Marsa Alam
7. Nefertari Pharaonic Sea Experience Marsa Alam
8. Luxor — Valley of the Kings & Queens from Marsa Alam
9. Cairo & Grand Egyptian Museum from Marsa Alam
10. Wadi El Gemal National Park
11. Elphinstone Reef Diving
12. Marsa Shuna Snorkeling where operationally available

For wildlife experiences, never guarantee animals.

## Hurghada

Create at minimum:

1. Orange Bay Island
2. Paradise Island
3. Dolphin House Snorkeling
4. Dolphin House Private Speedboat
5. Giftun Island Snorkeling
6. Mahmya Island
7. Magawish Island
8. Utopia Island
9. Sharm El Naga Snorkeling
10. Royal Sea Scope / Semi-Submarine
11. Nefertari Pharaonic Cruise
12. Parasailing Hurghada
13. Hurghada Super Safari
14. Quad Bike Safari
15. Bedouin Village Safari
16. Private Speedboat — Orange Bay
17. Private Speedboat — Dolphin House
18. Luxor Day Trip from Hurghada
19. Cairo & Grand Egyptian Museum from Hurghada
20. Introductory Scuba Diving
21. Diving Discovery Experience
22. Snorkeling Boat Trip
23. Water Sports / Banana Boat / Sofa Boat where available
24. Glass Boat / Submarine where available

## Sharm El Sheikh

Create at minimum:

1. Ras Mohammed & White Island
2. Ras Mohammed National Park
3. Tiran Island Snorkeling
4. Sea Scope / Semi-Submarine
5. Nefertari / Pharaonic Sea Experience where available
6. Parasailing Sharm El Sheikh
7. Sharm El Sheikh Super Safari
8. Quad Bike Safari
9. Bedouin Dinner & Show
10. Dahab & Blue Hole
11. Colored Canyon & Dahab
12. Mount Sinai Sunrise
13. Saint Catherine Monastery
14. Cairo Day Trip from Sharm El Sheikh
15. Petra / Jordan Day Trip where operationally available
16. Introductory Scuba Diving
17. Ras Mohammed Diving
18. Private Boat / Yacht Charter
19. Tiran Diving Trip
20. Sharm Snorkeling Boat Trip
21. Water Sports where available

# 74. OTHER POPULAR EXPERIENCE IDEAS

Also support these concepts as future or initial draft products where operationally relevant:

Marsa Alam:
- Dolphin House / Shaab Samadai
- Marsa Shuna
- Abu Dabbab
- Elphinstone Reef
- Wadi El Gemal
- Hamata Islands
- Sataya
- Marsa Mubarak
- Desert Safari
- Quad Bike
- Camel Ride
- Luxor
- Cairo + Grand Egyptian Museum

Hurghada:
- Orange Bay
- Paradise Island
- Dolphin House
- Giftun Island
- Mahmya
- Magawish
- Utopia
- Sharm El Naga
- Sea Scope
- Nefertari
- Parasailing
- Banana Boat
- Sofa Boat
- Glass Boat
- Submarine
- Safari
- Quad Bike
- Bedouin Dinner
- Luxor
- Cairo + Grand Egyptian Museum
- Private Speedboat
- Diving

Sharm El Sheikh:
- Ras Mohammed
- White Island
- Tiran
- Sea Scope
- Nefertari / Pharaonic sea experience where available
- Parasailing
- Water Sports
- Quad Bike
- Super Safari
- Bedouin Dinner
- Dahab
- Blue Hole
- Colored Canyon
- Mount Sinai
- Saint Catherine Monastery
- Cairo
- Petra / Jordan where available
- Diving
- Private Yacht

“Popular” does not mean guaranteed to be offered by TALAGO. Only ACTIVE products should appear publicly.

# 75. INITIAL TOUR DATA QUALITY

Every seeded tour should contain, where verified or appropriate:

- professional title
- short title
- slug
- destination
- category
- secondary categories
- description
- highlights
- duration
- pickup model
- pickup zones
- pickup times
- meeting point
- guest types
- price structure
- availability
- route
- itinerary
- included
- excluded
- requirements
- restrictions
- accessibility
- what to bring
- cancellation
- payment methods
- booking questions
- SEO
- media placeholders
- tags
- badges

Do not leave critical public fields empty on Published products.

# 76. TOUR TITLE QUALITY

Titles must sound like real bookable products and be searchable.

Good:

“Marsa Mubarak Snorkeling Trip from Marsa Alam”

“Marsa Alam Super Safari with Quad Bike & Bedouin Experience”

“Luxor Valley of the Kings & Queens Day Trip from Marsa Alam”

“Cairo & Grand Egyptian Museum Day Trip from Hurghada”

“Ras Mohammed & White Island from Sharm El Sheikh”

Bad:

“Beautiful Amazing Adventure”
“Best Luxury Experience”
“Sea Adventure”

Avoid generic AI-sounding product names.

# 77. SEED IMAGE GUIDELINES

Use relevant media placeholders or verified images for the actual activity.

Examples:

Marsa Mubarak → snorkeling / reef / sea turtles
Sataya → dolphin reef / boat / snorkeling
Hamata → islands / turquoise water / boat
Super Safari → quad / desert / camel / Bedouin experience
Luxor → Valley of Kings / temples
Cairo → Giza / Grand Egyptian Museum
Orange Bay → island / snorkeling / beach
Nefertari → Pharaonic boat / underwater view
Sea Scope → underwater observation
Parasailing → parasailing / Red Sea
Ras Mohammed → national park / reef
Tiran → island / snorkeling

Never use unrelated stock imagery.

# 78. INITIAL DESTINATION COLLECTIONS

Create dynamic collections:

Marsa Alam Best Sellers
Hurghada Best Sellers
Sharm El Sheikh Best Sellers

Marsa Alam:
- Sea Adventures
- Safari & Desert
- Cultural Day Trips
- Diving
- Family Experiences

Hurghada:
- Island Trips
- Snorkeling
- Dolphin Experiences
- Safari
- Water Sports
- Cultural Day Trips
- Private Boat Trips

Sharm:
- Sea Trips
- Safari
- Diving
- Sinai Adventures
- Cultural Day Trips
- Family Activities

Collections must be database-driven.

# 79. DESTINATION PAGES

Create/upgrade destination pages for:

- Hurghada
- Marsa Alam
- Sharm El Sheikh

Each page:

Hero
Overview
Best Sellers
Sea Trips
Safari / Adventure
Cultural
Diving
Family
FAQ
CTA

Hide empty sections.

# 80. GLOBALIZATION TEST

The implementation must answer YES to all of these without code changes:

Can I add a tour in Tokyo?
YES.

Can I add a walking tour with no hotel pickup?
YES.

Can I create a boat tour with multiple meeting points?
YES.

Can I create a seven-day tour?
YES.

Can I create a multi-language experience?
YES.

Can I create a wheelchair-accessible experience?
YES.

Can I create a EUR-priced tour?
YES.

Can I create date-specific pricing?
YES.

Can I create a private tour with a custom start time?
YES.

Can I create an operator-confirmation tour?
YES.

Can I add a new country or city without schema changes?
YES.

# 81. HOMEPAGE DISTRIBUTION

Do not make the homepage appear limited to Sharm or one destination.

Use dynamic sections for:

- Hurghada
- Marsa Alam
- Sharm El Sheikh
- Sea Adventures
- Safari & Desert
- Cultural Egypt
- Private Experiences
- Family Experiences
- Best Sellers

Admin controls Featured on each tour.

# 82. ADMIN BULK ACTIONS

Allow selecting multiple tours and applying:

- publish
- unpublish
- archive
- feature
- remove feature
- category change
- destination change
- badge change

# 83. DATABASE MIGRATION SAFETY

If Quick Create and Full Create currently store different structures:

1. map every field
2. create unified model
3. migrate old records
4. preserve all data
5. verify migrated tours
6. keep compatibility if required
7. only then remove obsolete duplication

No data loss.

# 84. PUBLIC TOUR DATA RULE

Only ACTIVE tours should be publicly bookable.

Statuses:

- Draft
- Active
- Hidden
- Coming Soon
- Archived

# 85. GLOBAL PLATFORM UX REFERENCE

Build the customer-facing product information depth expected from established international experience marketplaces.

The page should make it easy to understand:

- what the traveler is buying
- where it starts
- where it ends
- how long it lasts
- what is included
- what is excluded
- what time it starts
- what to bring
- requirements
- accessibility
- cancellation
- exact booking process
- contact path

Do not copy another company’s branding or design. Use global marketplace UX principles only as a reference.

# 86. OPERATIONAL TRUTH

Never fabricate:

- reviews
- booking counts
- ratings
- licenses
- certifications
- safety claims
- prices
- schedules
- availability
- operator names
- guaranteed animal sightings
- guaranteed weather
- guaranteed pickup
- ticket inclusion

When not verified:

- keep product as Draft, or
- use editable internal “Needs Verification” fields

Never publish internal verification notes to customers.

# 87. TOUR PUBLISH CHECKLIST

Before Publish, Admin should have:

CONTENT
- title
- description
- images
- highlights

OPERATIONS
- route
- meeting point or pickup model
- schedule
- transportation
- capacity

BOOKING
- pricing
- guest types
- availability
- payment
- cancellation

TRAVELER INFORMATION
- requirements
- accessibility
- what to bring
- important information

DISCOVERY
- category
- destination
- tags
- SEO

SAFETY
- restrictions
- emergency info where applicable
- weather policy where applicable

Admin can always Save Draft even when not complete.

# 88. UI QUALITY

Keep the TALAGO visual identity premium:

- clean
- elegant
- strong photography
- clear CTA
- polished cards
- generous spacing
- subtle motion
- strong mobile UX

Do not turn the customer-facing website into a generic SaaS dashboard.

The admin can be more functional, but the customer frontend must remain a premium travel experience.

# 89. FINAL CUSTOMER FLOW

Homepage → Search → Tour Listing → Tour Detail → Select Date → Select Time → Select Guests → Pickup / Meeting Point → Add-ons → Payment → Confirmation → Voucher / WhatsApp Support

Every stage must use the same tour configuration and the same source of truth.

# 90. FINAL ADMIN FLOW

Admin Dashboard → Tours → Create Tour OR Template → Unified Tour Editor → Save Draft → Preview → Verify Completeness → Publish

Edit later from the same editor.

No Quick Create vs Full Create split.

# 91. FINAL ARCHITECTURAL PRINCIPLE

TALAGO IS NOT AN EGYPT TOUR WEBSITE.

TALAGO IS A GLOBAL EXPERIENCE BOOKING PLATFORM.

Egypt is the launch catalog.

Hurghada, Marsa Alam and Sharm El Sheikh are initial destinations.

The architecture must remain global.

One Tour Model.
One Unified Tour Editor.
One Booking Engine.
One Availability Engine.
One Pricing Engine.
One Route Engine.
One Itinerary Engine.
One Pickup / Meeting Point Engine.
One Global Content Model.
One Global Admin.

Regional differences are configuration, not separate business logic.

# 92. TESTING REQUIREMENTS

Before completion, test:

1. Create a tour using only essential fields.
2. Save as Draft.
3. Add advanced fields later.
4. Add multiple guest types.
5. Add multiple pickup zones.
6. Add date-specific availability.
7. Add a route with map points.
8. Add itinerary timeline.
9. Add add-ons.
10. Change payment method.
11. Test deposit calculation.
12. Test cash-on-arrival.
13. Test capacity / sold out.
14. Test date-specific price.
15. Test a tour with no pickup.
16. Test a meeting-point-only tour.
17. Test a multi-day tour.
18. Test a private tour.
19. Test on-request confirmation.
20. Publish and preview.
21. Complete a booking.
22. Verify booking ID.
23. Verify admin sees the booking.
24. Verify availability decreases.
25. Verify mobile UI.
26. Verify Arabic RTL readiness.
27. Verify no hardcoded business values remain.
28. Verify existing tours still work.
29. Verify existing URLs remain valid.
30. Verify no fake business data is displayed publicly.

# 93. FINAL DELIVERABLE EXPECTATIONS

The finished product must include:

CUSTOMER SIDE
- premium homepage
- real tour search
- dynamic filters
- destination pages
- tour details
- calendar
- availability
- pickup / meeting point
- guest selection
- add-ons
- checkout
- payment
- confirmation
- voucher
- WhatsApp / support
- reviews
- FAQ
- SEO-ready pages

ADMIN SIDE
- dashboard
- unified tours
- Unified Create Tour
- Unified Edit Tour
- template library
- availability
- pickup management
- route builder
- itinerary builder
- pricing
- guest types
- variants
- add-ons
- booking questions
- reviews
- bookings
- payments
- business settings
- SEO settings
- operator / operational data

# 94. IMPLEMENTATION STYLE

Work incrementally.

First inspect the current codebase and understand it.

Then refactor toward the unified architecture.

Do not blindly rewrite everything.

Use reusable components.

Use strong typing.

Prefer clear domain models.

Keep business logic server-authoritative.

Avoid duplicated data.

At the end provide a technical summary of:

1. What changed.
2. What was merged.
3. What data migrations were performed.
4. What Admin controls were added.
5. What booking logic was improved.
6. What global-tour architecture was introduced.
7. Which initial tours were seeded.
8. Which products remain Draft / Needs Verification.

# 95. MOST IMPORTANT SUCCESS CRITERION

An Admin should be able to create a complete TALAGO tour from ONE unified Create/Edit Tour screen and control the entire customer experience from:

content
→ route
→ itinerary
→ media
→ pricing
→ guest types
→ variants
→ availability
→ pickup
→ meeting point
→ transportation
→ activities
→ inclusions
→ requirements
→ accessibility
→ safety
→ cancellation
→ payment
→ booking questions
→ SEO
→ publishing

without switching to a second tour creation system.

At the same time, a future TALAGO team member should be able to add an experience in any city or country without changing the application’s core architecture.

**The system must be global by design, data-driven by default, and operationally complete enough to run real bookings.**
