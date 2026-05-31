# Contract: POST /api/checkout/initialize

## Purpose
Server-side order gate controller that validates capacity, computes pricing splits, and either creates a Pay on Arrival booking or initiates a payment gateway session.

## Request

**Method**: POST
**Auth Required**: No (public, session-scoped)
**Content-Type**: application/json

```json
{
  "tourId": "clx...",
  "departureDate": "2026-06-15",
  "guestCount": 2,
  "formData": {
    "leadName": "John Smith",
    "email": "john@example.com",
    "phone": "+201234567890",
    "hotelName": "Hurghada Marriott Beach Resort",
    "roomNumber": "204",
    "pickupTime": "08:30",
    "paymentScheme": "FULL_ONLINE"
  }
}
```

## Response

### Success — Online Payment Scheme (200)
For FULL_ONLINE or DEPOSIT_ONLINE — creates PENDING booking + transaction, returns gateway iframe URL.

```json
{
  "bookingId": "uuid-booking",
  "transactionId": "uuid-txn",
  "amountPaidOnline": 150.00,
  "amountDueOnArrival": 0.00,
  "scheme": "FULL_ONLINE",
  "gatewayIframeUrl": "https://accept.paymob.com/api/acceptance/iframes/...?payment_token=...",
  "confirmationUrl": "https://talago.com/booking/uuid-booking/confirmation"
}
```

### Success — Pay on Arrival (200)
For PAY_ON_ARRIVAL — creates CONFIRMED booking + PENDING transaction, returns confirmation directly.

```json
{
  "bookingId": "uuid-booking",
  "transactionId": "uuid-txn",
  "amountPaidOnline": 0.00,
  "amountDueOnArrival": 150.00,
  "scheme": "PAY_ON_ARRIVAL"
}
```

### Capacity Exceeded (409)
```json
{
  "error": "This tour is sold out for June 15, 2026. Please select another date.",
  "code": "CAPACITY_EXCEEDED"
}
```

### Validation Error (400)
```json
{
  "error": "Email format is invalid",
  "code": "VALIDATION_ERROR",
  "fields": {
    "email": "Invalid email address"
  }
}
```

### Gateway Error (502)
```json
{
  "error": "Payment gateway is temporarily unavailable. Please try again or choose Pay on Arrival.",
  "code": "GATEWAY_UNAVAILABLE"
}
```

## Implementation Notes

- Check capacity BEFORE creating any records: count CONFIRMED bookings for tourId + departureDate, compare to Tour.maxCapacity
- Compute splits server-side: `total = basePrice * guestCount`; apply scheme fractions
- For CASH provider (PAY_ON_ARRIVAL):
  - Create Booking with status=CONFIRMED
  - Create Transaction with status=PENDING, provider=CASH
  - Return immediately (no gateway call)
- For online schemes (PAYMOB/FAWRY):
  - Create Booking with status=PENDING
  - Create Transaction with status=PENDING
  - Perform gateway handshake (auth → order → payment key → iframe URL)
  - Return gatewayIframeUrl
- Return appropriate HTTP codes for capacity (409), validation (400), gateway failure (502)
- Store the paymentScheme, amountPaidOnline, amountDueOnArrival on BOTH the Booking (snapshot) and Transaction (authoritative)
