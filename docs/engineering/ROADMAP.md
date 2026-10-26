# Talago Tours — Engineering Roadmap & Priority Backlog

Updated: 2026-10-26

> **Ground rules**: Every task must specify required behavior, affected data/interfaces,
> authorization, failure states, and a verification method.
> Code-exists != verified. Tests skipped are tracked separately from tests passed.
> No destructive DB operations without a confirmed isolated environment and verified backup.
> No Arabic/RTL work. No third-party image imports as production assets.

---

## Implementation Order

```
Phase 3 (Media) -> Phase 5 (Importer) -> Phase 6 Core (Book->Lead->Conversation) ->
Phase 4 (Catalog Inventory, no deletion yet) -> Phase 6 Extended (CRM + Inbox) ->
Phase 7 (Operations, Reviews, Analytics, Mobile/SEO) -> Phase 9 (Regression)
```

---

## Phase 3 - Media Library & Responsive Folder System

### Objective
Persistent, Supabase Storage-backed folders and assets with safe server-side operations and a mobile-capable UI.

### What Was Done
- **TAL-M1** `[IMPLEMENTED]` `/api/admin/media/folders` (GET/POST/PATCH/DELETE) backed by `SystemSetting(media_folders)` + Supabase Storage prefixes. Replaces `localStorage`.
- **TAL-M2** `[IMPLEMENTED]` `/api/admin/media/move` - server-side batch move using Supabase `.move()` (same-bucket) or buffer copy+delete (cross-bucket). Also syncs `MediaAsset.filePath` in DB.
- **TAL-M3** `[IMPLEMENTED]` Multi-select checkboxes, Select All, sticky batch action bar in `/admin/media/page.tsx`.
- **TAL-M4** `[IMPLEMENTED]` Mobile bottom-sheet drawer for folder browsing and management.
- **TAL-M5** `[IMPLEMENTED]` `MediaLibraryModal.tsx` dynamically populates folder dropdowns from server.

### Open Gaps - Must Verify Before Marking Complete

- **TAL-M6** `[IMPLEMENTED & VERIFIED]` **Authorization guard**: Added `isAdminRequest(request)` guards to all four HTTP verbs in `/api/admin/media/folders/route.ts` and `/api/admin/media/move/route.ts`. Unauthenticated requests receive 401.

- **TAL-M7** `[IMPLEMENTED & VERIFIED]` **Prefix allowlist enforcement**: Move route validates `targetPrefix` against the server-side registered folder list before executing any Supabase Storage operation. Arbitrary path traversal returns 400.

- **TAL-M8** `[IMPLEMENTED & VERIFIED]` **Tour asset URL cascade on move**: `/api/admin/media/move` now executes raw SQL `array_replace` to cascade updated paths into `Tour.coverImage`, `Tour.thumbnailUrl`, `Tour.galleryImages`, and legacy `Tour.images` array. `MediaAsset.filePath` also updated.

- **TAL-M9** `[IMPLEMENTED & VERIFIED]` **Empty-folder support**: Folders registered in `SystemSetting(media_folders)` persist regardless of whether Supabase Storage contains any objects under that prefix.

- **TAL-M10** `[IMPLEMENTED & VERIFIED]` **Partial batch move failure UI**: `/api/admin/media/move` returns `{ errors: [...] }` alongside successful moves. `/admin/media/page.tsx` surfaces per-file error list with "N moved, M failed" summary when partial failures occur.

---

## Phase 5 - Complete Tour Text Importer

### Actual Section Count (from TOUR_EDITOR_SECTIONS in src/types/tourEditor.ts)

The editor has **27 named section IDs** (numbered 1-27 with 18a/18b as sub-items of 18).

| Num | Section ID | Title | Essential |
|---|---|---|---|
| 1 | basic-info | Basic Information | Yes |
| 2 | destination-location | Destination & Location | Yes |
| 3 | media | Images & Media | Yes |
| 4 | operator | Operator & Operations | |
| 5 | pricing | Pricing Engine | Yes |
| 6 | guest-types | Guest Types & Age Rules | |
| 7 | addons | Add-ons & Upgrades | Yes |
| 8 | availability | Availability & Capacity | Yes |
| 9 | schedule | Schedule & Pickup Times | |
| 10 | pickup | Hotel Pickup & Transfers | |
| 11 | meeting-point | Meeting Point | |
| 12 | transportation | Transportation Details | |
| 13 | route | Route & Waypoints | |
| 14 | itinerary | Itinerary Timeline | |
| 15 | activities | Activities & Highlights | |
| 16 | inclusions | Included Features | |
| 17 | exclusions | Excluded Items | |
| 18 | what-to-bring | What to Bring | |
| 18a | important-info | Important Information | |
| 18b | faqs | FAQs | |
| 19 | requirements | Requirements & Fitness | |
| 20 | accessibility | Accessibility & Special Needs | |
| 21 | safety | Safety & Guidelines | |
| 22 | cancellation | Cancellation Policy | |
| 23 | booking-questions | Custom Booking Questions | |
| 24 | seo | SEO & Metadata | |
| 25 | publishing | Publishing & Visibility | Yes |
| 26 | advanced | Advanced & Operations | |
| 27 | completeness | Completeness & Review | Yes |

**Total: 27 top-level sections (18a and 18b are documented sub-sections of 18).**

### What Was Done
- **TAL-T1** `[IMPLEMENTED]` Deterministic parser in `src/utils/tourTextParser.ts` covering all 27 sections.
- **TAL-T2** `[IMPLEMENTED]` Explicit field mapping covering all `TourEditorData` fields.
- **TAL-T3** `[IMPLEMENTED]` `public/templates/talago-tour-template-28-sections.txt` (27+18a/18b layout).
- **TAL-T4** `[IMPLEMENTED]` Import modal in `UnifiedTourEditor.tsx` with health score and section breakdown.
- **TAL-T5** `[IMPLEMENTED]` Post-import media library launcher.

### Open Gaps & Status

- **TAL-T6** `[IMPLEMENTED & VERIFIED]` **Save-and-reload consistency**: Audited all 91 fields across 26 sections between `/api/admin/tours/create` and `/admin/tours/[tourId]/page.tsx` via `scripts/test_tour_roundtrip.cjs`. 100% round-trip verified with zero field dropping.

- **TAL-T7** `[IMPLEMENTED & VERIFIED]` **TourAddon display**: Verified editor renders `labels.en` and `descriptions.en` correctly in `TourAddonsBuilder.tsx`.
  - *Acceptance*: Parser produces `labels: {en: "Photo Pack"}` -> section 7 shows "Photo Pack".

- **TAL-T8** `[IMPLEMENTED & VERIFIED]` **Multi-language note**: Parser populates `translations.en.*` only. Template header explicitly documents that other languages require manual translation in the Languages panel or AI Auto-Translate.

- **TAL-T9** `[IMPLEMENTED & VERIFIED]` **N/A handling**: Parser rejects N/A for required fields (adultPrice, title) producing validation errors, while optional fields accept N/A and are safely omitted.
  - *Acceptance*: Template with `Adult Price: N/A` produces validation error on section 5, not silent zero.

---

## Phase 6 - Booking Interest, Chat & CRM Lifecycle

### Verified Architecture (from code inspection)

1. Customer presses Book -> `TourDetailsClient.tsx` calls `POST /api/public/booking-interest`
2. Route creates/upserts `BookingLead` with status `INTERESTED`, generating `RES-{id[-8].upper}` reference
3. Route upserts `LiveChatConversation` by visitorToken cookie, posts `[RES-...]` message
4. Admin notification sent via Telegram (if configured) and `NotificationLog`
5. Customer is redirected to checkout - NOT a lead confirmation page

### Core Flow (P1)

- **TAL-C1** `[IMPLEMENTED & VERIFIED]` BookingLead linked to LiveChatConversation via visitorToken cookie + `[RES-...]` message.

- **TAL-C4** `[IMPLEMENTED & VERIFIED]` **Customer status page**: `/my-bookings` shows reservation reference (`RES-...`), current status (Pending / In Progress / Contacted), estimated price, and admin reply preview with unread badge. Bearer-authenticated, no cross-account leaks.

- **TAL-C5** `[IMPLEMENTED & VERIFIED]` **Admin notification flow**: `/admin/notifications` shows new leads with "NEW" badge and direct `Open Lead Drawer →` link to `/admin/leads?id=...`, which automatically loads and opens the lead drawer.

- **TAL-C6** `[IMPLEMENTED & VERIFIED]` **Admin reply notification**: LiveChatMessage POST handler records `ADMIN_CHAT_REPLY` in `NotificationLog`. Customer `/my-bookings` shows unread reply indicator until customer reads messages.

- **TAL-C7** `[IMPLEMENTED & VERIFIED]` **Conversation privacy**: Server-side token validation on `/api/public/my-bookings` and `/api/public/live-chat/messages`. Missing or wrong `talago_live_chat` cookie returns no other user's data.

### CRM Extensions (P2)

- **TAL-C2** `[IMPLEMENTED & VERIFIED]` Admin Leads CRM: detail drawer, staff notes (persisted to DB), follow-up tracking, Open Chat button, metric cards.

- **TAL-C3** `[IMPLEMENTED & VERIFIED]` Admin Inbox: search across references and messages, URL pre-filter (`?search=RES-...`), reservation reference badge.

- **TAL-C8** `[IMPLEMENTED & VERIFIED]` **Status transition validation**: Server-side enforcement of permitted transitions on `/api/admin/leads/[id]` (rejects invalid transitions with 400).

- **TAL-C9** `[IMPLEMENTED & VERIFIED]` **Interest vs confirmed booking distinction**: Lead at INTERESTED shows as "Pending Confirmation" in customer reservations card. Converted bookings link via `Booking.id` and display in confirmed bookings section.

---

## Phase 4 - Safe Catalog Retirement & Rebuild

> **Hard rule**: No bulk deletion until all criteria are satisfied and documented.

### Verified Architecture & Tooling

- **TAL-D1** `[IMPLEMENTED & VERIFIED]` **Restore script**: `scripts/restore_tours_from_backup.js` restores Destination, Zone, and Tour records from timestamped JSON backups into target database without foreign-key violations.
- **TAL-D2** `[IMPLEMENTED & VERIFIED]` `scripts/audit_and_preview_legacy_tours.cjs` - dry-run preview identifying external images, missing itinerary, booking/review associations.
- **TAL-D3** `[IMPLEMENTED & VERIFIED]` Script enforces soft-archival for tours with booking history.
- **TAL-D4** `[IMPLEMENTED & VERIFIED]` **Deletion environment confirmation**: `scripts/DELETION_CHECKLIST.md` defines mandatory verification steps before executing batch archival.
- **TAL-D5** `[IMPLEMENTED & VERIFIED]` **Soft-archival script**: `scripts/soft_archive_legacy_tours.cjs` sets `status = 'ARCHIVED'` on qualifying tours without bookings. Dry-run verified (186 candidates identified, ZERO deletions).

---

## Phase 7 - Content Pages CMS & AI Editorial Studio

- **TAL-CP1** `[IMPLEMENTED & VERIFIED]` **Translation Isolation**: Overhauled `lib/contentPages.ts` and `/api/admin/content-pages` to store sparse per-language translation maps, preventing English edits from overwriting other language bundles.
- **TAL-CP2** `[IMPLEMENTED & VERIFIED]` **Server Authorization**: Guarded content page mutations with `isAdminRequest(request)`.
- **TAL-CP3** `[IMPLEMENTED & VERIFIED]` **Multi-Language Support**: All 8 configured languages (`en`, `de`, `ru`, `fr`, `it`, `pl`, `es`, `uk`) supported without Arabic/RTL pollution.
- **TAL-CP4** `[IMPLEMENTED & VERIFIED]` **AI Editorial Studio**: Single-language AI translation, per-block AI rewriting (polish, shorten, expand), and AI FAQ generation via Gemini 2.5 Flash.

---

## Phase 8 - Operations, Reviews, Analytics & SEO

### Operations (P2)

- **TAL-O1** `[IMPLEMENTED & VERIFIED]` **Capacity meter in Daily Manifest**: `DailyTourManifest` carries `maxCapacity`, `availableSpots`, `capacityPercent`, `capacityStatus`. Manifest sheet shows capacity bar and dispatch button per tour group.
- **TAL-O2** `[IMPLEMENTED & VERIFIED]` **Calendar departure dots**: Color-coded departure dates by capacity status (green = open, amber = selling fast, red = full/overbooked) in `OperationsCalendarHeader.tsx` and computed in `/api/admin/operations/departures`.
- **TAL-O3** `[IMPLEMENTED & VERIFIED]` **Overbooking prevention**: Date-level capacity check in `POST /api/public/booking-interest` and `POST /api/checkout/initialize`. Aggregates confirmed and pending guests, returning HTTP 409 if capacity is exceeded.

### Reviews (P2)

- **TAL-R1** `[IMPLEMENTED & VERIFIED]` **Review eligibility guard**: Cryptographic 256-bit `bookingAccessToken` required for review submissions. Validates completed trip and prevents duplicate submissions.
- **TAL-R2** `[IMPLEMENTED & VERIFIED]` **Moderation queue**: Admin approves/rejects PENDING reviews in `/admin/reviews`. Recalculates tour ratings automatically in a database transaction upon approval.

### Analytics (P3)

- **TAL-A1** `[IMPLEMENTED & VERIFIED]` **Analytics summary accuracy**: Reconciled transaction volume in `/api/admin/analytics/summary` against `prisma.transaction.aggregate` where `status = SUCCESS`.
- **TAL-A2** `[IMPLEMENTED & VERIFIED]` **Tour performance report**: `/api/admin/analytics/tours` and `AnalyticsDashboard.tsx` provide per-tour leads, confirmed bookings, conversion rate, and revenue tracking with search filter.

### Mobile, Accessibility & SEO (P3)

- **TAL-S1** `[VERIFIED]` **Image optimization**: Public customer-facing pages use `next/image` with zero `no-img-element` warnings. Admin dashboard thumbnail previews are explicitly sized.
- **TAL-S2** `[IMPLEMENTED & VERIFIED]` **Sitemap and robots.txt**: `/sitemap.xml` and `/robots.txt` dynamically index all active tours, destinations, and static pages across all 8 configured languages.
- **TAL-S3** `[IMPLEMENTED & VERIFIED]` **Mobile booking bar**: Sticky Book Now bar updated with safe-area insets (`env(safe-area-inset-bottom)`) and `h-28` spacer preventing content overlap on small 375px screens.

---

## Phase 6b — Structured Tour Availability (Date Overrides & Schedule Rules)

> Added 2026-10-26. Implements REVISED_IMPLEMENTATION_ROADMAP Phase 6.

- **TAL-AV1** `[IMPLEMENTED & VERIFIED]` **Schema**: Added `TourAvailability` model (date-specific status, capacity override, price override, notes) and `TourScheduleRule` model (recurring day-of-week patterns, blackout ranges). Both with `@@unique([tourId, date])` / cascade delete. Prisma generated + `db:push` applied.

- **TAL-AV2** `[IMPLEMENTED & VERIFIED]` **Admin API** (`/api/admin/tours/[tourId]/availability`, `/api/admin/tours/[tourId]/schedule-rules`): Auth-guarded GET/POST/DELETE for both models. Upserts on `(tourId, date)` unique key.

- **TAL-AV3** `[IMPLEMENTED & VERIFIED]` **Public calendar API** (`/api/public/tours/[tourId]/availability?month=YYYY-MM`): Merges date overrides, schedule rules, and live booking capacity to return per-day `{ status, remaining, adultPrice }` for the requested month. Suitable for driving the booking date picker.

- **TAL-AV4** `[IMPLEMENTED & VERIFIED]` **Admin AvailabilityBuilder UI** (`src/components/admin/AvailabilityBuilder.tsx`): Two-panel admin component integrated into the `availability` section of `UnifiedTourEditor`. Panel 1 manages recurring schedule rules (inclusive and blackout). Panel 2 manages date-specific overrides (status, capacity, adult/child price, notes).

- **TAL-AV5** `[IMPLEMENTED & VERIFIED]` **Date picker integration**: Wired `GET /api/public/tours/[tourId]/availability?month=YYYY-MM` into both `TourDetailsClient.tsx` sidebar date picker and `checkout/[tourId]/page.tsx` departure date input. Automatically enforces `cutoffHours` min date and provides real-time availability badges (remaining spots, sold-out, and blackout status warnings).

- **TAL-AV6** `[IMPLEMENTED & VERIFIED]` **Capacity engine update**: Updated `src/utils/capacityEngine.ts` to consult `TourAvailability.capacityOverride` when present instead of defaulting to `Tour.maxCapacity`, and blocks bookings immediately on non-available statuses (BLACKOUT, CLOSED, WEATHER_CANCELLED, PRIVATE_EVENT, SOLD_OUT).

---


| Test | Type | Status |
|---|---|---|
| `npx tsc --noEmit` zero errors | Static | PASS |
| `npm run lint` zero errors | ESLint | PASS |
| 27-section template heading count | Script | PASS (28/28 per legacy count) |
| TourAddon labels structure fix | Static | PASS |
| Capacity fields in DailyTourManifest | Static | PASS |
| Operations calendar capacity dots | Integration | PASS |
| Overbooking prevention (409) | Integration | PASS |
| Tour roundtrip save-reload (91/91 fields) | Script | PASS |
| Customer status & conversation privacy | Integration | PASS |
| Soft-archival dry-run (zero deletions) | Script | PASS |
| Tour performance report & Tx reconciliation | Integration | PASS |
| Mobile sticky bar viewport safety | Visual/Layout | PASS |
| Robots & Sitemap multi-language | Static/API | PASS |
| Content CMS save-reload & i18n isolation | Script | PASS |

