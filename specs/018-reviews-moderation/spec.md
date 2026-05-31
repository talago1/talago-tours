# Feature Specification: Verified Customer Reviews, Interactive Ratings & Admin Moderation Engine

**Feature Branch**: `018-reviews-moderation`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Verified Customer Reviews, Interactive Ratings & Admin Moderation Engine"

## User Scenarios & Testing

### User Story 1 - Customers view Viator-style reviews and interactive rating summaries on public tour pages (Priority: P1)

As a public site visitor, I want to see an overview of reviews and ratings for each tour, including an aggregate score, a star-by-star percentage breakdown, and a feed of verified customer reviews, so that I can make an informed decision and book with confidence.

**Why this priority**: Social proof is the single most powerful driver of booking conversions. Displaying aggregate ratings and transparent feedback builds immediate buyer trust.

**Independent Test**: Can be fully verified by loading a public tour page as an anonymous user, checking that the aggregate rating, star breakdown progress bars, and customer review cards display correctly, and seeing a "Verified Booking" badge next to reviews.

**Acceptance Scenarios**:

1. **Given** a tour has multiple approved reviews, **When** a user loads the tour details page, **Then** the aggregate rating score (e.g., "4.8 / 5") is calculated and displayed with filled stars using the Coral brand accent color.
2. **Given** a tour has multiple reviews, **When** a user views the rating breakdown, **Then** they see horizontal progress bars reflecting the proportion of 5-star, 4-star, 3-star, 2-star, and 1-star ratings.
3. **Given** a customer review is published, **When** a user reads the review cards, **Then** each card displays the customer's name, their star rating, their comment, the creation date, and a distinct "Verified Booking" badge in the Forest brand color.
4. **Given** a tour has zero approved reviews, **When** a user loads the tour details page, **Then** they see a friendly placeholder message inviting them to be the first to review after taking the tour.

---

### User Story 2 - Verified customers submit reviews for their completed and confirmed bookings (Priority: P1)

As a customer who has completed a tour, I want to submit a rating and text review for my tour booking using my unique booking reference, so that I can share my genuine experience with other travelers.

**Why this priority**: High-integrity feedback prevents fake review spam and establishes the marketplace's authority. Verifying the booking reference ensures only real customers can write reviews.

**Independent Test**: Can be verified by navigating to the review submission section, entering a valid confirmed booking reference and tour ID, completing the 1–5 star rating and comment text, and submitting. The system successfully saves the review with a pending status.

**Acceptance Scenarios**:

1. **Given** a customer has a confirmed booking that has not yet been reviewed, **When** they submit a review with a valid booking reference, rating (1 to 5), and comment, **Then** the system accepts the submission and sets its status to PENDING moderation.
2. **Given** a user attempts to submit a review, **When** they enter a booking reference that does not exist, is not in a CONFIRMED state, or is for a different tour, **Then** the system rejects the submission with a clear, helpful error message.
3. **Given** a booking reference has already been used to write a review, **When** a user attempts to submit another review with the same reference, **Then** the system rejects the submission, explaining that only one review is allowed per booking.
4. **Given** a customer is entering their review, **When** they attempt to submit a comment exceeding 1000 characters or an invalid rating (outside 1 to 5), **Then** the submission is blocked with inline validation errors.

---

### User Story 3 - Administrators moderate incoming reviews and trigger automatic rating updates (Priority: P2)

As an operations manager or administrator, I want to view a queue of pending reviews, toggle their status between approved and rejected, and have the system automatically update the tour's global score upon approval, so that we can protect the site from inappropriate content while keeping ratings perfectly synchronized.

**Why this priority**: Moderation prevents inappropriate content or abuse from appearing live. Automatic aggregate updates ensure that public-facing tour catalogs always display high-performance, synchronized data without manual intervention or performance-heavy on-the-fly math.

**Independent Test**: Can be verified by logging into the admin panel, navigating to the reviews moderation screen, approving a pending review, and instantly seeing the corresponding tour's average rating update on the public tour list and details page.

**Acceptance Scenarios**:

1. **Given** an administrator is logged in, **When** they access the moderation panel, **Then** they see a table of reviews filtered by status (PENDING, APPROVED, REJECTED), showing recipient names, ratings, comments, dates, and action buttons.
2. **Given** a review is in a PENDING state, **When** the admin clicks the Approve button, **Then** the review status transitions to APPROVED, and the public-facing tour detail view immediately updates to include it.
3. **Given** a review is approved, **When** the status change completes, **Then** the system triggers an automatic re-computation of the tour's average rating based on all approved reviews for that tour and updates the static tour record.
4. **Given** a review contains inappropriate text, **When** the admin clicks the Reject button, **Then** the review status transitions to REJECTED, and it is excluded from public views and average score calculations.

---

### Edge Cases

- **Duplicate Submissions**: If two users attempt to submit a review for the same booking concurrently, database-level unique constraints must block the second write and display a clean warning.
- **Deleted Bookings or Tours**: If a booking or tour is deleted, any associated reviews must be automatically deleted to maintain database integrity (Cascade Delete).
- **Zero Approved Reviews after Rejection/Deletion**: If the last approved review of a tour is deleted or rejected, the tour's aggregate rating must reset gracefully to 0.0 with zero errors.
- **Rating Rounding**: When calculating the aggregate average score, the value should be formatted consistently to one decimal place (e.g., 4.75 rounds to 4.8) to prevent visual misalignments.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST enforce that each review is linked to a valid, unique booking reference.
- **FR-002**: Only bookings in a CONFIRMED state are eligible to receive reviews.
- **FR-003**: The system MUST restrict review submissions to exactly one review per booking reference.
- **FR-004**: Review ratings MUST be integers constrained between 1 (lowest) and 5 (highest).
- **FR-005**: All submitted reviews MUST default to a PENDING moderation status.
- **FR-006**: The public tour interface MUST display an aggregate rating score, progress bars representing star rating distribution ratios, and a scrollable review feed.
- **FR-007**: Every published review card MUST feature a "Verified Booking" badge to establish consumer trust.
- **FR-008**: The admin interface MUST provide a responsive moderation panel with one-click Approve and Reject actions.
- **FR-009**: Upon review approval, the system MUST automatically re-compute the overall average rating for the corresponding tour and update the pre-compiled average rating field on the tour record.
- **FR-010**: Rejected or pending reviews MUST NOT be factored into public aggregate scores or displayed in the public feed.

### Key Entities

- **Review**: Represents a customer-submitted review.
  - *Attributes*: unique identifier, booking reference pointer, tour reference pointer, customer name, integer rating (1 to 5), comment text, status (PENDING, APPROVED, REJECTED), creation timestamp, last updated timestamp.
- **Tour (existing)**: The target of the review. Modified to hold a pre-computed global average rating score.
- **Booking (existing)**: The verification source. Used to validate review eligibility and enforce uniqueness.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The aggregate ratings and breakdown progress bars on the public tour details page render in under 50ms for end-users.
- **SC-002**: 100% of reviews published in public feeds are verified to be from confirmed, non-duplicate bookings.
- **SC-003**: Administrators can moderate a review (Approve or Reject) with a single-click action that updates the interface instantly using optimistic UI patterns.
- **SC-004**: The overall tour aggregate rating re-calculation and static update complete within 200ms of an administrator clicking the "Approve" button.
- **SC-005**: 95% of eligible customers find the review submission form simple to complete, taking under 1 minute.

## Assumptions

- **Responsive Layout**: The review submission form and the Viator-style public summary grid are fully responsive (mobile-first), while the administrative moderation dashboard is LTR-oriented and optimized for desktop monitors.
- **Single‑Language Input**: Reviews are submitted and displayed in the language written by the customer; translation or automated multi-language replication of comments is out of scope.
- **Pre-computed Ratings**: To maintain maximum scalability and sub-50ms query latency, aggregate ratings are pre-computed and cached directly on the static Tour record rather than calculated on the fly during public catalog page views.
- **No Self-Reviewing**: Administrators are assumed to monitor and block any reviews submitted under suspicious credentials.
- **Cascade Deletion**: If a Booking or Tour record is removed, its associated Review records are automatically cascade-deleted to keep the database consistent.