# API Contract: Admin Verify Check-In

## PATCH /api/admin/bookings/verify/[ref]

Admin-only endpoint called when staff scans a QR code and confirms check-in. Protected by the existing admin authentication system.

### Route Parameter

| Param | Type | Description |
|-------|------|-------------|
| ref | string | Booking reference, e.g. "TLG-20260530-0001" |

### Authentication

Staff must be logged into the admin system before accessing this endpoint. The QR code alone does not provide authentication (FR-015). Session established at shift start.

### Request

```json
{
  "action": "confirm_checkin"
}
```

### Response 200 — Check-In Successful

```json
{
  "success": true,
  "checkedInAt": "2026-05-30T08:15:30.000Z",
  "message": "Check-in confirmed for TLG-20260530-0001"
}
```

Server-side effects (within Prisma `$transaction`):
1. `Booking.isCheckedIn` set to `true`
2. `Booking.checkedInAt` set to current timestamp
3. `Booking.checkInLog` appended with `{ event: "QR_CHECK_IN", timestamp: "2026-05-30T08:15:30.000Z", scanStatus: "SUCCESS" }`

### Response 400 — Duplicate Check-In

```json
{
  "success": false,
  "checkedInAt": "2026-05-30T08:15:30.000Z",
  "error": "Voucher already claimed at 2026-05-30T08:15:30.000Z"
}
```

Triggered when `checkInLog` already contains a QR_CHECK_IN entry.

### Response 401 — Unauthorized

```json
{
  "error": "Unauthorized"
}
```

Returned when no valid admin session is present.

### Response 404 — Booking Not Found

```json
{
  "error": "Booking not found"
}
```

### Response 400 — Invalid Action

```json
{
  "error": "Invalid action. Expected: confirm_checkin"
}
```

### Prisma Transaction Detail

```typescript
await prisma.$transaction(async (tx) => {
  const booking = await tx.booking.findUnique({
    where: { bookingReference: ref },
  });

  if (!booking) throw new NotFoundError();

  const logs = booking.checkInLog as CheckInLogEntry[];
  const existingCheckIn = logs.find((l) => l.event === "QR_CHECK_IN");
  if (existingCheckIn) {
    throw new DuplicateCheckInError(existingCheckIn.timestamp);
  }

  const timestamp = new Date().toISOString();
  const newEntry: CheckInLogEntry = {
    event: "QR_CHECK_IN",
    timestamp,
    scanStatus: "SUCCESS",
  };

  return tx.booking.update({
    where: { bookingReference: ref },
    data: {
      isCheckedIn: true,
      checkedInAt: new Date(),
      checkInLog: [...logs, newEntry],
    },
  });
});
```
