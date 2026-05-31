# Implementation Plan: Verified Customer Reviews & Admin Moderation Engine

**Branch**: `018-reviews-moderation` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-reviews-moderation/spec.md`

## Summary

Implement an integrated reviews and social validation pipeline allowing verified customers to submit 1–5 star ratings and text reviews for confirmed bookings. Provide an LTR administrative dashboard to moderate incoming submissions, coupled with an atomic recalculation engine that pre-computes and caches each tour's average rating to guarantee sub-50ms public catalog rendering speeds.

## Technical Context

**Language/Version**: TypeScript (strict, `"strict": true` in `tsconfig.json`), Next.js 14+ (App Router)

**Primary Dependencies**: `@prisma/client` ^5.14 (PostgreSQL), TailwindCSS ^3.4, React 18 (`lucide-react` or inline SVG for filled/empty star icons)

**Storage**:
- PostgreSQL via Prisma
- `Review` model: `@unique` constraint on `bookingId`, `@@index([tourId, status])` for fast filtered lookups
- `Tour` model extended with cached `ratingAverage Float @default(0.0)` and `ratingCount Int @default(0)`
- `Booking` model queried (existing) to assert `CONFIRMED` status and `tourId` match

**Testing**:
- Vitest — unit tests: rating recalculation utility, submission validation guards
- Playwright — E2E: public submission flow and admin moderation → aggregate update verification

**Target Platform**: Next.js App Router (Node server runtime, not Edge)

**Project Type**: Full-stack web application feature in existing Next.js monorepo

**Performance Goals**:
- Sub-50ms ratings lookups for public catalog pages (served from pre-cached `Tour.ratingAverage`)
- Sub-200ms aggregate recalculation after admin approval action
- Zero CLS on star breakdown progress bars (explicit height bounding boxes)

**Constraints**:
- Mobile-first responsive layout for the public `ReviewSection` widget
- Desktop LTR-oriented layout for the admin moderation panel
- Strict unique booking verification — exactly one review per confirmed booking
- No `any` types — full TypeScript strict typing throughout
- No Framer Motion / GSAP — Tailwind native transitions only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Justification |
|------|--------|---------------|
| I.1 Server-First Mindset | ✅ PASS | Submission and moderation APIs are Route Handlers (server); `ReviewSection` adds `"use client"` only for interactive star rating input. |
| I.2 Strict Type-Safety | ✅ PASS | No `any` used; `ReviewStatus` Prisma enum drives all typed payloads end-to-end. |
| I.3 Zero Tailwind Bloat | ✅ PASS | Layouts use `flex` / `grid` composition. Color tokens use project-registered custom values (`primary-coral`, `secondary-forest`). |
| I.4 Semantic HTML Only | ✅ PASS | Review cards use `<article>`, sections under `<section>`, overall widget under `<aside>` or `<section>`. |
| II.1 PageSpeed Target | ✅ PASS | Cached `ratingAverage` on `Tour` eliminates on-the-fly O(N) aggregation from public catalog queries. |
| II.2 LCP & CLS Targets | ✅ PASS | Star breakdown bars use `h-2 w-full` bounding boxes; no image dependencies in the review widget. |
| II.4 Zero Animation Bloat | ✅ PASS | All hover and loading transitions use `transition-all duration-300 ease-in-out` from Tailwind. |
| III.1 Conversion Palette | ✅ PASS | Stars rendered in Coral (`text-[#FF5B00]`); "Verified Booking" badge rendered in Forest (`text-secondary-forest bg-secondary-forest/10`). |
| III.3 Fail-Safe Forms | ✅ PASS | Submit button disabled + loading spinner on click; server error messages surfaced inline. |
| IV.1 Multi-Currency | N/A | No pricing logic in the reviews domain. |

**Post-Phase 1 Re-check**: ✅ All gates remain PASS after data-model and contract design.

---

## Phase 0: Research Summary

> Full detail: [research.md](./research.md)

### Decision 1 — Transaction-Isolated Rating Aggregation

**Chosen**: Prisma interactive transaction (`prisma.$transaction`) wraps the three-step moderation flow atomically:
1. `tx.review.update(...)` — status change
2. `tx.review.aggregate(...)` — re-aggregate APPROVED reviews
3. `tx.tour.update(...)` — commit `ratingAverage` + `ratingCount`

**Rationale**: Prevents race conditions under concurrent moderator sessions. Guarantees no approved review goes live without updating the corresponding tour score. Eliminates O(N) runtime math on public catalog queries.

**Alternative rejected**: On-the-fly aggregation via `SELECT AVG(rating)` on every catalog page load — scales poorly, violates the sub-50ms SC-001 target.

### Decision 2 — Star Breakdown Distribution via `groupBy`

**Chosen**: A server-side `prisma.review.groupBy({ by: ['rating'], where: { tourId, status: 'APPROVED' }, _count: { id: true } })` call computes 1–5 band distributions. The client component receives pre-computed count arrays; progress bar widths are CSS `style={{ width: \`${pct}%\` }}` derived on render.

**Rationale**: Keeps JS bundle weight minimal; container height pre-bound (`h-2`) ensures zero CLS.

### Decision 3 — Single-Review Enforcement

**Chosen**: Dual-layer guard — schema-level `@unique` on `bookingId` blocks concurrent duplicate writes at the DB level; application-level pre-check returns an actionable 403 before attempting the insert.

### Decision 4 — Responsive Public / Desktop Admin Split

**Chosen**: `ReviewSection.tsx` is mobile-first (stacks vertically on `<md`, splits into 2-column at `md:`). Admin moderation panel is desktop-LTR table layout with `overflow-auto` containers.

---

## Phase 1: Design & Contracts

> Full detail: [data-model.md](./data-model.md) · [contracts/submit-api.md](./contracts/submit-api.md) · [contracts/moderate-api.md](./contracts/moderate-api.md) · [quickstart.md](./quickstart.md)

### Data Model Changes

#### New: `ReviewStatus` enum
```prisma
enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### New: `Review` model
```prisma
model Review {
  id           String       @id @default(uuid())
  bookingId    String       @unique
  tourId       String
  customerName String
  rating       Int
  comment      String       @db.Text
  status       ReviewStatus @default(PENDING)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  booking      Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  tour         Tour         @relation(fields: [tourId],    references: [id], onDelete: Cascade)

  @@index([tourId, status])
}
```

#### Modified: `Tour` model (additions only)
```prisma
model Tour {
  // ... existing fields ...
  ratingAverage Float     @default(0.0)
  ratingCount   Int       @default(0)
  reviews       Review[]
}
```

#### Modified: `Booking` model (relation addition only)
```prisma
model Booking {
  // ... existing fields ...
  review Review?
}
```

### API Contracts

#### `POST /api/public/reviews/submit`

| Property | Value |
|---|---|
| Auth | None (public) |
| Body | `{ bookingId, tourId, customerName, rating: 1–5, comment: 10–1000 chars }` |
| Success | `201` `{ success: true, review: { id, status: "PENDING", createdAt } }` |
| booking not found | `404` |
| not CONFIRMED / wrong tour / duplicate | `403` |
| validation failure | `400` |

#### `PATCH /api/admin/reviews/moderate`

| Property | Value |
|---|---|
| Auth | Admin session / bearer token |
| Body | `{ reviewId, status: "APPROVED" \| "REJECTED" }` |
| Success | `200` `{ success: true, data: { reviewId, status, tourId, newRatingAverage, newRatingCount } }` |
| bad status value | `400` |
| no session | `401` |
| review not found | `404` |

---

## Project Structure

### Documentation (this feature)

```text
specs/018-reviews-moderation/
├── plan.md              ← This file
├── research.md          ← Phase 0 output (complete)
├── data-model.md        ← Phase 1 output (complete)
├── quickstart.md        ← Phase 1 output (complete)
├── contracts/
│   ├── submit-api.md    ← Phase 1 output (complete)
│   └── moderate-api.md  ← Phase 1 output (complete)
└── checklists/
    └── requirements.md
```

### Source Code Layout

```text
prisma/
└── schema.prisma                                    ← M1: Add ReviewStatus enum + Review model + Tour extensions

src/
├── app/
│   └── api/
│       ├── public/
│       │   └── reviews/
│       │       └── submit/
│       │           └── route.ts                     ← M2: POST secure review submission
│       └── admin/
│           └── reviews/
│               └── moderate/
│                   └── route.ts                     ← M4: PATCH admin moderation endpoint
├── components/
│   └── public/
│       └── ReviewSection.tsx                        ← M3: Viator-style star scorecard + review feed
└── utils/
    └── calculateTourRatings.ts                      ← M4: Atomic rating aggregation engine
```

---

## Milestones

### Milestone 1: Prisma Schema Extension for Social Proof Ledger

**File**: `prisma/schema.prisma`

**Actions**:
- Add `ReviewStatus` enum with states: `PENDING`, `APPROVED`, `REJECTED`
- Add `Review` model with:
  - `id` — `String @id @default(uuid())`
  - `bookingId` — `String @unique` (enforces one review per booking)
  - `tourId` — `String` (fast tour-scoped queries)
  - `customerName` — `String`
  - `rating` — `Int` (validated 1–5 in application layer; Prisma has no native `@check`)
  - `comment` — `String @db.Text`
  - `status` — `ReviewStatus @default(PENDING)`
  - `createdAt` — `DateTime @default(now())`
  - `updatedAt` — `DateTime @updatedAt`
  - Cascade relations to `Booking` and `Tour` (both `onDelete: Cascade`)
  - `@@index([tourId, status])` — composite index for filtered approved review lookups
- Extend `Tour` model: add `ratingAverage Float @default(0.0)`, `ratingCount Int @default(0)`, `reviews Review[]`
- Extend `Booking` model: add `review Review?`

**Verification**: `npx prisma db push` completes without errors; `npx prisma validate` passes.

---

### Milestone 2: Secure Verified Reviews Submission Pipeline API

**File**: `src/app/api/public/reviews/submit/route.ts`

**Actions**:
- Export async `POST(req: Request): Promise<Response>` Route Handler
- Parse and validate JSON body (no third-party schema library to keep bundle clean):
  - `bookingId` — required string
  - `tourId` — required string
  - `customerName` — required string, 2–50 chars
  - `rating` — required integer, `>= 1 && <= 5`
  - `comment` — required string, 10–1000 chars
  - Return `400` with descriptive message on any constraint violation
- Query PostgreSQL via Prisma:
  ```typescript
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  ```
- Gate checks (all in order, short-circuit on first failure):
  1. `!booking` → `404 { success: false, error: "Invalid booking reference." }`
  2. `booking.status !== 'CONFIRMED'` → `403 { success: false, error: "..." }`
  3. `booking.tourId !== tourId` → `403 { success: false, error: "..." }`
  4. `booking.review !== null` → `403 { success: false, error: "This booking has already been reviewed." }`
- On pass: `prisma.review.create(...)` with `status: 'PENDING'`
- Return `201` with `{ success: true, message: "...", review: { id, status, createdAt } }`

**Key principle**: No `any` types — use a typed `SubmitReviewPayload` interface for the parsed body.

---

### Milestone 3: Viator-Style Display Canvas & Star Histogram Component

**File**: `src/components/public/ReviewSection.tsx`

**Directive**: `"use client"` (interactive star input, tab switching)

**Layout Blueprint** (desktop 2-col, mobile stacked):

```
┌─────────────────────────────────┬──────────────────────────────────┐
│  LEFT SCORECARD                 │  RIGHT DISTRIBUTION              │
│                                 │                                  │
│   4.7  ★★★★☆  (Coral stars)    │  5★ ████████████████░  82%       │
│   Based on 23 reviews           │  4★ ████░░░░░░░░░░░░   14%      │
│                                 │  3★ █░░░░░░░░░░░░░░░    4%      │
│                                 │  2★ ░░░░░░░░░░░░░░░░    0%      │
│                                 │  1★ ░░░░░░░░░░░░░░░░    0%      │
└─────────────────────────────────┴──────────────────────────────────┘

Review Cards Feed:
┌──────────────────────────────────────────────────────────────────────┐
│  Jane Doe          ★★★★★   2026-05-28                               │
│  ✓ Verified Booking  (Forest green badge)                            │
│  "An absolutely amazing experience! Highly recommend the..."         │
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation details**:
- Accept `initialReviews: ApprovedReview[]`, `ratingAverage: number`, `ratingCount: number` as props (fetched server-side in parent RSC, passed to this client component)
- Star rendering: map `Array.from({ length: 5 })`, compare index to `Math.round(rating)`, render filled/empty SVG star in `text-[#FF5B00]`
- Distribution bars: `const pct = total > 0 ? Math.round((counts[star] / total) * 100) : 0`; bar element uses `style={{ width: \`${pct}%\` }}` inside a fixed `h-2 bg-gray-200 rounded` container for zero CLS
- "Verified Booking" badge: `<span className="bg-secondary-forest/10 text-secondary-forest text-xs font-semibold px-2 py-0.5 rounded-full">✓ Verified Booking</span>`
- Empty state: when `ratingCount === 0`, render a friendly invite message instead of the scorecard
- Review cards: use `<article>` semantic element

---

### Milestone 4: Administrative Moderation & Automated Calculator Hook

#### 4a: Moderation Endpoint

**File**: `src/app/api/admin/reviews/moderate/route.ts`

**Actions**:
- Export async `PATCH(req: Request): Promise<Response>` Route Handler
- Auth check (placeholder header/session check; returns `401` if not authenticated)
- Parse `{ reviewId, status }` from body; validate `status ∈ { 'APPROVED', 'REJECTED' }` → `400` if invalid
- Delegate to `calculateTourRatings(tx, tourId)` inside a `prisma.$transaction` when status is `'APPROVED'`:
  ```typescript
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({ where: { id: reviewId }, data: { status } });
    if (status === 'APPROVED') {
      return calculateTourRatings(tx, updated.tourId);
    }
    return { tourId: updated.tourId, ratingAverage: null, ratingCount: null };
  });
  ```
- Return `200` with `{ success: true, data: { reviewId, status, ...result } }`
- Return `404` if `review.update` throws a `P2025` Prisma not-found error

#### 4b: Rating Calculation Engine

**File**: `src/utils/calculateTourRatings.ts`

**Signature**:
```typescript
export async function calculateTourRatings(
  tx: Prisma.TransactionClient,
  tourId: string,
): Promise<{ tourId: string; ratingAverage: number; ratingCount: number }>;
```

**Logic**:
1. `tx.review.aggregate({ where: { tourId, status: 'APPROVED' }, _avg: { rating: true }, _count: { rating: true } })`
2. `ratingAverage = Math.round((aggregates._avg.rating ?? 0) * 10) / 10` — one decimal place rounding
3. `ratingCount = aggregates._count.rating ?? 0`
4. `tx.tour.update({ where: { id: tourId }, data: { ratingAverage, ratingCount } })`
5. Return `{ tourId, ratingAverage, ratingCount }`

**Edge cases handled**:
- Zero approved reviews after rejection: `_avg.rating` returns `null` → defaulted to `0.0`, `ratingCount` → `0`
- Rounding: `4.75 → 4.8`, `4.74 → 4.7` via `Math.round(x * 10) / 10`

---

## Complexity Tracking

No constitution violations. Complexity is well-bounded. All added files are single-responsibility. The only cross-cutting concern is the `calculateTourRatings` utility, deliberately extracted for testability.

## Verification Plan

### Schema
```bash
npx prisma validate
npx prisma db push
```

### Unit Tests (Vitest)
- `tests/unit/calculateTourRatings.test.ts` — cover: multi-review average, single review, zero reviews, rounding correctness
- `tests/unit/reviewSubmission.test.ts` — cover: all 4 gate failures (not found, not confirmed, wrong tour, duplicate), success path

### E2E Tests (Playwright)
- `tests/e2e/moderation-flow.spec.ts` — submit review → admin approve → verify `Tour.ratingAverage` updated on public page

### Manual Smoke Test
```bash
# Submit review
curl -X POST http://localhost:3000/api/public/reviews/submit \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"<confirmed-id>","tourId":"<tour-id>","customerName":"Jane","rating":5,"comment":"Excellent experience!"}'

# Moderate (approve)
curl -X PATCH http://localhost:3000/api/admin/reviews/moderate \
  -H "Content-Type: application/json" \
  -d '{"reviewId":"<review-id>","status":"APPROVED"}'
```