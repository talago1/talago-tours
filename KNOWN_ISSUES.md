# Talago Tours — Known Issues & Technical Debt

## Active Observations & Enhancement Areas

### 1. Tree-Sitter SQL Parser Warning in Graphify
- **Status:** Low / Non-blocking.
- **Detail:** `graphify update` emits a warning that 4 `.sql` migration files were skipped because `tree_sitter_sql` is optional.
- **Impact:** Zero impact on TypeScript/Next.js execution or code graph coverage.

### 2. Paymob Mobile Hosted Checkout (Resolved)
- **Status:** Resolved.
- **Detail:** All three checkout flows (`/checkout/[tourId]`, `ContinuousBookingModal`, and `BookingFormSteps`) use direct window navigation to Paymob's hosted checkout gateway (`window.location.href = data.gatewayIframeUrl;`), completely avoiding embedded iframe constraints on mobile viewports. Cash on Arrival remains available as the friction-free zero-deposit option.

### 3. SEO Metadata Localization Completeness
- **Status:** Ongoing.
- **Detail:** Core tour slugs and categories are translated across locales, but blog articles and secondary info pages currently fall back to English if alternate locale text is empty.
- **Action:** Add AI-powered fallback translation or automated locale pre-generation.

### 4. Guest Booking Auto-Claim & Pre-Filled Link Modal (Resolved)
- **Status:** Resolved.
- **Detail:** Automatic adoption engine (`adoptOwnedBookings`) runs server-side on every `/api/public/my-bookings` and session sync, claiming past guest bookings matching phone/email unconditionally. For manual linking of bookings made under alternate numbers, the Link Modal automatically pre-fills the customer's known profile phone number.
