# Specification: In-Page Custom Booking Calendar & Pricing Engine

## 1. Existing Behavior and Actual Problem
- The application previously relied on a native browser date input (`<input type="date">`) which opens OS-level pickers that obscure pricing, hide sold-out dates, and provide poor UX on mobile devices.
- Tour departure cutoffs, blackout dates, and day-specific pricing were not visually represented before date selection.

## 2. Desired Behavior
- **Native In-Page Monthly Calendar**: A responsive interactive calendar built directly into Talago's UI that displays within the tour page sidebar, booking modal, and checkout page.
- **Embedded Day Details**:
  - Available dates (highlighted, clickable).
  - Day-specific starting price displayed right inside the date cell (e.g. `$45`).
  - Sold-out dates (clearly disabled with "Sold out" indicator).
  - Closed/blackout dates (muted, unclickable).
  - Selected date state with brand accent border and clear visual confirmation.
- **Dynamic Recalculation**: Changing month, departure time, or guest counts dynamically recalculates total prices without full-page reloads.
- **Future Accommodation Architecture**: Component architecture supports single-date selection (Tours & Excursions) and has clean hooks for date-range selection (future Hotel/Accommodation check-in & check-out) without mixing tour departure schedules with hotel night calculations.

## 3. Source-of-Truth Data and Module Ownership
- **Component**: `src/components/tours/BookingCalendar.tsx`.
- **Availability Service**: `src/app/api/public/tours/[tourId]/availability/route.ts`.
- **Tour Pricing Rules**: `TourAvailability`, `TourScheduleRule`, and `Tour.priceUSD`.

## 4. User Journeys & Acceptance Criteria
1. Traveler lands on tour page -> calendar displays current month with available departure days.
2. Traveler clicks next month -> fetches month availability seamlessly without screen flicker.
3. Traveler selects a date -> price updates instantly, booking button activates.
4. Mobile viewport: Calendar fits comfortably within screen boundaries without horizontal scrolling.
5. Desktop viewport: Calendar docks cleanly in the sticky reservation sidebar.

## 5. Required APIs and Database Relationships
- Models: `Tour`, `TourAvailability`, `TourScheduleRule`, `TourTimeSlot`.
- Endpoint: `GET /api/public/tours/[tourId]/availability?month=YYYY-MM`.

## 6. Validation and Security Requirements
- All submitted travel dates validated server-side against minimum advance booking cutoff (e.g. cutoffHours).
- Past dates strictly rejected.

## 7. Required Tests
- Component unit test verifying month navigation and date selection.
- E2E test verifying availability highlights and pricing consistency on checkout.

## 8. Dependencies & Implementation Order
- Replaces `<input type="date">` in `ContinuousBookingModal` and `checkout/[tourId]`.
- Feeds selected date into unified booking engine.
