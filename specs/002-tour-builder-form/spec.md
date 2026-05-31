# Feature Specification: Universal Tour Builder & Multi-Language Form

**Feature Branch**: `002-tour-builder-form`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Universal administrative form for creating and editing tours with multi-language content — language tab switcher for 6 languages, global metadata fields, translatable text inputs, and structured validation before submission."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill Global Tour Metadata (Priority: P1)

As an admin, I want to set the base tour properties (duration, capacity, price, type, zone) in a single shared section so these values apply across all languages.

**Why this priority**: Global fields define the core tour structure and are required before any localized content can be added. All languages depend on these shared values.

**Independent Test**: Can be fully tested by filling all global fields and verifying they render once without duplication across language tabs.

**Acceptance Scenarios**:

1. **Given** I am on the tour builder form, **When** I enter the duration, max capacity, base price, select a tour type (Shared or Private), and choose a zone, **Then** all fields display in a single row above the language tab bar.
2. **Given** I enter global values, **When** I switch between language tabs, **Then** the global field values remain visible and unchanged regardless of which language tab is active.
3. **Given** I submit the form, **When** the tour is saved, **Then** the global fields are stored once as tour-level attributes, not duplicated per language.

---

### User Story 2 - Fill Localized Content Per Language (Priority: P1)

As an admin, I want to provide tour details in each supported language by switching between language tabs, so that customers can browse tours in their preferred language.

**Why this priority**: Multi-language content is the core differentiating feature. Without it, the platform serves only one language, limiting reach across the 6 launch markets.

**Independent Test**: Can be fully tested by selecting the DE tab, entering a German title and description, switching to the FR tab, entering French content, then switching back to DE and confirming both sets of content are preserved independently.

**Acceptance Scenarios**:

1. **Given** I have 6 language tabs (EN, DE, RU, FR, IT, TR), **When** I click on any tab, **Then** the form displays that language's translation fields (title, description, cancellation policy).
2. **Given** I enter content in the German (DE) tab, **When** I switch to the French (FR) tab and then back to DE, **Then** the German content I entered is still there exactly as I left it.
3. **Given** I switch between language tabs multiple times, **When** I make edits in each tab, **Then** no content is lost, reset, or overwritten across any language workspace.

---

### User Story 3 - Set Tour Cancellation Policies (Priority: P2)

As an admin, I want to define cancellation policy rules per language so that customers see legally accurate cancellation terms in their language.

**Why this priority**: Cancellation policies have legal implications and must be accurately represented in each market's language.

**Independent Test**: Can be fully tested by adding 2 cancellation policy rows in English, switching to German and adding 3 different policy rows, then verifying both languages preserve their independent policy lists.

**Acceptance Scenarios**:

1. **Given** I am on a language tab, **When** I add a cancellation policy row (a free-text sentence), **Then** it appears as a new row beneath the description field for that language only.
2. **Given** I have cancellation policies in multiple languages, **When** I switch between tabs, **Then** each language shows only its own policies without cross-contamination.

---

### User Story 4 - Submit Tour with Frontend Validation (Priority: P2)

As an admin, I want the form to validate all required fields before submission so that I cannot save an incomplete tour with broken data.

**Why this priority**: Invalid tours reaching the database cause display errors on the public site and require manual database cleanup, wasting engineering time.

**Independent Test**: Can be fully tested by attempting to submit with an empty slug, zero price, and no English title — each validation must display an inline error and block submission.

**Acceptance Scenarios**:

1. **Given** I attempt to submit the form, **When** the slug field contains spaces or special characters, **Then** an inline validation error appears indicating the slug must be URL-safe.
2. **Given** I attempt to submit the form, **When** any global numeric field (price, duration, capacity) is zero or empty, **Then** an inline validation error appears for that field.
3. **Given** I attempt to submit the form, **When** the English (EN) title or description is empty, **Then** a validation error appears indicating English content is required.
4. **Given** I attempt to submit with all fields valid, **When** I click the Submit button, **Then** the tour is saved and I receive a success confirmation.

---

### User Story 5 - Prevent Duplicate Submissions (Priority: P3)

As an admin, I want the submit button to disable immediately after clicking so that the tour is not created twice.

**Why this priority**: Duplicate tour entries corrupt the database catalog, create customer confusion, and require manual cleanup.

**Independent Test**: Can be fully tested by clicking the submit button rapidly multiple times — only one submission request should be sent, confirmed by a single tour record in the database.

**Acceptance Scenarios**:

1. **Given** I click the Submit button, **When** the submission is processing, **Then** the button immediately shows a loading state and becomes non-interactive.
2. **Given** a submission is in progress, **When** I attempt to click the button again, **Then** the second click is ignored.

---

### Edge Cases

- What happens when the admin selects a language tab with no content yet? The localized fields appear empty and ready for input, with no warnings or errors.
- What happens when all fields in a non-English language are left empty? The tour saves with empty strings for those languages — no validation error for non-English languages.
- What happens when the slug field contains uppercase letters? The slug is automatically lowercased or flagged for correction.
- What happens when the admin navigates away from the form with unsaved changes? The form should ideally warn about unsaved changes.
- What happens when the API returns a server error on submission? A user-friendly error message is displayed; the submit button re-enables to allow retry.
- What happens when the submitted slug already exists for another tour? The form displays an inline error indicating the slug is taken, and the admin must choose a different slug before resubmitting.
- What happens when a zone is selected but then removed (set to empty)? The zone field validation blocks submission with a clear message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Administrators MUST be able to set global tour fields: slug, duration, max capacity, base price, tour type (Shared/Private), and zone.
- **FR-002**: The form MUST display a tab bar with exactly 6 languages: EN, DE, RU, FR, IT, TR.
- **FR-003**: The active language tab MUST be visually distinct from inactive tabs.
- **FR-004**: Switching between language tabs MUST NOT reset or clear any input values in other language workspaces.
- **FR-005**: Administrators MUST be able to enter localized title, description, and cancellation policies for each of the 6 languages independently. Each cancellation policy row is a single free-text string.
- **FR-006**: The slug field MUST only accept URL-safe characters (lowercase letters, numbers, hyphens).
- **FR-006b**: The slug MUST be unique across all tours — duplicate slugs MUST be rejected on submission with an inline error message.
- **FR-007**: Global numeric fields (base price, duration, max capacity) MUST require non-zero positive values before submission.
- **FR-008**: At minimum, the English (EN) title and description MUST be populated before the form can be submitted.
- **FR-009**: The Submit button MUST disable immediately and show a loading state upon click.
- **FR-010**: The form MUST prevent duplicate submission requests (successive clicks) while a submission is in progress.
- **FR-011**: On submission success, the administrator MUST receive a confirmation message.
- **FR-012**: On submission failure (server error), the administrator MUST see a user-friendly error message and the Submit button MUST re-enable.
- **FR-013**: The final submitted payload MUST bundle all 6 language translations into a single structured object.

### Key Entities

- **Tour**: The primary entity representing a bookable experience. Contains global attributes (slug, type, basePriceUSD, durationHours, zoneId) and a bundled translations object containing all localized content.
- **Localized Content**: A grouped collection of per-language fields (title, description, cancellation policies) stored as a structured data block for each of the 6 supported languages.
- **Language**: One of 6 supported locales (EN, DE, RU, FR, IT, TR). Each language has its own set of translatable fields that are independent from other languages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can complete a full multi-language tour creation (all 6 languages, 3 fields each) in under 5 minutes.
- **SC-002**: Language tab switches show the correct language's content instantly without any loading delay.
- **SC-003**: Zero cases of data loss during tab switching — verified by automated switching through all 6 language tabs and confirming all entered values persist.
- **SC-004**: Validation errors appear within 100ms of attempting submission with invalid data.
- **SC-005**: Duplicate submission rate is zero — verified by rapid-click testing.
- **SC-006**: The form handles submission failure gracefully — the button re-enables and an error message appears within 5 seconds of failure.

## Clarifications

### Session 2026-05-30

- Q: Must the tour slug be unique across all tours? → A: Yes, uniqueness is enforced server-side on submission; duplicates return an inline error.
- Q: What structure does each cancellation policy row have? → A: Each row is a free-text sentence describing one policy rule, independently per language.

## Assumptions

- This form is for creating NEW tours; editing existing tours is handled separately or in a future iteration.
- The admin user is already authenticated via the existing authentication system.
- The zone dropdown options are populated from a pre-existing list of zones defined elsewhere in the system.
- Non-English languages can be partially filled — only English is required for submission.
- The cancellation policy field can have zero to multiple rows, added dynamically by the admin.
- Form state is local to the browser session; no auto-save or draft recovery is included.
- The admin uses a desktop browser with a screen width of at least 1024px.
