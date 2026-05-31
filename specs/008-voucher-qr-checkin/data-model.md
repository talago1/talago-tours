# Data Model: Automated Digital Tour Voucher & QR Check-In Engine

## Extended Entity: Booking (voucher and check-in fields)

The existing `Booking` model (from Features 006/007) is extended with the following fields:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| isCheckedIn | Boolean | default: false | Fast queryable flag — whether the tourist has been checked in |
| checkedInAt | DateTime? | default: null, nullable | ISO timestamp of the check-in event |
| checkInLog | Json | default: "[]", non-null | Append-only JSON array of audit entries for check-in events |

### checkInLog JSON Structure

```typescript
type CheckInLogEntry = {
  event: "QR_CHECK_IN";
  timestamp: string;  // ISO 8601 — when the scan occurred
  scanStatus: "SUCCESS";
};

// Stored as JSON array on the booking record, alongside paymentGatewayLogs
```

### Check-In Lifecycle

```
isCheckedIn: false (default)
       │
       ├── QR scanned + staff confirms check-in
       │   → isCheckedIn = true
       │   → checkedInAt = now()
       │   → checkInLog.push({ event: "QR_CHECK_IN", timestamp, scanStatus: "SUCCESS" })
       │
       └── (no backward transition — once checked in, always checked in)
```

| Field | Set By | Condition |
|-------|--------|-----------|
| `isCheckedIn: false` | Default | Booking created, no check-in yet |
| `isCheckedIn: true` | Verify endpoint | Staff confirms check-in via QR scan |
| `checkedInAt` | Verify endpoint | Same atomic transaction as isCheckedIn |
| `checkInLog[0]` | Verify endpoint | First (and only) QR_CHECK_IN audit entry |

## Interface: TicketVoucherProps (TypeScript)

```typescript
export interface TicketVoucherProps {
  params: {
    ref: string;  // Booking reference, e.g. "TLG-20260530-0001"
  };
}
```

## Interface: VerifiedVoucherPayload (TypeScript)

```typescript
export interface VerifiedVoucherPayload {
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  travelDate: string;    // Formatted date string
  hotelName: string;
  pickupTime: string;
  totalGuests: number;
  isCheckedIn: boolean;
}
```

## Interface: CheckInLogEntry (TypeScript)

```typescript
export type CheckInLogEntry = {
  event: "QR_CHECK_IN";
  timestamp: string;  // ISO 8601
  scanStatus: "SUCCESS";
};
```

## Interface: VerifyResponse (TypeScript)

```typescript
export type VerifyResponse = 
  | { success: true; checkedInAt: string; message: string }
  | { success: false; checkedInAt?: string; error: string };
```

## Prisma Schema Addition

Extend the Booking model (add to existing model):

```prisma
model Booking {
  // existing fields from Feature 006 (status, bookingReference, language, etc.)
  // existing fields from Feature 007 (paymentStatus, paymentGatewayLogs)

  isCheckedIn  Boolean    @default(false)
  checkedInAt  DateTime?
  checkInLog   Json       @default("[]")
}
```

## Validation Rules

1. `isCheckedIn` is a one-way transition: `false → true`. No backward transition.
2. `checkInLog` is append-only. A QR_CHECK_IN entry is pushed once and never removed or modified.
3. Before writing a new QR_CHECK_IN entry, the system must scan the existing `checkInLog` array for any existing QR_CHECK_IN event. If found, reject the request with 400.
4. `isCheckedIn`, `checkedInAt`, and `checkInLog` MUST be updated atomically within a single Prisma `$transaction`.
5. When `isCheckedIn` is true and `checkedInAt` is set, both MUST be consistent — the timestamp in `checkedInAt` MUST match the `timestamp` field of the QR_CHECK_IN entry in `checkInLog`.
