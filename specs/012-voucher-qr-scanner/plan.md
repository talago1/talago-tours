# Implementation Plan: Digital Booking Voucher & Mobile QR Scanner (Feature 012)

## Technical Context

- **Stack**: Next.js App Router, TypeScript, TailwindCSS, Prisma Client (PostgreSQL)
- **Cryptography**: Node `crypto` module — HMAC-SHA256 token signing and verification
- **QR Generation**: Pure TypeScript SVG (zero dependencies) — consistent with Feature 008
- **QR Decoding**: Browser native `BarcodeDetector` API with lightweight JS fallback
- **Camera**: `navigator.mediaDevices.getUserMedia` with `facingMode: 'environment'`
- **Haptics**: `Navigator.vibrate` API — silent fail if unsupported
- **Print**: Tailwind `print:` utility modifiers
- **Auth**: Existing admin middleware for verify endpoint; voucher page is public

## Constitution Check

### I. Code Quality & Architecture Principles
- ✅ Server-First Mindset: Voucher page fetches data server-side; `"use client"` only for scanner terminal
- ✅ Strict Type-Safety: Full TypeScript interfaces for QRTokenPayload, ScanVerificationResult, API responses
- ✅ Zero Tailwind Bloat: Componentized QRScannerTerminal, BookingVoucher with reusable styles
- ✅ Semantic HTML: `<main>`, `<section>`, `<article>` for voucher layout

### II. Performance Requirements
- ✅ CLS = 0: Fixed dimensions for camera viewport, skeleton states during loading
- ✅ LCP ≤ 1.5s: Voucher page loads in under 2s (SC-001)
- ✅ Zero Third-Party Animation: Native Tailwind `animate-pulse` for scan line and reticle
- ✅ Media Treatment: No image processing — camera feed rendered directly to video element

### III. UX Consistency & Conversion
- ✅ Coral #FF5B00: Scanner targeting reticle border per spec
- ✅ Haptic verification feedback on successful decode
- ✅ Green success card after check-in confirmation

### IV. Verification & Testing Standards
- ✅ Token HMAC verification — prevents forgery
- ✅ Atomic DB transaction — prevents race conditions
- ✅ Duplicate check-in detection — clear 400 response

**Gate status**: ✅ All checks pass — no violations or unjustified deviations.

## Scope

### In Scope
- `utils/qrTokenCrypto.ts` — HMAC-SHA256 signing and verification utilities
- `app/tours/voucher/[id]/page.tsx` — public voucher page with print-optimized boarding pass
- `components/admin/QRScannerTerminal.tsx` — mobile camera scanner with reticle + scan line + haptic feedback
- `app/api/admin/operations/verify-qr/route.ts` — POST endpoint for token verification + atomic check-in
- SVG QR code generation (pure TypeScript, no dependencies)
- Tailwind `print:` modifiers for A4 voucher output
- Admin page to host the scanner component

### Out of Scope
- Manual booking reference lookup (fallback, not implemented in v1)
- Email/SMS delivery of voucher (handled by Features 005/006)
- Multi-booking batch check-in
- Offline QR generation (requires server for HMAC signing)

## Milestones

### M1: Cryptographic Token Utilities
- **Files**: `src/utils/qrTokenCrypto.ts`
- **Action**: HMAC-SHA256 generateToken(bookingId) and verifyToken(token) helpers

### M2: Public Voucher Page
- **Files**: `src/app/tours/voucher/[id]/page.tsx`
- **Action**: Server component — query Booking by ID, verify CONFIRMED status, render boarding pass with QR code

### M3: QR Scanner Terminal
- **Files**: `src/components/admin/QRScannerTerminal.tsx`
- **Action**: Client component — camera stream, reticle overlay, scan line animation, BarcodeDetector decode loop, haptic feedback

### M4: Verify API Endpoint
- **Files**: `src/app/api/admin/operations/verify-qr/route.ts`
- **Action**: POST handler — admin auth, HMAC verification, atomic check-in transaction, response with traveller metadata

### M5: Admin Scanner Page
- **Files**: `src/app/admin/operations/scan/page.tsx`
- **Action**: Admin page composing QRScannerTerminal with result display

### M6: Agent Context Update
- **Files**: `AGENTS.md`
- **Action**: Update plan reference to point to 012-voucher-qr-scanner/plan.md

## Dependencies
- Feature 008: Booking model must have isCheckedIn, checkedInAt, checkInLog fields
- Environment variable: `QR_HMAC_SECRET` must be set
- Admin auth middleware: Must reject unauthenticated requests
- Browser camera API: Must be available (mobile device)

## Risks
- **BarcodeDetector not supported**: Mitigated by JS fallback decode loop on canvas
- **Camera permission denied**: Handled by error state with instructions (FR-010)
- **Concurrent scans on same booking**: Mitigated by atomic Prisma transaction
- **Token replay**: Mitigated by single-use check-in (isCheckedIn prevents re-use) + optional timestamp expiry
