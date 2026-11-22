# Specification: Admin Panel Control & Advanced Features System

## 1. Existing Behavior and Actual Problem
- The Admin Panel contained an "Advanced Features" view where several toggles existed merely as dead switches or database seed placeholders with no connected backend logic.
- Crucial business parameters (homepage banner control, featured tour curation, hero headlines, category visibility, legal company identity) were hardcoded in components instead of reading from `SystemSetting`.

## 2. Desired Behavior
- **True End-to-End Admin Governance**:
  - Every toggle or configuration in the Admin panel must be wired to:
    1. A persistent database record (`SystemSetting` or dedicated model).
    2. A secure Server-side API endpoint with authorization.
    3. A live consumer in the storefront or operational workflow.
- **Audited Advanced Features**:
  - Clean audit of every feature in `src/app/admin/settings/` and `src/app/admin/operations/`.
  - Elimination of fake or dummy toggles.
  - Active feature controls for:
    - Homepage interest category strip (show/hide, order).
    - Emergency announcement banner (custom message, link, active status).
    - AI auto-description generation for tours.
    - Currency exchange auto-refresh frequency.
    - Booking cutoff hours and auto-confirmation behavior.
    - WhatsApp concierge primary dispatch number and routing.
    - Company legal registration details (tax ID, commercial license, registered address).

## 3. Source-of-Truth Data and Module Ownership
- **Database Model**: `SystemSetting` (`key`, `value`).
- **Admin Views**: `src/app/admin/settings/`, `src/app/admin/settings/company/`, `src/app/admin/operations/`.
- **System Settings Library**: `src/lib/systemSettings.ts`.
- **API**: `/api/admin/settings`, `/api/admin/company-profile`.

## 4. User Journeys & Acceptance Criteria
1. Admin edits the announcement banner in Admin Settings -> saves -> banner immediately displays on public homepage.
2. Admin toggles off the homepage category strip -> homepage instantly hides the strip.
3. Admin updates official company tax registration number -> immediately reflected in public footer and `/booking-terms`.
4. Refreshing the Admin page retains all toggle states accurately.

## 5. Security & Verification
- Strict server-side verification: unauthorized requests to admin settings routes return `401 Unauthorized`.
- Changes logged in audit trails.
