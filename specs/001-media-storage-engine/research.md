# Research: Media & Storage Engine

## Overview

All technical decisions for this feature were pre-specified by the user's milestone input. This document records the rationale for each choice and confirms alignment with TALAGO's architecture.

## Resolved Decisions

### Client-Side Image Compression via Canvas

**Decision**: Use browser-native HTML5 Canvas API to downscale and re-encode images to WebP.

**Rationale**:
- Zero additional dependencies — Canvas is built into all modern browsers
- Eliminates server-side processing load and bandwidth costs
- WebP provides superior compression over JPEG at equivalent quality levels
- Quality factor 0.80 balances visual fidelity (critical for tourism photography) with file size reduction

**Alternatives Considered**:
- Server-side Sharp/ImageMagick: Adds server CPU load, requires streaming large files to server first
- Third-party compression libraries (browser-image-compression, compressorjs): Unnecessary dependency when Canvas is sufficient
- Raw upload without compression: Violates Constitution §II Media Treatment Protocol

### Supabase Signed URL Upload

**Decision**: Use `createSignedUploadUrl` for time-limited (60s) direct upload URLs.

**Rationale**:
- File data bypasses the Next.js runtime entirely — no memory overflow risk
- Cryptographic token ensures only authorized uploads reach the bucket
- 60-second window is sufficient for WebP-compressed files (< 500KB typical)
- Direct PUT to Supabase edge infrastructure is faster than proxying through Next.js

**Alternatives Considered**:
- Upload via Next.js API route: Doubles network transfer, blocks server thread during upload
- Public bucket uploads: No security — anyone could write arbitrary files
- Presigned POST via S3-compatible API: Supabase's signed URL is simpler and native

### XMLHttpRequest for Upload Progress Tracking

**Decision**: Use `XMLHttpRequest` (not `fetch`) for the direct upload PUT call.

**Rationale**:
- `fetch` does not natively support upload progress events
- `XMLHttpRequest.upload.onprogress` provides reliable progress reporting
- Encapsulated in a Promise wrapper for clean async/await usage

**Alternatives Considered**:
- `fetch` with ReadableStream tracking: Complex, not natively supported for uploads
- Supabase JS client upload: Wraps fetch — no progress reporting
- WebSocket-based upload: Overengineered for this use case

### Asymmetric Grid Layout (Viator Style)

**Decision**: CSS Grid with `grid-cols-1 md:grid-cols-4` layout where the cover image spans `col-span-2 row-span-2`.

**Rationale**:
- Pure CSS — zero JavaScript layout calculations
- Responsive: single column on mobile, 4-column asymmetric on desktop
- Viator-style layout is proven for tourism media galleries (high engagement)
- `aspect-[4/3]` placeholders prevent CLS, satisfying Constitution §II

**Alternatives Considered**:
- JavaScript-based masonry layout: Heavy, causes CLS, violates zero-bloat principle
- Flexbox with wrapping: Cannot achieve the specific asymmetric ratio
- Fixed-width grid: Not responsive

### 10MB Pre-Compression Threshold

**Decision**: Reject raw files exceeding 10MB before Canvas processing.

**Rationale**:
- Canvas operations on extremely large images (> 10MB) cause browser tab freezing
- 10MB is well above typical DSLR/mirrorless camera output at Web-friendly resolutions
- Administrators are prompted to use smaller files rather than experiencing an unresponsive UI

**Alternatives Considered**:
- No limit: Risk of browser crash with 50MB+ RAW files
- Chunked Canvas processing: Not supported by the Canvas API
- Server-side fallback for large files: Violates zero-server-processing constraint

## Compatibility Verification

| Technology | Version | Compatibility |
|-----------|---------|--------------|
| Next.js | 14.x (App Router) | ✅ Route handlers, server components |
| TypeScript | 5.4+ | ✅ Strict mode, no `any` |
| TailwindCSS | 3.4+ | ✅ Grid, transitions, aspect-ratio |
| Supabase JS | 2.43+ | ✅ `createSignedUploadUrl`, service role client |
| Prisma | 5.14+ | ✅ `String[]` for PostgreSQL text arrays |
| Canvas API | HTML5 | ✅ Chrome 43+, Firefox 35+, Safari 9+, Edge 79+ |
| WebP | Modern | ✅ Chrome 9+, Firefox 65+, Safari 14+, Edge 18+ |
