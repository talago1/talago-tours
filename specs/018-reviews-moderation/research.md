# Research: Verified Customer Reviews & Admin Moderation Engine

**Date**: 2026-05-31  
**Feature**: 018-reviews-moderation

## Decision 1: Transaction-Isolated Aggregate Rating Updates

### Decision
We will use a Prisma interactive transaction (`prisma.$transaction`) to handle moderation state updates and subsequent rating updates atomically.

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update review status
  const updatedReview = await tx.review.update({
    where: { id: reviewId },
    data: { status },
  });

  // 2. Fetch aggregate stats for approved reviews
  const aggregates = await tx.review.aggregate({
    where: { tourId: updatedReview.tourId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingAverage = aggregates._avg.rating || 0.0;
  const ratingCount = aggregates._count.rating || 0;

  // 3. Commit to Tour entity
  await tx.tour.update({
    where: { id: updatedReview.tourId },
    data: {
      ratingAverage,
      ratingCount, // Track total reviews count to display beside average
    },
  });
});
```

### Rationale
- Prevents race conditions when multiple administrators are moderating reviews simultaneously.
- Guarantees database consistency: a review can never be approved without updating the corresponding tour score.
- Eliminates any performance overhead during catalog views. Since the average and total count are pre-computed and cached, search catalogs load instantaneously (sub-10ms DB queries).

### Alternatives Considered
- **On-the-fly aggregation**: Calculating average ratings on every catalog page load. Rejected because it scales poorly as review volumes grow (O(N) reads, violating the sub-50ms target).

---

## Decision 2: Star Breakdown Ratio Computations

### Decision
The server-side reviews endpoint or public tour endpoint will deliver the star breakdown counts as an array of count mappings. The client-side component will map these to horizontal progress bars.

```typescript
const groups = await prisma.review.groupBy({
  by: ['rating'],
  where: { tourId, status: 'APPROVED' },
  _count: { id: true },
});

// Map counts into 1-5 bands
const distributions = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
groups.forEach(g => {
  distributions[g.rating] = g._count.id;
});
```

### Rationale
- Shifting math calculations to the server reduces client JS bundle weight.
- Progress bar container dimensions are pre-determined using explicit bounding boxes (`h-2 w-full bg-neutral-200 rounded`) to ensure **Zero Cumulative Layout Shift (CLS)** as specified in the constitution.

---

## Decision 3: Single-Review Verification Guard

### Decision
We will enforce a strict, atomic database unique constraint on `Review.bookingId` coupled with server-side validation to block duplicate review submissions.

### Rationale
- A booking reference is a strict, single-use token representing one customer trip. Allowing multiple reviews per booking dilutes social proof.
- Enforcing `@unique` on `bookingId` at the schema level provides compile-time and runtime safety nets against duplicate submissions.

---

## Decision 4: Responsive Public Canvas vs. Desktop LTR Admin moderation panel

### Decision
- **Public section** (`components/public/ReviewSection.tsx`): Built mobile-first. Star ratings stack vertically on mobile screens and transform into a high-density 2-column scorecard on desktop views.
- **Admin section**: Desktop-focused grid layout utilizing standard tabular elements with fixed heights and overflow containers. Strict LTR visual orientation.

### Rationale
- 80%+ of tour catalog discovery happens on mobile, requiring high-impact layout density.
- Admin back-office moderation is performed on desktop screens, where wide lists are optimal for fast scanning. No micro-animations or heavy CSS layers used. All interactions utilize native Tailwind transitions.