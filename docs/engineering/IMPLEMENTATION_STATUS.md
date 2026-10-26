# Talago Tours — Implementation Status Ledger

Updated: 2026-10-26

## Evaluation Taxonomy

Every subsystem is classified into one of seven explicit statuses:
- **Verified working**: Code and behavior inspected and confirmed via verified source paths or tests.
- **Implemented but not verified**: Code is written but runtime behavior has not been tested in an isolated sandbox.
- **Partially implemented**: Core functionality exists but key features, fields, or error cases are incomplete.
- **Broken**: Code contains known defects, runtime failures, or architectural flaws.
- **Missing**: Required capability is completely absent from the codebase.
- **Dependent on external configuration**: Code is complete but execution requires external third-party keys/services.
- **Blocked**: Cannot proceed due to missing execution sandbox, missing credentials, or prerequisite tasks.

---

## Subsystem Status Matrix

| Subsystem / Feature Area | Status | Evidence & Code Location | Detailed Assessment |
| --- | --- | --- | --- |
| **1. Admin Auth & Route Security** | Implemented but not verified | `src/middleware.ts`, `src/utils/adminAuth.ts` | Edge middleware protects `/admin`, `/api/admin`, `/api/notifications`, `/api/media`. Fails closed if token unset. Full Vercel matcher verification needs owner check. |
| **2. Media Library Storage & Sync** | Partially implemented | `src/app/api/admin/media/route.ts`, `src/app/(admin)/admin/media/page.tsx` | Supabase storage bucket listing works; however, folder management uses `localStorage` and image moving re-downloads blobs in the browser. |
| **3. Media Folder Management** | Broken | `src/app/(admin)/admin/media/page.tsx:18-24, 105-115` | Folders exist only in client `localStorage` (lost across devices/mobile). Moving images makes duplicate HTTP re-uploads. Bulk moving to folder is missing. |
| **4. Tour Media Assignment** | Partially implemented | `src/components/admin/MediaLibraryModal.tsx`, `src/components/admin/MediaOrganizer.tsx` | Modal allows selecting image URLs, but folder navigation is limited to a free text input rather than a clean folder browser. |
| **5. Tour Text Importer (28 Sections)** | Partially implemented | `src/components/admin/UnifiedTourEditor.tsx:2838-2900` | Text parser only parses 10 legacy fields. 18 critical sections (logistics, operator, meeting points, routes, transport, addons, faqs, safety, rules) are ignored. |
| **6. 28-Section Tour Creation UI** | Verified working (Source) | `src/components/admin/UnifiedTourEditor.tsx`, `src/types/tourEditor.ts` | Form defines all 28 sections, input state handlers, sub-builders (itinerary, addons, questions), and completeness score calculation. |
| **7. Tour Catalog Retirement / Backup** | Implemented but not verified | `scripts/backup_db.js`, `scripts/backups/` | Complete JSON backup script exists and backups exist from Oct 2026. Safe selective retirement requires runtime db connection. |
| **8. Booking Interest ("Book Now")** | Verified working (Source) | `src/app/api/public/booking-interest/route.ts`, `BookingLead` | Generates `RES-...` reference, deduplicates by session/contact, validates integer counts/prices, and mirrors into live chat. |
| **9. Customer Live Chat Widget** | Implemented but not verified | `src/components/layout/LiveChatWidget.tsx`, `src/app/api/public/live-chat` | Cookie-based `visitorToken` tracks conversation across sessions. Real-time polling runs every 4s. |
| **10. Admin Live Inbox** | Partially implemented | `src/app/(admin)/admin/inbox/page.tsx`, `src/app/api/admin/live-chat` | Supports viewing, replying, archive, reopen, and bulk delete. Lacks search, pagination, and direct linkage to customer booking leads. |
| **11. Lead CRM Dashboard** | Partially implemented | `src/app/(admin)/admin/leads/page.tsx`, `src/app/api/admin/leads` | Lists leads and allows status changes. Lacks internal notes editor, scheduled follow-up dates, and linked conversation drawer. |
| **12. Customer Booking Access & Tokens** | Partially implemented | `Booking.accessToken`, `src/utils/bookingToken.ts`, `src/app/(public)/my-bookings` | 256-bit access tokens prevent guessing references. Customer route authorization trace is ongoing. |
| **13. Checkout & Capacity Engine** | Implemented but not verified | `src/utils/bookingEngine.ts`, `src/utils/capacityEngine.ts`, `src/app/api/checkout/initialize` | Serializable transaction locks and checks capacity before booking creation. End-to-end checkout requires sandbox testing. |
| **14. Verified Reviews** | Implemented but not verified | `src/utils/reviewSubmission.ts`, `src/utils/verifyBookingEligibility.ts`, `WriteReviewModal.tsx` | Enforces verified `bookingAccessToken` and internal booking ID before review creation. Seeded reviews deactivated. |
| **15. Admin Analytics** | Implemented but not verified | `src/app/api/admin/analytics/summary/route.ts` | Business metrics aggregation with `no-store` headers. Verification against production transactions pending. |
| **16. External Alerts (Telegram / WhatsApp / Resend)** | Dependent on external configuration | `src/utils/notificationDispatcher.ts`, `src/lib/email.ts` | Code logic is complete. Actual delivery depends on non-committed environment keys (`TELEGRAM_BOT_TOKEN`, `GREEN_API_TOKEN`, `RESEND_API_KEY`). |
| **17. Automated E2E & Integration Tests** | Blocked | `e2e/smoke.spec.ts` | Blocked until compliant execution sandbox with network loopback and secret isolation is established. |
| **18. Arabic / RTL Support** | Out of Scope / Excluded | N/A | Explicitly excluded per project guidelines. Existing 8 locales (EN, DE, RU, FR, IT, PL, ES, UK) maintained. |
