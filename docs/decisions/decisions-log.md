# Talago Tours — Architectural & Product Decisions

## Record of Key Technical Decisions

### 1. Database & Consistency
- **Decision:** Execute capacity checks and booking creation inside a single `Serializable` database transaction.
- **Rationale:** Prevents double-booking and overselling of limited-capacity boat or safari tours under concurrent traffic spikes.

### 2. Session Management
- **Decision:** Dual-token httpOnly cookies (`talago_session` + `talago_refresh`) with server-side supremacy over client-side tokens.
- **Rationale:** Eliminates client-side hydration race conditions where requests fired before `supabaseClient` restored localStorage tokens returned 401 Unauthorized.

### 3. Customer Identity & Phone Matching
- **Decision:** Strict national number normalization (`phoneMatchKey` in `src/utils/phoneMatch.ts`) instead of naive substring matching.
- **Rationale:** Egyptian and Middle Eastern customers enter numbers with variable formats (`010...`, `+2010...`, `002010...`). Normalizing to national digits ensures 100% accurate identity matching while preventing short suffix collisions.

### 4. Internationalization (i18n)
- **Decision:** Hand-written React context (`LanguageContext`) + localized JSON dictionaries (8 locales: EN, DE, RU, IT, FR, PL, ES, UK) without heavy external libraries (`next-intl`, `i18next`).
- **Rationale:** Keeps bundle sizes light, eliminates routing proxy overhead, and allows dynamic multilingual content stored in tour/destination JSON columns.

### 5. Multi-Interface Checkout Parity
- **Decision:** Maintain 3 dedicated checkout interfaces (Page, Modal, Steps) that all target the identical backend handler `/api/checkout/initialize`.
- **Rationale:** Different devices and funnel sources require tailored UX (e.g. instant mobile drawer vs. detailed desktop checkout), but the underlying business rules (pricing, promo codes, capacity, notifications) must stay strictly unified.

### 6. Non-Destructive Database Evolution
- **Decision:** Never execute destructive schema alters; shadow profiles are transitioned to verified profiles rather than deleted.
- **Rationale:** Preserves historical financial audits, transaction logs, reviews, and customer lifetime value metrics.

