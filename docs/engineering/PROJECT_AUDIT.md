# Talago Tours Product Audit

Audit started: 2026-10-24

## Scope and verification boundary

This is a source-level inventory. The repository has no verified OS-enforced
execution sandbox with isolated network, secrets, read-only source/toolchain,
scratch-only writes, and resource limits. Per the repository security-audit
skill, no project-controlled build, test, database, browser, migration, seed,
payment, or external-notification process was run for this audit.

Consequently, "verified" below means the source path and its data flow were
reviewed, not that a deployed integration was exercised. Provider dashboards,
Supabase policies, Vercel settings, production data, and delivery credentials
remain externally unverified.

## Starting point

- Branch: `codex/marketplace-recovery`.
- Baseline feature commit present: `6552525 feat: manage reservation inbox notifications`.
- Unrelated, pre-existing working-tree files preserved: `scripts/data/egypt-gate-import-report.json` and `scripts/data/egypt-gate-media-migration-report.json`.
- Current supporting data audit: `docs/TRIP_DATA_AUDIT.md` identifies incomplete optional trip content without publishing invented content.

## Product inventory

| Area | State | Evidence | Notes |
| --- | --- | --- | --- |
| Public catalog, search, filters | Partially implemented | `src/app/(public)/tours`, `src/components/landing/TourCatalog.tsx`, `src/components/tours` | Route and shared filter UI exist; browser behavior has not been executed in an isolated environment. |
| Tour detail and rich content | Partially implemented | `src/app/(public)/tours/[slug]`, `src/components/tours`, `src/components/admin/UnifiedTourEditor.tsx`, `src/types/tourEditor.ts` | Editor supports broad content sections. Existing data audit identifies active tours with missing optional itinerary/route/media fields. |
| Booking interest | Implemented, awaiting runtime verification | `src/app/api/public/booking-interest/route.ts`, `prisma/schema.prisma: BookingLead` | Creates/deduplicates a lead and a `RES-...` reference, mirrors a new interest into live chat, and logs an admin alert. Numeric validation is the first remediation batch. |
| Booking, capacity, and checkout | Partially implemented | `src/utils/bookingEngine.ts`, `src/utils/capacityEngine.ts`, `prisma/schema.prisma: Booking`, `TourTimeSlot` | Booking engine uses a serializable transaction and counts pending/confirmed guests. The actual API/checkout journey requires isolated integration verification. |
| Customer booking access | Partially implemented | `Booking.accessToken` schema field, `src/app/(public)/my-bookings`, booking routes | Access token is explicitly separate from the human reference. Ownership and every customer-facing route require an end-to-end authorization trace. |
| Live chat and inbox | Implemented, awaiting runtime verification | `src/components/layout/LiveChatWidget.tsx`, `src/app/api/public/live-chat`, `src/app/api/admin/live-chat`, `src/app/(admin)/admin/inbox/page.tsx` | Conversation, unread marking, archive/reopen, and bulk deletion exist. Search/pagination and recovery after deletion are not present. |
| Admin authentication | Source-verified implementation; external configuration unverified | `src/middleware.ts`, `src/utils/adminAuth.ts`, `src/app/api/admin/login/route.ts` | Middleware protects `/admin`, `/api/admin`, `/api/notifications`, and `/api/media`, fails closed without `ADMIN_API_TOKEN`, and supports secure httpOnly cookie/Bearer access. Token strength/rotation and deployment matcher behavior need external verification. |
| Lead CRM | Partially implemented | `src/app/(admin)/admin/leads`, `src/app/api/admin/leads`, `BookingLead` | Statuses and search exist. Internal notes, follow-up dates, consolidated customer timeline, and links between lead/chat/booking are incomplete. |
| Reviews | Partially implemented | `src/utils/verifyBookingEligibility.ts`, `src/utils/reviewSubmission.ts`, `src/app/api/public/reviews`, `src/app/(admin)/admin/reviews` | Eligibility and moderation paths exist. Operational verification and seeded-data provenance need review before public claims. |
| Analytics | Partially implemented | `src/app/api/admin/analytics/summary`, `src/app/(admin)/admin`, analytics types | Dashboard data exists. Metric definitions and reconciliation against booking/payment states need a dedicated integrity review. |
| Notifications | Partially implemented / externally unverified | `src/utils/notificationDispatcher.ts`, booking-interest route, `NotificationLog` | WhatsApp, Telegram, and notification logging have source paths. Credentials, channel permissions, retries, and actual delivery are unverified. |
| Media | Partially implemented | `src/app/api/admin/media`, `src/app/(admin)/admin/media`, `MediaAsset`, `next.config.js` | Media library and image-host allowlist exist. Storage policies and upload authorization require external verification. |
| Content pages and locales | Implemented, awaiting runtime verification | `src/app/api/admin/content-pages`, `src/app/api/admin/content-pages/ai`, `src/locales` | Content Studio and existing supported locales are present. No Arabic/RTL scope is introduced. |
| SEO, performance, accessibility | Partially implemented | metadata/routes, `next.config.js`, public components | Static evidence is insufficient to claim performance or accessibility results. Browser/assistive-technology checks require the approved isolated environment. |
| Tests and delivery | Partially implemented | `e2e/smoke.spec.ts`, `playwright.config.ts`, `package.json`, `.env.example` | One Playwright smoke suite exists; no CI workflow was found. Test execution is blocked by the safety boundary above. |

## Security observations

- The major admin route prefix is guarded at middleware level; individual route files do not all repeat an authorization check, which is acceptable only while the matcher remains complete. Any new privileged route outside those prefixes must use `isAdminRequest`/`isAdminAuthorized` or extend the matcher.
- `BookingLead` interest data is not a payment or confirmed reservation record. Its source must validate and label guest counts and estimated values accordingly.
- Telegram, Green API, Supabase service-role, Paymob, Resend, admin token, and cron secret are environment-only in `.env.example`. Their configured values, permissions, webhooks, and logs cannot be verified from source.

The authoritative actionable backlog is maintained in `docs/engineering/PROJECT_BACKLOG.md`.
