# TALAGO Tours — Tour Import Template & Authoring Reference

This document is the official Talago template reference for preparing, importing, and reviewing tours in the Talago Admin Portal (**Admin → Tours → Import Tour Description**).

---

## 1. How the Import Process Works

1. **Prepare Tour Content**: Copy the template structure below into your favorite text editor.
2. **Fill in Fields**: Enter your verified tour information. Optional fields can be omitted or set to `N/A`.
3. **Copy & Paste**: Open **Admin → Tours → Import**, paste the full text into the text area.
4. **Structured Preview**: The system validates every field, flags missing required data (red) or recommendations (yellow), and calculates the **Completeness Score (0–100%)**.
5. **Save as Draft**: The tour is saved into the database with `status: "DRAFT"` so it is never published automatically without review.
6. **Fine-Tune & Publish**: Review and edit in the simplified 8-step Tour Editor, upload/select media, and publish when ready.

---

## 2. Supported Fields Reference

### 1. Basic Information
- `TITLE`: Tour title (required)
- `SLUG`: Custom URL slug (optional, auto-generated from title if blank)
- `CATEGORY`: Primary category (e.g. `sea`, `desert`, `cultural`, `adventure`, `family`)
- `TYPE`: `SHARED` or `PRIVATE`
- `BADGES`: Comma-separated list: `featured`, `best_seller`, `recommended`, `family_friendly`, `new`
- `CUSTOM_BADGE`: Custom text badge displayed on cards (e.g. `Top Rated`, `VIP Experience`)
- `TAGS`: Comma-separated search keywords
- `CARD_EXCERPT`: 1–2 sentence summary displayed on catalog cards
- `DESCRIPTION`: Full markdown/plain-text overview. Multiple paragraphs, bullet points, and internal notes are preserved in full.

### 2. Destination & Location
- `COUNTRY`: ISO-3166-1 alpha-2 (e.g. `EG`)
- `CITY`: City name (e.g. `Hurghada`, `Cairo`, `Luxor`, `Sharm El Sheikh`)
- `REGION`: Governorate/region (e.g. `Red Sea Governorate`)
- `DESTINATION`: Destination identifier matching admin database
- `ZONE`: Primary pickup zone name
- `ADDRESS`: Physical meeting point or departure address
- `LATITUDE` / `LONGITUDE`: Decimal GPS coordinates (e.g. `27.2285`, `33.8415`)

### 3. Images & Media
- `COVER_IMAGE`: High-resolution hero image URL
- `GALLERY_IMAGES`: List of photo URLs starting with `- `
- `VIDEO_URL`: YouTube, Vimeo, or MP4 link

### 4. Operator & Internal Operations
- `OPERATOR_NAME`: Local supplier name (private to operations team)
- `OPERATOR_PHONE`: Dispatch WhatsApp / emergency contact
- `OPERATOR_EMAIL`: Operations email
- `DISPATCH_NOTES`: Internal notes (berth number, captain name, guide instructions)

### 5. Pricing Engine
- `ADULT_PRICE`: Retail ticket price per adult in USD (required)
- `BASE_PRICE_USD`: Base currency amount (defaults to adult price)
- `ORIGINAL_PRICE`: Higher comparison price to display discount badge (e.g. `50`)
- `PRIVATE_PRICE`: Fixed charter or private group vehicle price (optional)
- `ALLOW_DEPOSIT`: `true` or `false`
- `DEPOSIT_PERCENTAGE`: Deposit % due at online booking (e.g. `20`)
- `ALLOW_PAY_AT_LOCATION`: `true` or `false` (pay cash on arrival)

### 6. Guest Types & Age Policies (Per-Tour Configurable)
- `CHILD_ENABLED`: `true` or `false`
- `CHILD_PRICE`: Child ticket price in USD
- `CHILD_MIN_AGE` / `CHILD_MAX_AGE`: e.g. `4` and `11`
- `INFANT_ENABLED`: `true` or `false`
- `INFANT_PRICE`: Infant ticket price (typically `0`)
- `INFANT_MIN_AGE` / `INFANT_MAX_AGE`: e.g. `0` and `3`

### 7. Add-ons & Upgrades
List each optional upgrade on a separate line starting with `- `:
Format: `- <Title> | Price: <USD> | Type: <per_booking|per_person> | <Description>`

### 8. Availability & Capacity
- `MAX_CAPACITY`: Maximum participants per departure slot (e.g. `35`)
- `MIN_GUESTS`: Minimum travelers required to operate (e.g. `1`)
- `CUTOFF_HOURS`: Booking cut-off window before start (e.g. `8` or `12`)
- `INSTANT_CONFIRMATION`: `true` or `false`

### 9. Schedule & Pickup Times
- `DURATION_HOURS`: Duration number in hours (e.g. `7`)
- `DURATION_DISPLAY`: Friendly text (e.g. `7 hours`, `Full day`)
- `PICKUP_TIMES`: Comma-separated list (e.g. `07:45, 08:15`)

### 10. Hotel Pickup & Transfers
- `HOTEL_PICKUP_INCLUDED`: `true` or `false`
- `PICKUP_TYPE`: `hotel`, `meeting_point`, or `both`
- `PICKUP_DESCRIPTION`: Detailed pickup zone coverage instructions
- `PICKUP_AREAS`: List of transfer surcharge zones:
  Format: `- <Zone Name> | Price: <USD> | <Notes>`

### 11. Meeting Point (Direct Arrival)
- `MEETING_POINT_NAME`: Departure location name (e.g. `Hurghada New Marina Gate 2`)
- `MEETING_POINT_ADDRESS`: Street address
- `MEETING_POINT_LANDMARK`: Easily identifiable landmark (e.g. `Opposite Costa Coffee`)
- `MEETING_POINT_INSTRUCTIONS`: Detailed arrival and parking instructions
- `MEETING_POINT_MAP_URL`: Google Maps directions link

### 12. Transportation Fleet
- `VEHICLE_TYPE`: e.g. `Luxury Twin-Deck Yacht`, `Air-conditioned Toyota HiAce Mini-van`
- `FLEET_SPECIFICATIONS`: e.g. `Twin 450HP Marine Diesel, radar, GPS, twin decks`
- `FLEET_AMENITIES`: e.g. `Air-conditioned saloon, shaded sundeck, freshwater showers`

### 13. Route Stops & Waypoints
List each stop starting with `- `:
Format: `- <Stop Name> | Order: <1, 2, 3> | Duration: <Minutes> | <Description>`

### 14. Itinerary Timeline
List each milestone starting with `- `:
Format: `- HH:MM - <Milestone Title> | <Description>` (or `- HH:MM - <Milestone Title>: <Description>`)

### 15. Highlights (Key Selling Points)
List key bullet points starting with `- ` (recommended 4–6).

### 16. Inclusions (What's Included)
List everything included in the ticket price starting with `- `.

### 17. Exclusions (What's NOT Included)
List extra costs, park entrance taxes, or personal expenses starting with `- `.

### 18. What to Bring
List recommended gear and documents starting with `- `.

### 18a. Important Information
Need-to-know traveler notes, dress codes, or weather dependencies.

### 18b. Frequently Asked Questions (FAQs)
Format:
```
Q: Question here?
A: Answer here.
```

### 19. Requirements & Fitness
- `FITNESS_LEVEL`: `EASY`, `MODERATE`, or `CHALLENGING`
- `SWIMMING_REQUIRED`: `true` or `false`
- `MIN_AGE`: Minimum participant age
- `REQUIREMENTS`: Multi-line participant restrictions

### 20. Accessibility & Special Needs
- `WHEELCHAIR_ACCESSIBLE`: `true` or `false`
- `STROLLER_ACCESSIBLE`: `true` or `false`
- `MOBILITY_NOTES`: Details on boarding, ramps, surfaces, and restrooms

### 21. Safety & Guidelines
- `SAFETY_GUIDELINES`: List of safety protocols starting with `- `
- `INSURANCE_INCLUDED`: `true` or `false`
- `EMERGENCY_CONTACT`: Local 24/7 emergency dispatch number

### 22. Cancellation Policy (Per-Tour Configurable)
- `FREE_CANCELLATION_HOURS`: **Number of hours before start for 100% refund** (e.g. `24`, `48`, `72`). Configurable per tour!
- `CANCELLATION_POLICY`: Detailed refund terms and weather cancellation terms.

### 23. Custom Booking Questions
List questions travelers answer at checkout starting with `- `:
Format: `- <Question Text> | Type: <text|phone|number|select> | Required: <yes|no> | Options: <comma-separated>`

### 24. SEO & Search Meta
- `SEO_TITLE`: Custom search engine title (<60 chars)
- `SEO_DESCRIPTION`: Meta description (<160 chars)
- `KEYWORDS`: Comma-separated search keywords

### 25. Publishing & Status
- `STATUS`: `DRAFT` (recommended on initial import), `ACTIVE`, or `HIDDEN`

### 26. Internal Operations Notes
- `INTERNAL_NOTES`: Operations, dispatch, and guide guidance notes.
