# Feature Specification: Crew Assignment, Fleet Dispatch & Trip Expense Tracker

**Feature Branch**: `013-crew-fleet-expense`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Crew Assignment, Fleet Dispatch & Real-Time Trip Expense Tracker for admin operations logistics command"

## User Scenarios & Testing

### User Story 1 - Operator assigns crew and fleet to a tour departure (Priority: P1)

An operations manager opens the trip dispatcher for a specific tour departure date. They use searchable dropdowns to assign crew members (captain, guide, driver) and fleet assets (boat, vehicle) to that trip. The assignments are saved atomically with any expense entries.

**Why this priority**: Without crew and fleet assignments, tours cannot operate — this is the core logistics function.

**Independent Test**: Can be tested by opening the trip dispatcher for a tour date, selecting a crew member and a fleet asset from dropdowns, saving, and confirming the assignments persist on reload.

**Acceptance Scenarios**:

1. **Given** a trip dispatcher is open for a specific tour and date, **When** the operator searches for a crew member, **Then** matching crew members appear in a dropdown list.
2. **Given** crew members and fleet assets are selected, **When** the operator saves, **Then** all selections are persisted and displayed as assigned on reload.
3. **Given** an operator views an existing trip dispatch, **When** it loads, **Then** previously assigned crew and fleet are pre-populated in the form.

---

### User Story 2 - Operator logs trip expenses (Priority: P2)

An operator adds expense entries for a specific trip using a dynamic table. Each row has a category (Fuel, Permits & Fees, Crew Payroll, Catering, Misc), amount, currency (USD/EGP), and optional notes. The total cost updates in real-time as rows are added, removed, or edited. Mixed currencies are converted to a single total using configured exchange rates.

**Why this priority**: Trip expenses directly impact net margin calculations — accurate logging is essential for profitability analysis.

**Independent Test**: Can be tested by adding multiple expense rows with different categories and currencies, confirming the live total updates correctly, then saving and reloading to verify persistence.

**Acceptance Scenarios**:

1. **Given** the expense ledger is open, **When** the operator adds a new expense row, **Then** a blank row appears with category, amount, currency, and notes fields.
2. **Given** multiple expense rows exist, **When** the operator edits an amount or adds/removes rows, **Then** the total cost summary updates instantly.
3. **Given** expenses in both USD and EGP are entered, **When** the total is calculated, **Then** EGP amounts are converted to USD using configured exchange rates.

---

### User Story 3 - Saved costs feed into analytics net margin (Priority: P3)

A manager views the analytics dashboard (Feature 009) and sees net operating margins that reflect the trip expenses logged via the dispatcher. Fuel costs, crew payroll, and other line items are subtracted from tour revenue automatically.

**Why this priority**: Closing the loop between expense logging and margin reporting is essential for financial decision-making.

**Independent Test**: Can be tested by logging expenses for a tour, then checking the analytics dashboard to confirm those costs appear in net margin calculations.

**Acceptance Scenarios**:

1. **Given** trip expenses have been logged for a tour, **When** the analytics dashboard loads, **Then** net margin reflects total logged expenses subtracted from revenue.
2. **Given** no expenses have been logged for a tour, **When** analytics loads, **Then** net margin equals gross revenue (no cost impact).

---

### Edge Cases

- What happens when a crew member or fleet asset is already assigned to a different trip on the same date? The system should warn the operator of the scheduling conflict.
- What happens when an expense row has a negative amount? The system should reject negative values.
- What happens when the exchange rate config is missing for EGP→USD? The system should fall back to a hardcoded default rate and flag a warning.
- What happens when the dispatch save fails (network error)? No partial data is saved — the atomic transaction ensures all-or-nothing.
- What happens when a tour departure date is in the past? Dispatch and expense logging should be allowed for historical record-keeping.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow operators to search and select crew members from a managed list for a specific tour departure.
- **FR-002**: System MUST allow operators to search and select fleet assets from a managed list for a specific tour departure.
- **FR-003**: Crew and fleet assignments MUST be saved within an atomic transaction alongside any expense entries.
- **FR-004**: System MUST provide a dynamic expense table where operators can add, edit, and remove rows.
- **FR-005**: Each expense row MUST have a category (Fuel, Permits & Fees, Crew Payroll, Catering, Misc), amount, currency (USD/EGP), and optional notes.
- **FR-006**: The total cost summary MUST update in real-time as expense rows change.
- **FR-007**: Mixed-currency totals MUST convert EGP to USD using configured exchange rates.
- **FR-008**: Saved trip expenses MUST be queryable by the analytics engine for net margin calculations.
- **FR-009**: The dispatching UI MUST display a live-calculating total cost summary card.
- **FR-010**: Previously assigned crew, fleet, and expenses MUST be pre-populated when reopening a saved dispatch.

### Key Entities

- **TripExpense**: A financial record tied to a specific tour departure, with category, amount (Decimal), currency (USD/EGP), and optional notes. Links to Tour via tourId.
- **Crew Assignment**: A link between a crew member record and a specific tour departure date.
- **Fleet Assignment**: A link between a fleet asset record and a specific tour departure date.
- **Trip Dispatcher**: The UI panel where operators assign crew and fleet, log expenses, and review the live total cost before saving.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Trip dispatch with 5 crew, 3 assets, and 10 expense rows saves in under 2 seconds.
- **SC-002**: Live total cost updates in under 100ms per row edit.
- **SC-003**: The expense table supports at least 20 editable rows without performance degradation.
- **SC-004**: Reloading a saved dispatch re-populates all assignments and expenses correctly.
- **SC-005**: Zero cumulative layout shift during loading, editing, and saving.

## Assumptions

- Crew members (guides, captains, drivers) are managed as records in their own database table — this feature handles ASSIGNMENT only, not crew/fleet CRUD.
- Fleet assets (boats, vehicles) are similarly managed as separate table records.
- A scheduling conflict warning is advisory only — the operator can override and assign anyway.
- Exchange rates are defined in a static config file (consistent with Feature 009's `config/exchangeRates.ts`).
- The analytics bridge means the TripExpense records are queried by the existing analytics engine — no new analytics logic required.
- The operator is already authenticated via the existing admin auth system.
- Crew member and fleet asset models need Prisma schema creation — TripAssignment and FleetAssignment join models plus TripExpense model.
