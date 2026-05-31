# Feature 012: Digital Booking Voucher & Mobile QR Scanner — Quickstart

## Files to Create/Modify

| # | File | Action |
|---|------|--------|
| 1 | `src/utils/qrTokenCrypto.ts` | Create (HMAC token signing/verification) |
| 2 | `src/app/tours/boarding-pass/[id]/page.tsx` | Create (public boarding pass page) |
| 3 | `src/components/admin/QRScannerTerminal.tsx` | Create (camera scanner) |
| 4 | `src/app/api/admin/operations/verify-qr/route.ts` | Create (verify endpoint) |
| 5 | `src/app/admin/operations/scan/page.tsx` | Create (admin scanner page) |

## Steps

### 1. Crypto Utility
Create `qrTokenCrypto.ts` with `generateToken(bookingId)` and `verifyToken(token)` using Node `crypto` HMAC-SHA256.

### 2. Voucher Page
Create `app/tours/voucher/[id]/page.tsx` — query Booking by ID, verify CONFIRMED, render boarding pass with SVG QR code.

### 3. Verify API
Create `app/api/admin/operations/verify-qr/route.ts` — POST handler with admin auth, HMAC verification, atomic check-in.

### 4. QR Scanner
Create `components/admin/QRScannerTerminal.tsx` — camera stream via getUserMedia, reticle + scan line overlay, BarcodeDetector decode loop, haptic vibration, result display.

### 5. Admin Scanner Page
Create `app/admin/operations/scan/page.tsx` — page hosting QRScannerTerminal.

### 6. Agent Context
Update `AGENTS.md` plan reference to point to this directory.

## Key Interfaces

```typescript
interface QRTokenPayload {
  bookingId: string;
  timestamp: number;
}

interface ScanVerificationResult {
  success: boolean;
  passengerName?: string;
  tourTitle?: string;
  paxCount?: number;
  hotelName?: string;
  roomNumber?: string | null;
  error?: string;
}
```

## Architecture Flow

```
Voucher:
  Booking confirmed → Voucher page generates HMAC token → SVG QR encodes token → Tourist views/prints

Scanner:
  Guide opens scanner → camera activates → reticle + scan line animate
  → QR detected → token decoded → POST /api/admin/operations/verify-qr
  → HMAC verified → atomic check-in → green success card with traveller details
```
