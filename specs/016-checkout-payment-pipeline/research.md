# Research: Hybrid Checkout & Payment Pipeline (Feature 016)

## Decision Log

### 1. PaymentScheme Implementation — Prisma Enum vs String
- **Decision**: Use Prisma native enum for PaymentScheme with values FULL_ONLINE, DEPOSIT_ONLINE, PAY_ON_ARRIVAL
- **Rationale**: The user explicitly defines these as a Prisma enum in the specification. Enums provide DB-level type safety and clear semantic meaning. The three values are fixed and not expected to grow dynamically.
- **Alternatives considered**: String column with app-level validation (less DB enforcement), integer mapping (less readable)

### 2. PaymentProvider — Dual Gateway Support
- **Decision**: Support both Paymob and Fawry as PaymentProvider enum values, selected dynamically based on availability or tourist preference
- **Rationale**: The spec explicitly mentions both gateways. Paymob handles card payments; Fawry handles mobile wallets. Both are widely used in Egypt. The provider choice is stored on the Transaction record for audit trail.
- **Alternatives considered**: Single gateway (limits payment options), gateway abstraction layer (over-engineered for two providers)

### 3. Capacity Checking — Booking-Based vs Dedicated Model
- **Decision**: Check capacity by counting CONFIRMED bookings for the given tour + departureDate, compared against the Tour's `maxCapacity` field (to be added to Tour model)
- **Rationale**: Avoids a separate TourCapacitySchedule entity. The Tour model gains a `maxCapacity Int?` field. At booking time, count existing CONFIRMED bookings with the same departureDate and tourId. If count >= maxCapacity, reject. This is simple, atomic, and avoids stale schedule state.
- **Alternatives considered**: Dedicated CapacitySchedule model (more tables to sync), date-specific capacity table (larger scope for this feature)

### 4. Deposit Percentage — Fixed vs Per-Tour
- **Decision**: Fixed 20% deposit rate configured as a constant/environment variable — same rate for all tours
- **Rationale**: The spec assumes fixed 20%. Per-tour deposit rates would require adding a `depositPercentage` field to the Tour model and form UI for setting it, which is out of scope for this feature. The rate can be changed via environment config.
- **Alternatives considered**: Per-tour deposit rate (more flexible but larger scope), no deposit option (only FULL_ONLINE and PAY_ON_ARRIVAL, less flexible)

### 5. Price Calculation — Server-Side Only
- **Decision**: All pricing calculations happen server-side in the initialize API. The client sends the chosen PaymentScheme and guest count; the server computes `amountPaidOnline` and `amountDueOnArrival` from the tour's basePrice.
- **Rationale**: Prevents client-side price manipulation. The server is the single source of truth for all financial calculations.
- **Alternatives considered**: Client-side calculation with server verification (more complex, same security benefit via server override)

### 6. Paymob Integration Pattern — Iframe Redirect
- **Decision**: Use Paymob's iframe-based payment flow (obtain payment_key → return iframe URL → redirect tourist). Fawry uses a similar hosted page flow.
- **Rationale**: Existing Feature 007 pattern used iframe redirect. It's the standard Paymob integration. The initialize API returns the iframe URL, and the checkout page redirects (or embeds) it.
- **Alternatives considered**: Direct API (less secure, exposes tokens), hosted page only (less control)

### 7. Webhook HMAC — SHA-256 with Alphanumeric Sort
- **Decision**: Use HMAC-SHA256 with alphanumeric key sorting (consistent with Feature 007 pattern)
- **Rationale**: Already established in Feature 007 as the TALAGO webhook pattern. Alphanumeric sort + constant-time comparison. Reuses the same approach for consistency.
- **Alternatives considered**: Plain signature comparison (timing attack vulnerability), different hash algorithm (inconsistent with existing patterns)

### 8. Webhook Atomic State Transitions
- **Decision**: Use Prisma `$transaction` for atomic updates: Transaction.status → SUCCESS, Booking.status → CONFIRMED in a single transaction
- **Rationale**: Prevents partial state updates where Transaction succeeds but Booking doesn't update (or vice versa). Consistent with Feature 007 atomicity requirement.
- **Alternatives considered**: Sequential updates without transaction (race condition risk), two-phase commit (over-engineered)

### 9. Currency — Single EGP with Decimal Precision
- **Decision**: Use Prisma Decimal type for all monetary fields (amountPaidOnline, amountDueOnArrival), defaulting to EGP
- **Rationale**: The constitution mandates Postgres Decimal for financial precision (Section IV). EGP is the primary currency for Red Sea tourism operations. Multi-currency is explicitly out of scope.
- **Alternatives considered**: Integer cents (loses precision for fractions), float (rounding errors)

### 10. Checkout Order of Operations
- **Decision**: Check capacity FIRST, then calculate pricing. This ensures the tourist isn't shown a price breakdown for a sold-out date.
- **Rationale**: Better UX — fail fast on capacity before the tourist fills in payment details. The sequence is: load checkout → check capacity → show form + pricing → submit → initialize.
- **Alternatives considered**: Check capacity at submission only (tolerates stale capacity display), check at page load only (race condition if another booking fills capacity between load and submit)

## Best Practices

### Calculate Split Fractions
```typescript
function calculatePaymentSplit(
  basePrice: Decimal,
  guestCount: number,
  scheme: PaymentScheme
): { amountPaidOnline: Decimal; amountDueOnArrival: Decimal } {
  const total = basePrice.mul(guestCount);
  switch (scheme) {
    case 'FULL_ONLINE':
      return { amountPaidOnline: total, amountDueOnArrival: new Decimal(0) };
    case 'DEPOSIT_ONLINE':
      const deposit = total.mul(0.2);
      return { amountPaidOnline: deposit, amountDueOnArrival: total.sub(deposit) };
    case 'PAY_ON_ARRIVAL':
      return { amountPaidOnline: new Decimal(0), amountDueOnArrival: total };
  }
}
```

### Capacity Check Pattern
```typescript
async function checkCapacity(tourId: string, departureDate: Date): Promise<boolean> {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { maxCapacity: true },
  });
  if (!tour?.maxCapacity) return true; // no capacity limit

  const confirmedCount = await prisma.booking.count({
    where: {
      tourId,
      departureDate,
      status: 'CONFIRMED',
    },
  });

  return confirmedCount < tour.maxCapacity;
}
```

### Webhook HMAC Verification Pattern
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  const received = Buffer.from(signature, 'hex');
  const expected = Buffer.from(computed, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
```

### Atomic Transaction Update Pattern
```typescript
async function processPaymentCallback(gatewayReference: string) {
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.update({
      where: { gatewayReference },
      data: { status: 'SUCCESS' },
    });

    await tx.booking.update({
      where: { id: transaction.bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Fire downstream tasks (QR, manifest)
    await enqueuePostPaymentTasks(transaction);
  });
}
```
