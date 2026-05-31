# Data Model: Hybrid Checkout & Payment Pipeline

## Enums

```prisma
enum PaymentScheme {
  FULL_ONLINE       // 100% paid online, nothing on arrival
  DEPOSIT_ONLINE    // 20% deposit online, 80% due on arrival
  PAY_ON_ARRIVAL    // 100% cash on arrival
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

enum PaymentProvider {
  PAYMOB
  FAWRY
  CASH     // For PAY_ON_ARRIVAL — no online provider
}
```

## New Entity: Transaction

Represents a single payment attempt linked to a booking. One booking has exactly one Transaction (1:1).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id @default(uuid()) | Primary key |
| bookingId | String | @unique | FK to Booking |
| booking | Booking | @relation(fields: [bookingId], references: [id]) | Parent booking |
| provider | PaymentProvider | | Which gateway was used |
| gatewayReference | String? | @unique | Transaction token/reference from Paymob or Fawry |
| amountPaidOnline | Decimal | @default(0) | Amount collected via gateway |
| amountDueOnArrival | Decimal | @default(0) | Cash to collect on tour day |
| currency | String | @default("EGP") | ISO currency code |
| scheme | PaymentScheme | @default(FULL_ONLINE) | Which payment strategy was chosen |
| status | PaymentStatus | @default(PENDING) | Current payment state |
| createdAt | DateTime | @default(now()) | |
| updatedAt | DateTime | @updatedAt | |

**Relations:**
- `booking Booking` — one-to-one with Booking

## Extended Entity: Booking

The existing Booking model gains the following fields:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| paymentScheme | PaymentScheme? | optional | Which scheme was chosen at checkout |
| amountPaidOnline | Decimal? | optional | Amount paid via gateway (snapshot) |
| amountDueOnArrival | Decimal? | optional | Cash due on tour day (snapshot) |
| maxCapacity | Int? | optional | Per-tour passenger limit (added to Tour) |

**Note**: `maxCapacity` lives on the Tour model, not Booking. Added here for reference.

## Extended Entity: Tour

The existing Tour model gains:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| maxCapacity | Int? | optional | Maximum passengers per departure date; null = unlimited |

## Validation Rules

1. **Transaction-Booking 1:1**: Enforced by `@unique` on `bookingId` — each booking has exactly one Transaction
2. **gatewayReference uniqueness**: Enforced by `@unique` — prevents duplicate webhook processing
3. **amountPaidOnline + amountDueOnArrival**: Must equal `basePrice × guestCount` (validated server-side at initialization)
4. **FULL_ONLINE**: amountDueOnArrival MUST be 0
5. **PAY_ON_ARRIVAL**: amountPaidOnline MUST be 0
6. **DEPOSIT_ONLINE**: amountPaidOnline MUST equal 20% of total (validated server-side)
7. **Capacity check**: Booking is only created if CONFIRMED count < Tour.maxCapacity for the given departureDate
8. **Currency**: EGP only (multi-currency out of scope)

## State Transitions

```
PAY_ON_ARRIVAL:
  Checkout submit → capacity check → create Booking (CONFIRMED) + Transaction (PENDING, provider=CASH)
    → Guide sees amountDueOnArrival on manifest
    → Cash collected on tour day (manual — no system status change)

FULL_ONLINE / DEPOSIT_ONLINE:
  Checkout submit → capacity check → create Booking (PENDING) + Transaction (PENDING, provider=PAYMOB/FAWRY)
    → Initiate gateway handshake → return iframe URL
    → Tourist completes payment on gateway
    → Webhook received → HMAC verify → Transaction → SUCCESS, Booking → CONFIRMED
    → If DEPOSIT_ONLINE: amountDueOnArrival > 0, flagged in manifest
    → Trigger QR voucher generation
```

## TypeScript Interfaces

```typescript
export enum PaymentScheme {
  FULL_ONLINE = 'FULL_ONLINE',
  DEPOSIT_ONLINE = 'DEPOSIT_ONLINE',
  PAY_ON_ARRIVAL = 'PAY_ON_ARRIVAL',
}

export type PaymentSchemeType = `${PaymentScheme}`;

export interface CheckoutFormData {
  leadName: string;
  email: string;
  phone: string;
  hotelName: string;
  roomNumber?: string;
  pickupTime: string;
  paymentScheme: PaymentScheme;
}

export interface InitializeRequest {
  tourId: string;
  departureDate: string;
  guestCount: number;
  formData: CheckoutFormData;
}

export interface InitializeResponse {
  bookingId: string;
  transactionId: string;
  amountPaidOnline: number;
  amountDueOnArrival: number;
  scheme: PaymentScheme;
  gatewayIframeUrl?: string;    // Only for online schemes
  confirmationUrl?: string;      // Return URL after gateway completion
}

export interface PriceBreakdown {
  total: number;
  amountPaidOnline: number;
  amountDueOnArrival: number;
  scheme: PaymentScheme;
}
```
