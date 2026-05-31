# Research: Dynamic Promo Codes, Variable Pricing Rules & Coupon Campaign Engine

**Date**: 2026-05-31  
**Feature**: 019-promo-codes-campaigns

## Decision 1: Atomic Usage-Count Increment

### Decision
Use Prisma interactive transaction (`prisma.$transaction`) with a read-verify-write pattern inside the same transaction that creates the booking record. The usage count is checked *and* incremented atomically to prevent race conditions when concurrent checkout requests compete for the last available slot.

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Re-validate promo inside transaction (fresh read with row-level lock)
  const promo = await tx.promoCode.findUniqueOrThrow({
    where: { id: promoCodeId },
  });

  if (!promo.isActive || promo.usedCount >= promo.maxUses || new Date() > promo.expiresAt) {
    throw new Error('PROMO_INVALID');
  }

  // 2. Increment usage count
  await tx.promoCode.update({
    where: { id: promoCodeId },
    data: { usedCount: { increment: 1 } },
  });

  // 3. Create booking with promo reference
  await tx.booking.create({ data: { ...bookingData, promoCodeId } });
});
```

### Rationale
- `increment: 1` is atomic at the database level — PostgreSQL handles the lock, not the application layer.
- Wrapping both the count increment and booking creation in a single transaction guarantees that a usage slot is never consumed unless a booking is actually created.
- Eliminates the TOCTOU (time-of-check/time-of-use) vulnerability present in two-phase read-then-write patterns.

### Alternatives Considered
- **Optimistic locking with version field**: Adds complexity (retry logic) with no benefit because the increment operation itself is atomic.
- **Application-level mutex (Redis lock)**: Overkill for single-region, single-instance deployment. Prisma transaction provides sufficient isolation.

---

## Decision 2: Monetary Precision with Prisma Decimal

### Decision
Use Prisma's built-in `Decimal` type for all monetary fields (`discountValue`, `minBookingValue`, booking pricing). The `Decimal` type maps to PostgreSQL's `NUMERIC` type, providing exact precision without floating-point rounding errors.

### Rationale
- PostgreSQL `NUMERIC` stores exact decimal values — critical for financial calculations (discounts, booking totals).
- Prisma's `Decimal` returns a `Decimal.js` instance on read, which supports chained math operations without precision loss.
- No additional dependency required (built into `@prisma/client`).

### Alternatives Considered
- **JavaScript `number`**: Rejected — floating-point arithmetic introduces rounding errors (e.g., `0.1 + 0.2 !== 0.3`).
- **Big.js / decimal.js as external lib**: Unnecessary — Prisma Decimal already wraps Decimal.js internally.

---

## Decision 3: Case-Insensitive Promo Code Lookup

### Decision
Store the promo `code` in a consistent casing (lowercase) at creation time and convert user input to lowercase before querying. Maintain `@unique` constraint on the `code` column. Use a database-level index on `[code, isActive]` for fast filtered lookups.

### Rationale
- PostgreSQL string comparisons are case-sensitive by default. Converting both stored and input values to lowercase eliminates case-mismatch UX friction (e.g., "SUMMER25" vs "summer25").
- The `@@index([code, isActive])` composite index covers the most common query pattern: looking up a specific code that is currently active.
- Simpler and more performant than using `citext` extension or `LOWER()` function in every query.

### Alternatives Considered
- **PostgreSQL `citext` extension**: Avoids the need to normalize casing in application code, but adds an extension dependency and doesn't integrate as cleanly with Prisma migrations.
- **`LOWER()` in `WHERE` clause**: Prevents index usage unless a functional index is created. More complex to maintain.

---

## Decision 4: Validation Endpoint Design — POST with full payload

### Decision
The promo validation API uses `POST /api/public/promo/validate` with a JSON body containing `{ code, bookingValue, currency }`. Returns full discount details on success, or a descriptive error on failure.

### Rationale
- POST is appropriate for a state-reading operation that depends on payload data (booking context) and has side-conditions (no mutation, but the operation is not idempotent-safe as a GET cache).
- JSON body allows structured input with proper TypeScript validation.
- Returns calculated discount values so the client can render the price breakdown without performing its own math.

### Alternatives Considered
- **GET with query params**: Booking value and currency in query string is technically possible but less ergonomic for structured validation. URLs may be logged server-side exposing pricing data.

---

## Decision 5: Discount Floor Protection

### Decision
Apply the discount against the booking subtotal, then clamp the final total to `max(0, subtotal - discountAmount)` so the total is never negative.

### Rationale
- Prevents negative-pricing exploits where a fixed-amount discount larger than the booking value would otherwise result in a "negative balance" or store credit.
- Straightforward `Math.max` clamp at the point of calculation in `utils/promo.ts`.

### Alternatives Considered
- **Reject the promo if discount > subtotal**: Creates a poor UX — the customer has a valid code they can't use on a low-value booking.
- **Store credit for remainder**: Out of scope (no credit/wallet system exists yet).
