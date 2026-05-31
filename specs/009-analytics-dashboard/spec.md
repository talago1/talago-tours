# Feature Specification: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter

**Feature Branch**: `009-analytics-dashboard`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Feature: Admin Analytics Dashboard, Channel Attribution & Multi-Currency Margin Reporter"

## Clarifications

### Session 2026-05-30

- Q: Where are transfer and operation costs stored for net margin calculation? → A: Per-tour fixed costs stored on the Tour model as a `costPerPerson` or `fixedCost` field. Margin = (total tour revenue) - (tour cost × booking count).
- Q: Does the Booking model already have a `channel` field for attribution? → A: No — add a new `channel` field to Booking with values VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE. Existing bookings default to WEBSITE.

## User Scenarios & Testing

### User Story 1 - Admin views executive summary metrics (Priority: P1)

An admin user navigates to the analytics dashboard and sees a summary grid with four key business metrics: total gross revenue (in USD with EGP equivalent), net profit margin after costs, total settled passengers for the period, and the top-performing tour title displayed with a Coral accent badge. All metrics reflect the currently selected timeframe.

**Why this priority**: The summary metrics provide the core business intelligence value — without these numbers the dashboard serves no operational purpose.

**Independent Test**: Can be fully tested by loading the analytics dashboard with bookings in the database. All four metric cards display accurate aggregated values that match manual calculation against the booking data.

**Acceptance Scenarios**:

1. **Given** there are confirmed bookings with varying revenue amounts, **When** an admin views the analytics dashboard, **Then** the Gross Revenue card displays the correct total sum of all booking revenues for the selected timeframe.
2. **Given** confirmed bookings have associated operational costs, **When** an admin views the dashboard, **Then** the Net Profit Margin card displays the correct margin after deducting costs from gross revenue.
3. **Given** confirmed bookings with different guest counts, **When** an admin views the dashboard, **Then** the Total Passengers card displays the correct sum of all guests across bookings.
4. **Given** multiple tours with different booking volumes, **When** an admin views the dashboard, **Then** the Top Tour card displays the title of the tour with the highest total revenue, accented in Coral (#FF5B00).

---

### User Story 2 - Admin reviews channel attribution breakdown (Priority: P2)

An admin views the channel attribution section showing booking distribution across acquisition channels (VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE). Each channel displays as a horizontal progress bar showing its percentage share of total bookings and revenue contribution, enabling the admin to compare channel performance at a glance.

**Why this priority**: Channel attribution provides actionable marketing intelligence — understanding which channels drive the most bookings and revenue enables budget allocation decisions.

**Independent Test**: Can be tested by loading the dashboard with bookings distributed across multiple channels. The progress bars display correctly proportional lengths matching each channel's share.

**Acceptance Scenarios**:

1. **Given** bookings exist across all five channels, **When** an admin views the channel attribution section, **Then** each channel shows a horizontal progress bar with length proportional to its booking count share.
2. **Given** a channel has zero bookings for the selected period, **When** the attribution section renders, **Then** that channel still appears with a zero-width progress bar and a count of 0.

---

### User Story 3 - Admin filters analytics by timeframe (Priority: P3)

An admin uses the timeframe selector to switch between Today, Last 7 Days, Current Month, and Custom Year-to-Date views. When a new timeframe is selected, the dashboard updates all metrics and channel breakdowns to reflect the new date range. During data loading, a clean skeleton state is displayed to prevent layout shifts.

**Why this priority**: Timeframe filtering enables trend analysis and period-over-period comparison, making the dashboard useful for daily operations and monthly reporting.

**Independent Test**: Can be tested by selecting each timeframe option and confirming all metrics update to reflect the correct date range.

**Acceptance Scenarios**:

1. **Given** the analytics dashboard is displayed with default timeframe, **When** the admin clicks "Last 7 Days", **Then** all metrics and channel data update to reflect bookings from the past 7 days only.
2. **Given** a new timeframe is selected, **When** data is loading, **Then** each metric card shows a skeleton placeholder with the same dimensions as the final card (zero cumulative layout shift).

---

### Edge Cases

- What happens when there are zero bookings for the selected timeframe? All metric cards display $0.00 or "—" with clear empty state messaging rather than errors.
- What happens when the exchange rate config file is missing or malformed? The dashboard falls back to a 1:1 USD:EGP rate and displays a warning banner.
- What happens when a booking has no channel assigned? It is grouped under "WEBSITE" (default channel).
- What happens when multiple tours have identical revenue for top performer? The first alphabetically is displayed as the top tour.
- What happens during data loading after timeframe change? Skeleton placeholders are shown with matching dimensions — no layout shift.

## Requirements

### Functional Requirements

- **FR-001**: System MUST display an analytics dashboard accessible only to authenticated admin users.
- **FR-002**: Dashboard MUST show four summary metric cards: Gross Revenue (USD + EGP), Net Profit Margin, Total Settled Passengers, and Top Performing Tour.
- **FR-003**: Gross Revenue MUST be displayed in USD with EGP equivalent calculated using configured exchange rates.
- **FR-004**: Net Profit Margin MUST be calculated as gross revenue minus operational costs (local transfer and operation fees).
- **FR-005**: Total Settled Passengers MUST be the sum of all guest counts (adults + children) across confirmed bookings.
- **FR-006**: Top Performing Tour MUST be the tour with the highest total revenue, displayed with a Coral (#FF5B00) accent badge.
- **FR-007**: Dashboard MUST include a channel attribution section showing booking distribution and revenue across VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, and WEBSITE.
- **FR-008**: Channel attribution MUST use horizontal progress bars with lengths proportional to each channel's booking count share of the total.
- **FR-009**: Dashboard MUST provide timeframe filter controls: Today, Last 7 Days, Current Month, and Custom Year-to-Date.
- **FR-010**: Changing the timeframe MUST trigger a data refresh that updates all visible metrics and channel breakdowns.
- **FR-011**: During data loading after a timeframe change, skeleton placeholders MUST be displayed with dimensions matching the final rendered content to prevent cumulative layout shift.
- **FR-012**: Dashboard data MUST refresh automatically every 15 minutes via caching controls.
- **FR-013**: The analytics API endpoint MUST be protected by an admin role check to prevent unauthorized access.
- **FR-014**: The Booking model MUST include a `channel` field supporting values: VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE. Existing bookings without a channel MUST default to WEBSITE.
- **FR-015**: The Tour model MUST store operational cost data (per-person transfer and operation costs) used for net profit margin calculation.

### Key Entities

- **Booking**: Core booking record with revenue amount, guest count (adults/children), channel (VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE), associated tour, status, and travel date.
- **Tour**: Tour entity with title and per-person operational cost fields used in margin calculations.
- **Exchange Rate Configuration**: Static configuration mapping currency pairs (USD:EGP) for revenue conversion calculations.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin users can view all four summary metrics and channel attribution within 2 seconds of dashboard load.
- **SC-002**: Timeframe filter changes reflect updated data in under 3 seconds (including loading state).
- **SC-003**: Dashboard experiences zero cumulative layout shift during initial load and timeframe transitions.
- **SC-004**: Channel attribution progress bars accurately reflect proportional booking distribution (verified against raw data).
- **SC-005**: All multi-currency conversions are accurate to 2 decimal places without floating-point rounding errors.

## Assumptions

- The admin user is already authenticated via the existing admin auth system; the analytics dashboard extends the same auth middleware.
- The Booking record stores a `totalRevenue` or equivalent monetary field (in USD cents or USD decimal) that can be aggregated.
- The Booking record already has a `guestCountAdults` and `guestCountChildren` (or equivalent) fields from Features 005/006.
- Currency conversion uses a static exchange rate configuration file that the admin updates manually when rates change significantly — no live exchange rate API integration for v1.
- The 15-minute cache refresh uses Next.js revalidation — data may be up to 15 minutes stale, which is acceptable for an admin analytics dashboard.
- The Custom Year-to-Date timeframe starts from January 1 of the current year.
- Skeleton loading states use the same Tailwind card layout structure as the rendered content.
- All five channels (VIATOR, GETYOURGUIDE, WHATSAPP, HOTEL_DIRECT, WEBSITE) are valid values; unassigned bookings default to WEBSITE.
- The Tour model will be extended with a `costPerPerson` or equivalent field to store per-person operational costs for margin calculation.
- The Booking model will be extended with a `channel` string field.
- Both model extensions require Prisma migrations as part of this feature.
