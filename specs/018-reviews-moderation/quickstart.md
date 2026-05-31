# Quickstart: Verified Customer Reviews & Admin Moderation Engine

**Feature**: 018-reviews-moderation  
**Date**: 2026-05-31

## Development Setup

### 1. Database Schema Sync
Ensure your database is synchronized with the new `Review` model and `Tour` aggregates:

```bash
# Apply schema extensions to your local PostgreSQL instance
npx prisma db push
```

### 2. Seeding Mock Data
For development testing, you can populate mock bookings and tours to verify submission guards:

```bash
# Seed local database
npm run db:seed
```

### 3. Verification Endpoints
To verify correct behavior, test submissions using REST clients or CLI curl commands:

#### Submit a Verified Review:
```bash
curl -X POST http://localhost:3000/api/public/reviews/submit \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "valid-confirmed-booking-uuid",
    "tourId": "target-tour-uuid",
    "customerName": "John Doe",
    "rating": 5,
    "comment": "The best excursion we had in Hurghada!"
  }'
```

#### Moderate a Review (Admin Session Required):
```bash
curl -X PATCH http://localhost:3000/api/admin/reviews/moderate \
  -H "Content-Type: application/json" \
  -d '{
    "reviewId": "submitted-review-uuid",
    "status": "APPROVED"
  }'
```

---

## Component Integration Reference

- **Public View Container**: `components/public/ReviewSection.tsx`  
  Renders the Viator-style average scorecard, horizontal distribution bars, and reviews list. Passes an initial `tourId` prop to fetch reviews.
- **Form Wrapper**: Form elements must support optimistic states: disables submission buttons instantly upon click, and presents clear validation messages if the server rejects the bookingId or rating constraints.

---

## Testing Guide

### Unit Tests
Verify submission rules and computation utilities:

```bash
# Run unit tests
npm run test:unit
```

Key target suites:
- `tests/unit/calculateTourRatings.test.ts`: Verifies aggregate math accuracy, float rounding (1 decimal place), and empty state bounds.
- `tests/unit/reviewSubmission.test.ts`: Asserts status code validations (rejects pending bookings, ensures single reviews).

### E2E / Integration Tests
Verify admin moderation and public UI:

```bash
# Run E2E specs
npx playwright test
```

Key target specs:
- `tests/e2e/moderation-flow.spec.ts`: Automates submitting a review, navigating to the admin queue, clicking "Approve", and verifying the updated aggregate score on the public storefront catalog page.