# Research: Digital Booking Voucher & Mobile QR Scanner (Feature 012)

## Decision Log

### 1. QR Token Cryptography
- **Decision**: HMAC-SHA256 with server-side secret, no encryption
- **Rationale**: HMAC-SHA256 provides integrity verification (detects tampering) without the complexity of encryption/decryption. The payload (bookingId + timestamp) is signed, and the verify endpoint re-computes the HMAC to validate authenticity. Consistent with existing Paymob HMAC pattern (Feature 007).
- **Alternatives considered**: AES-GCM encryption (added complexity, no additional security benefit since payload is verified server-side), JWT (overkill for single-field verification)

### 2. QR Code Generation
- **Decision**: Pure TypeScript SVG QR generator (zero dependencies)
- **Rationale**: Consistent with Feature 008 convention. SVG renders crisply at any size for print. No server-side processing or third-party CDN dependencies.
- **Alternatives considered**: qrcode npm package (dependency), QR code API service (network dependency)

### 3. Camera QR Decoding Strategy
- **Decision**: Browser native `BarcodeDetector` API with lightweight JS fallback
- **Rationale**: BarcodeDetector is supported in recent Chrome-based mobile browsers (which covers the target audience of Android guides). A lightweight JS fallback (jsQR or similar decode loop on canvas frames) covers unsupported browsers. No heavy third-party scanner libraries.
- **Alternatives considered**: Third-party npm scanner (bloated), server-side decode (requires image upload — slow)

### 4. Scanner UI Rendering
- **Decision**: CSS-only targeting reticle with Tailwind keyframes for scan line animation
- **Rationale**: Zero additional dependencies. The reticle is a CSS border box overlay; the scan line is a positioned div with translate-y animation via Tailwind's `animate-pulse`. Camera feed renders in a hidden `<video>` element, canvas captures frames for decode.
- **Alternatives considered**: Canvas-only rendering (more complex), third-party scanner UI libraries (banned by constitution)

### 5. Voucher Page Route
- **Decision**: `/tours/voucher/[id]` — public page with Prisma status check
- **Rationale**: Separate from the existing 008 route (`/tours/checkout/voucher/[ref]`). New route uses booking ID (not reference) and adds cryptographic QR payload. Status check (CONFIRMED only) enforced server-side.
- **Alternatives considered**: Reusing 008 route (migration complexity, breaking existing links)

### 6. Verify Endpoint Pattern
- **Decision**: POST with HMAC-verified token; atomic Prisma `$transaction` for check-in
- **Rationale**: POST prevents caching of the action. HMAC verification happens before DB write. `$transaction` ensures isCheckedIn + checkedInAt + checkInLog update atomically. Early 400 return if already checked in prevents unnecessary DB writes.
- **Alternatives considered**: GET with URL params (cachable — security risk), single-field update without transaction (inconsistent state)

### 7. Feature 008 Coexistence
- **Decision**: Feature 012 augments 008 — both flows work in parallel
- **Rationale**: Existing URL-based QR check-in (guide opens URL in browser) remains for backward compatibility. New camera scanner provides a faster UX but both lead to the same verify endpoint logic. Feature 008 voucher URLs continue to work.
- **Alternatives considered**: Full replacement of 008 (breaks existing workflows)

## Best Practices

### HMAC Token Generation
```typescript
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.QR_HMAC_SECRET!;

function generateToken(bookingId: string): string {
  const timestamp = Date.now();
  const payload = `${bookingId}:${timestamp}`;
  const hmac = createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

function verifyToken(token: string): { bookingId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [bookingId, timestampStr, hmac] = decoded.split(':');
    const expected = createHmac('sha256', SECRET)
      .update(`${bookingId}:${timestampStr}`)
      .digest('hex');
    if (!timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
    return { bookingId, timestamp: parseInt(timestampStr, 10) };
  } catch { return null; }
}
```

### Camera Stream Setup
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
});
video.srcObject = stream;
```

### BarcodeDetector Decode Loop
```typescript
async function scanFrame() {
  if (!video.videoWidth) { requestAnimationFrame(scanFrame); return; }
  try {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const barcodes = await detector.detect(video);
    if (barcodes.length > 0) {
      navigator.vibrate?.(200);
      onDecode(barcodes[0].rawValue);
      return;
    }
  } catch { /* fallback to canvas-based decode */ }
  requestAnimationFrame(scanFrame);
}
```

### Atomic Check-In Transaction
```typescript
await prisma.$transaction(async (tx) => {
  const booking = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (booking.isCheckedIn) throw new AppError(400, 'Already checked in');
  return tx.booking.update({
    where: { id: bookingId },
    data: {
      isCheckedIn: true,
      checkedInAt: new Date(),
      checkInLog: [...(booking.checkInLog as any[]), { event: 'QR_SCAN', timestamp: new Date().toISOString(), scanStatus: 'SUCCESS' }],
    },
  });
});
```
