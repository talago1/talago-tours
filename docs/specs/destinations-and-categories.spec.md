# Specification: Destination Navigation Simplification & Global Taxonomy

## 1. Existing Behavior and Actual Problem
- Redundant dedicated destination landing pages (`src/app/(public)/destinations/[slug]/page.tsx` and `src/app/(public)/destinations/page.tsx`) duplicated tour listings with fragmented filter options and inconsistent layouts.
- Tour categories previously contained Egypt-specific tourist sites (e.g. `Pyramids`) rather than international travel experience taxonomy.

## 2. Desired Behavior
- **Unified Tour Listing via Filters**:
  - Clicking any destination (from navbar, footer, or homepage) immediately navigates to the canonical tour catalog: `/tours?destination={slug}` (e.g. `/tours?destination=hurghada`).
  - `/destinations/[slug]` cleanly redirects to `/tours?destination=[slug]` (308 Permanent Redirect) to preserve existing SEO links and bookmarks without duplicate codebase maintenance.
  - `/destinations` redirects cleanly to `/tours`.
- **Global Canonical Category Taxonomy**:
  - Categories represent universal international travel experiences:
    1. `Water Sports`
    2. `Diving & Snorkeling`
    3. `Boat Trips & Cruises`
    4. `Desert Safari & Quad`
    5. `Historical & Cultural Tours`
    6. `Day Trips & Excursions`
    7. `Adventure & Outdoor`
    8. `Luxury & VIP Experiences`
  - Used uniformly across Admin creation, Public Tour Cards, Tour Details, and Search/Filters.
- **Admin-Controlled Homepage Category Strip**:
  - Toggle visibility on/off via Admin Settings.
  - Reorder and select which categories appear on the homepage.

## 3. Source-of-Truth Data and Module Ownership
- **Canonical Categories**: `src/utils/categories.ts`.
- **Destination Translations**: `src/utils/destinationTranslations.ts`.
- **Catalog Route**: `src/app/(public)/tours/page.tsx`.

## 4. User Journeys & Acceptance Criteria
1. Traveler clicks "Hurghada" in navbar -> `/tours?destination=hurghada` opens with Hurghada pre-filtered.
2. Traveler clicks category "Diving" -> URL updates to `/tours?destination=hurghada&category=diving`.
3. Traveler refreshes page -> filter state preserved exactly as displayed.
4. Old URL `/destinations/cairo` visited -> instant 308 redirect to `/tours?destination=cairo`.

## 5. Required APIs and Database Relationships
- Models: `Destination`, `Tour`.
- Query Params: `destination`, `category`, `search`, `duration`, `priceRange`.

## 6. Required Tests
- `e2e/auth-booking-notifications.spec.ts`: Global canonical categories render without location-specific hardcoding.
- Redirection tests from `/destinations/[slug]` to `/tours?destination=[slug]`.
