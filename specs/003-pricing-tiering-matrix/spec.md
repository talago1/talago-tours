# Feature Specification: Age-Bracket Pricing & Tiering Matrix

**Feature Branch**: `003-pricing-tiering-matrix`

**Created**: 2026-05-31

**Status**: Implemented

**Input**: User description: "Update the Tour Pricing architecture to handle dynamic age brackets and tiered pricing for tours like Safaris and Diving which have strict age policies."

## Clarifications

### Session 2026-05-31

- Q: Should pricing be a separate standalone feature or integrated into the existing Tour Builder Form? → A: Integrated into the existing Tour Builder Form (`/admin/tours/new`) as a new section, not a standalone page.
- Q: Are child and infant pricing always required, or should they be optional toggles? → A: Optional — toggles for "Enable Child Pricing" and "Enable Infant Pricing" with sensible default age ranges.
- Q: Should age range validation block saving? → A: Yes — if a tier is enabled, max age must be greater than min age, and price must be > 0.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Adult Pricing (Priority: P1)

As an admin, I want to set a required adult price so that the tour has a base price for all customers.

**Why this priority**: Adult pricing is the foundation of all tour sales. Without it, no tour can be booked.

**Independent Test**: Can be fully tested by navigating to the Pricing section and entering an adult price in USD.

**Acceptance Scenarios**:

1. **Given** I am on the Pricing section, **When** I view the form, **Then** the Adult Price input is always visible and marked as required.
2. **Given** I enter a valid adult price, **When** I submit the form, **Then** the price is saved and persisted.
3. **Given** I leave the adult price at zero or empty, **When** I submit, **Then** I see a validation error: "Adult price is required and must be greater than zero".

---

### User Story 2 - Enable Child Pricing with Age Range (Priority: P1)

As an admin, I want to optionally enable child pricing with a configurable age range so that families see accurate pricing for children of different ages.

**Why this priority**: Tours like Safaris and Diving have strict age policies. Without age-bracket pricing, parents cannot determine the correct price for their children.

**Independent Test**: Can be fully tested by toggling "Enable Child Pricing", entering a child price, and setting min/max age values.

**Acceptance Scenarios**:

1. **Given** I am on the Pricing section, **When** I toggle "Enable Child Pricing" to on, **Then** three fields appear: Child Price (USD), Min Age, and Max Age.
2. **Given** child pricing is enabled with valid values, **When** I submit, **Then** the child pricing configuration is saved and persisted.
3. **Given** child pricing is enabled, **When** I toggle it off, **Then** the child pricing fields are hidden and the values are not saved.
4. **Given** child pricing is enabled and max age is not greater than min age, **When** I submit, **Then** I see a validation error: "Child max age must be greater than min age".

---

### User Story 3 - Enable Infant Pricing with Age Range (Priority: P2)

As an admin, I want to optionally enable infant pricing with a configurable age range so that tours with infant policies (e.g., 0-2 years free or reduced) are accurately represented.

**Why this priority**: Many tours allow infants at reduced or zero cost, but only within a specific age window. Without this, booking systems cannot correctly price family bookings.

**Independent Test**: Can be fully tested by toggling "Enable Infant Pricing", entering an infant price, and setting min/max age values.

**Acceptance Scenarios**:

1. **Given** I am on the Pricing section, **When** I toggle "Enable Infant Pricing" to on, **Then** three fields appear: Infant Price (USD), Min Age, and Max Age.
2. **Given** infant pricing is enabled with valid values, **When** I submit, **Then** the infant pricing configuration is saved.
3. **Given** infant pricing is enabled, **When** I toggle it off, **Then** the infant fields are hidden and not saved.
4. **Given** infant pricing is enabled and max age is not greater than min age, **When** I submit, **Then** I see a validation error.

---

### User Story 4 - Document Age & Safety Restrictions (Priority: P2)

As an admin, I want to enter free-text age and safety restrictions so that customers understand tour-specific policies.

**Why this priority**: Tour-specific safety rules (e.g., "Minimum age for Quad Safari is 16") cannot be captured by structured fields alone.

**Independent Test**: Can be fully tested by entering text in the "Important Age & Safety Restrictions" textarea and verifying it persists on save.

**Acceptance Scenarios**:

1. **Given** I am on the Pricing section, **When** I view the form, **Then** a textarea labeled "Important Age & Safety Restrictions" is visible.
2. **Given** I enter restriction notes, **When** I submit, **Then** the notes are saved and persisted.
3. **Given** I leave the textarea empty, **When** I submit, **Then** the field saves as null (no error).

---

### Edge Cases

- What if the admin enters a negative price? The field should reject negative values or show a validation error (handled by `min="0"` on number inputs).
- What if the admin enables child pricing but enters $0 for the child price? Child price must be > 0 if child pricing is enabled — validation error.
- What if the admin enters age values that overlap between child and infant tiers (e.g., infant 0-2, child 2-11)? The system allows overlapping age ranges. Tour-specific safety restrictions in the textarea clarify boundaries.
- What if the API is unavailable during save? A user-friendly error message is displayed and the save button re-enables.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Pricing section MUST display an Adult Price input that is always visible and required.
- **FR-002**: The Pricing section MUST have a toggle labeled "Enable Child Pricing".
- **FR-003**: When child pricing is enabled, three fields MUST appear: Child Price (USD), Child Min Age, and Child Max Age.
- **FR-004**: The Pricing section MUST have a toggle labeled "Enable Infant Pricing".
- **FR-005**: When infant pricing is enabled, three fields MUST appear: Infant Price (USD), Infant Min Age, and Infant Max Age.
- **FR-006**: The system MUST validate that adult price is greater than zero before saving.
- **FR-007**: The system MUST validate that child price is greater than zero when child pricing is enabled.
- **FR-008**: The system MUST validate that infant price is greater than zero when infant pricing is enabled.
- **FR-009**: The system MUST validate that childMaxAge is greater than childMinAge when child pricing is enabled.
- **FR-010**: The system MUST validate that infantMaxAge is greater than infantMinAge when infant pricing is enabled.
- **FR-011**: The Pricing section MUST include a textarea labeled "Important Age & Safety Restrictions".
- **FR-012**: The Save button MUST disable immediately and show a loading state upon click.
- **FR-013**: The form MUST prevent duplicate save requests while a save is in progress.
- **FR-014**: On save success, the administrator MUST receive a confirmation message.
- **FR-015**: On save failure, the administrator MUST see a user-friendly error message and the Save button MUST re-enable.
- **FR-016**: All age bracket fields MUST use sensible defaults (child 3-11, infant 0-2).
- **FR-017**: Sensible defaults MUST only apply when the corresponding pricing toggle is first enabled; the admin can override them freely.

### Key Entities

- **Adult Pricing**: The base price for a tour, always required. Stored as a direct field on the Tour model.
- **Child Pricing**: Optional tier with a price and an age range (min/max age). When disabled, stored as null in the database.
- **Infant Pricing**: Optional tier with a price and an age range (min/max age). When disabled, stored as null in the database.
- **Age Restrictions Notes**: Free-text field for documenting tour-specific age policies. Optional.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can configure adult + optional child/infant pricing tiers in under 1 minute.
- **SC-002**: Toggling child or infant pricing shows/hides the tier fields instantly (<100ms).
- **SC-003**: Validation catches all invalid configurations (zero adult price, child maxAge ≤ minAge, etc.) on submit.
- **SC-004**: Duplicate save rate is zero — verified by rapid-click testing.
- **SC-005**: Pricing configuration saves successfully in under 3 seconds under normal network conditions.
- **SC-006**: Age restriction notes of at least 500 characters can be entered and persisted.

## Assumptions

- Pricing is flat across all zones and seasons — no zone-based or date-based pricing variations in this version.
- Adult pricing is always required, child and infant tiers are optional additive layers.
- Age range validation is client-side + server-side; server is the authoritative validator.
- This form is for configuring pricing on new tours only (edit/update out of scope for this version).
- The admin user is already authenticated via the existing authentication system.
- All prices are in USD only — multi-currency pricing is out of scope for this feature.
- Discounts, promo codes, and special offers are handled by a separate system and are out of scope.
- The admin uses a desktop browser with a screen width of at least 1024px.
