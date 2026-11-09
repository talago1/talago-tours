# Talago Tours — Known Issues & Technical Debt

## Active Observations & Enhancement Areas

### 1. Tree-Sitter SQL Parser Warning in Graphify
- **Status:** Low / Non-blocking.
- **Detail:** `graphify update` emits a warning that 4 `.sql` migration files were skipped because `tree_sitter_sql` is optional.
- **Impact:** Zero impact on TypeScript/Next.js execution or code graph coverage.

### 2. Paymob Mobile Iframe UX
- **Status:** Enhancement.
- **Detail:** When online payment is selected on mobile devices, Paymob renders inside an iframe. On smaller screens, a full-page redirect to Paymob's hosted checkout is smoother than an embedded iframe.
- **Action:** Plan an adaptive redirect option for mobile users choosing credit card payment.

### 3. SEO Metadata Localization Completeness
- **Status:** Ongoing.
- **Detail:** Core tour slugs and categories are translated across locales, but blog articles and secondary info pages currently fall back to English if alternate locale text is empty.
- **Action:** Add AI-powered fallback translation or automated locale pre-generation.

### 4. Guest Booking Auto-Claim on Registration
- **Status:** Functional with manual claim; can be streamlined.
- **Detail:** When a guest registers an account with email X after booking, they can claim past trips via "+ Link Guest Booking". Auto-linking on registration can be made even more prominent on the onboarding screen.

