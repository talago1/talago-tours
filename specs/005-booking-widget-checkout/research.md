# Research: Booking Widget & Checkout Engine

## Testing Approach

**Decision**: Manual testing via spec's Independent Test scenarios for v1 delivery. No test framework currently configured in the project.

**Rationale**: Consistent with features 001-004. The spec defines 5 Independent Tests (one per user story) that can be manually executed. The Constitution's Verification section requires Zone Edge Calculation, Edge-Case Form Resilience, and Cross-Device Fluidity — these are covered by the spec's acceptance scenarios.

**Test scenarios for manual validation**:
1. Desktop: sticky sidebar visible, complete 2-step flow, verify redirect with reference
2. Mobile: floating bar visible, tap to open form, complete flow
3. Past dates blocked, phone validation, email validation, empty field errors
4. Double-click prevention — rapid submit clicks produce exactly one booking
5. Zone-based price adjustments reflected in real-time calculation

## Prisma Booking Model

**Decision**: Create a new Booking model in `prisma/schema.prisma` with fields matching the checkout form payload plus server-generated fields.

**Fields**:

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `bookingReference` | String (unique) | Format: `TLG-2026-XXXX` |
| `tourId` | String | Foreign key to Tour |
| `zoneId` | String | Pickup zone identifier |
| `hotelName` | String | Free text |
| `travelDate` | DateTime | Travel date (must be future) |
| `guestCount` | Int | Min 1 |
| `totalPriceUSD` | Float | Server-calculated |
| `customerName` | String | Required |
| `customerEmail` | String | Required, email format |
| `customerPhone` | String | Required, E.164 format |
| `status` | String | Default: "PENDING" |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Rationale**: The user explicitly specified "PENDING" status (not "confirmed" as in the clarified spec). The spec clarification was earlier about `confirmed`/`cancelled` binary, but the user's implementation input says `PENDING`. I'll follow the user's latest guidance — status is `PENDING` on creation (matches the booking workflow: pending → confirmed when admin processes it).

## Security Re-calculation (Server-Side Pricing)

**Decision**: The API endpoint MUST NOT trust client-provided `totalPriceUSD`. Instead, it fetches the Tour's per-person price and the selected Zone's transfer fee directly from the database and calculates the total server-side.

**Formula**: `totalPriceUSD = (tour.perPersonPrice * body.guestCount) + zone.transferFee`

**Flow**:
1. Parse body → extract tourId, zoneId, guestCount
2. Fetch Tour from DB by tourId → get `perPersonPrice`
3. Fetch Zone from DB by zoneId → get `transferFee` (or equivalent zone pricing field)
4. Calculate: `((perPersonPrice * guestCount) + transferFee)`
5. Store calculated totalPriceUSD in booking record

**Rationale**: Prevents client-side price tampering. The client can send `guestCount` and selections (which are UX-necessary), but the actual monetary value is computed server-side.

## Booking Reference Generation

**Decision**: Use Node.js `crypto.randomBytes()` to generate a cryptographically random 4-character uppercase alphanumeric string, prefixed with `TLG-2026-`.

**Implementation**:
```typescript
import crypto from 'crypto';

function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid ambiguity
  const bytes = crypto.randomBytes(4);
  const result = Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
  return `TLG-2026-${result}`;
}
```

**Uniqueness**: Add a unique constraint on `bookingReference` in the Prisma schema. If a collision occurs (extremely unlikely with 4 chars from 31-char alphabet = ~923K combinations), retry once.

**Rationale**: Crypto-random avoids sequential/guessable booking IDs. Omitted ambiguous characters (I/O/0/1) for human readability.

## Calendar / Date Picker

**Decision**: Use a native HTML `<input type="date">` with `min` attribute set to tomorrow's date. No third-party date library.

**Rationale**: Consistent with the spec's assumption of "standard browser date picker." Native date inputs are lightweight, accessible, and sufficient for single-day tour date selection.

## API Endpoint Design

**Endpoint**: `POST /api/bookings/checkout`

**Request body**:
```typescript
{
  tourId: string;
  zoneId: string;
  hotelName: string;
  travelDate: string;       // ISO date string
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}
```

**Response (200)**:
```typescript
{
  bookingReference: string;  // "TLG-2026-XXXX"
}
```

**Response (400)**:
```typescript
{
  error: string;
  field?: string;
}
```

**Response (500)**:
```typescript
{
  error: string;
}
```

**Validation rules**:
1. All required fields present
2. `travelDate` is a valid date string and is in the future (not today, not past)
3. `guestCount` >= 1
4. `customerName` length >= 2
5. `customerEmail` matches basic email regex
6. `customerPhone` matches E.164 format (+ followed by digits)

## Anti-Duplicate-Submit Strategy

**Decision**: Two-layer approach:
1. **Client-side**: Disable button immediately on click, apply `pointer-events-none opacity-50`, show loading spinner.
2. **Server-side**: The API endpoint is naturally idempotent for different booking references (each call generates a unique reference). No additional dedup key needed for v1.

**Rationale**: Since each submission generates a unique booking reference, accidental double-submits create two separate bookings (both valid). The client-side disable is sufficient to prevent this in practice. If server-side dedup becomes necessary, a request idempotency key can be added later.
