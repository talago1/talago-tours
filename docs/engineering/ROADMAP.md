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

- **TAL-M6** `[OPEN - UNVERIFIED]` **Authorization guard**: `/api/admin/media/folders` and `/api/admin/media/move` currently import `supabaseAdmin` conditionally. Verify that a non-admin session is actually rejected. Add `adminAuthGuard` middleware call or equivalent cookie/session check.
  - *Acceptance*: Unauthenticated POST/PATCH/DELETE to these routes returns 401, not 500 or 200.

- **TAL-M7** `[OPEN - UNVERIFIED]` **Bucket/prefix allowlist enforcement in move route**: `targetBucket` defaults to `talago-tour-media` but an attacker could supply an arbitrary `targetPrefix`. Verify that the server validates the prefix against the registered folder list.
  - *Acceptance*: POST `/api/admin/media/move` with `targetPrefix: "../../secrets/"` returns 400.

- **TAL-M8** `[OPEN - UNVERIFIED]` **Tour asset reference update on move**: When an image that is currently a `Tour.coverImage` or `Tour.galleryImages` entry is moved, the old Supabase Storage URL is invalidated. The `MediaAsset.filePath` is updated, but the `Tour` record fields are NOT updated. Implement a cascade URL-rewrite.
  - *Acceptance*: Move a tour cover image -> reload tour in editor -> cover image URL resolves correctly.

- **TAL-M9** `[OPEN]` **Empty-folder support**: Folder registered in SystemSetting with no objects still appears in folder list after page reload.
  - *Acceptance*: Create folder "Egypt 2025", upload nothing, reload page - folder still appears.

- **TAL-M10** `[OPEN]` **Partial batch move failure UI**: Route returns `success: true` with an `errors` array. Frontend must surface partial failures, not silently discard them.
  - *Acceptance*: Simulate one failing move -> UI shows "7 moved, 3 failed" with filenames.

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

### Open Gaps

- **TAL-T6** `[OPEN - UNVERIFIED]` **Save-and-reload consistency**: Import -> save via `/api/admin/tours/create` -> reload via `/api/admin/tours/[id]` -> compare all 27 sections. Verify no field is silently dropped.
  - *Acceptance*: Fully-populated test tour round-trips without data loss. Document any fields the save route drops.

- **TAL-T7** `[OPEN]` **TourAddon display**: Fixed parser `labels`/`descriptions` structure this session. Verify editor renders `labels.en` correctly.
  - *Acceptance*: Parser produces `labels: {en: "Photo Pack"}` -> section 7 shows "Photo Pack".

- **TAL-T8** `[OPEN]` **Multi-language note**: Parser populates `translations.en.*` only. Template must document that other languages require manual translation in the Languages panel.

- **TAL-T9** `[OPEN]` **N/A handling**: Parser must accept N/A for optional fields but reject it for required fields (adultPrice, slug, zoneId).
  - *Acceptance*: Template with `Adult Price: N/A` produces validation error on section 5, not silent zero.

---

## Phase 6 - Booking Interest, Chat & CRM Lifecycle

### Verified Architecture (from code inspection)

1. Customer presses Book -> `TourDetailsClient.tsx` calls `POST /api/public/booking-interest`
2. Route creates/upserts `BookingLead` with status `INTERESTED`, generating `RES-{id[-8].upper}` reference
3. Route upserts `LiveChatConversation` by visitorToken cookie, posts `[RES-...]` message
4. Admin notification sent via Telegram (if configured) and `NotificationLog`
5. Customer is redirected to checkout - NOT a lead confirmation page

### Core Flow (P1 - must work before CRM extensions)

- **TAL-C1** `[IMPLEMENTED]` BookingLead linked to LiveChatConversation via visitorToken cookie + `[RES-...]` message.

- **TAL-C4** `[OPEN - MISSING]` **Customer status page**: No customer-facing page shows reservation reference, current status, or admin replies. Customer is redirected to checkout without confirmation of the interest record.
  - *Acceptance*: `/my-bookings` or `/reservation/{ref}` shows lead status + admin replies. Token-authenticated, no cross-account leaks.

- **TAL-C5** `[OPEN - VERIFY]` **Admin notification flow**: Verify `/admin/notifications` shows new leads with unread badge and links to correct lead drawer.
  - *Acceptance*: Submit test interest -> admin sees new unread notification -> click opens correct lead.

- **TAL-C6** `[OPEN - VERIFY]` **Admin reply notification**: When admin replies in inbox, does customer receive any signal? Inspect LiveChatMessage POST handler. If missing, implement a NotificationLog entry.
  - *Acceptance*: Admin replies -> customer reloading `/my-bookings` sees unread reply indicator.

- **TAL-C7** `[OPEN - VERIFY]` **Conversation privacy**: visitorToken cookie is the only key granting access. Verify `/api/public/my-bookings` validates token server-side.
  - *Acceptance*: Missing or wrong `talago_live_chat` cookie returns no other user's data.

### CRM Extensions (P2 - after core flow verified)

- **TAL-C2** `[IMPLEMENTED - verify]` Admin Leads CRM: detail drawer, staff notes, follow-up tracking, Open Chat button, metric cards.
  - *Remaining*: Verify staff notes persist to DB, not just UI state.

- **TAL-C3** `[IMPLEMENTED - verify]` Admin Inbox: search, URL pre-filter, reservation reference badge.
  - *Remaining*: Verify `?search=RES-...` calls the API with query param, not client-only filter.

- **TAL-C8** `[OPEN]` **Status transition validation**: Server-side enforcement of permitted transitions:
  - INTERESTED -> CONTACTED -> AWAITING_CUSTOMER -> AWAITING_PAYMENT -> CONFIRMED -> COMPLETED
  - Any -> CANCELLED or LOST
  - *Acceptance*: Reverse transitions rejected with 400.

- **TAL-C9** `[OPEN]` **Interest vs confirmed booking distinction**: Lead at INTERESTED must never show as confirmed to customer. Link Booking.lead FK when a booking is created from a lead.
  - *Acceptance*: INTERESTED shows "Pending". CONFIRMED (with Booking link) shows "Confirmed".

---

## Phase 4 - Safe Catalog Retirement & Rebuild

> **Hard rule**: No bulk deletion until all criteria are satisfied and documented.

### What Was Done
- **TAL-D2** `[IMPLEMENTED]` `scripts/audit_and_preview_legacy_tours.cjs` - dry-run preview identifying external images, missing itinerary, booking/review associations.
- **TAL-D3** `[IMPLEMENTED]` Script enforces soft-archival for tours with booking history.

### Open Gaps

- **TAL-D1** `[OPEN - PARTIALLY VERIFIED]` **Backup script analysis**: `scripts/backup_db.js` performs `findMany()` across all 20 tables into a timestamped JSON in `scripts/backups/`. This is a logical dump, NOT a pg_dump. It cannot be restored with `psql`. A bespoke restore script is needed.
  - *Acceptance*: A restore script re-inserts Tour records into a target DB without FK violations.

- **TAL-D4** `[OPEN]` **Deletion environment confirmation**: Before any archival, administrator must confirm `DATABASE_URL` target is not production without an isolated copy. Must be documented manually.
  - *Acceptance*: `scripts/DELETION_CHECKLIST.md` is completed and committed before any destructive script runs.

- **TAL-D5** `[OPEN]` **Soft-archival script**: Sets `status = 'ARCHIVED'` on qualifying tours (no active bookings, external images only, admin confirmed). No rows deleted.
  - *Acceptance*: Dry-run prints list. `--execute` flag sets ARCHIVED. Zero deletions.

---

## Phase 7 - Product Roadmap & Quality Improvements

### Operations (P2)

- **TAL-O1** `[NEWLY IMPLEMENTED - verify]` **Capacity meter in Daily Manifest**: `DailyTourManifest` now carries `maxCapacity`, `availableSpots`, `capacityPercent`, `capacityStatus`. Manifest sheet shows capacity bar and dispatch button per tour group.
  - *Verification*: `npx tsc --noEmit` passes. Manual: open `/admin/operations` with bookings - verify capacity bar renders.

- **TAL-O2** `[OPEN]` **Calendar departure dots**: Color-code dates by capacity status (green/amber/red).

- **TAL-O3** `[OPEN]` **Overbooking prevention**: `POST /api/public/booking-interest` checks total confirmed+pending pax against `Tour.maxCapacity` for the requested date. Returns 409 if full.

### Reviews (P2)

- **TAL-R1** `[OPEN - VERIFY]` **Review eligibility guard**: `bookingAccessToken` (256-bit) required for submission. Verify it is generated at confirmation, emailed, and validated server-side.
  - *Acceptance*: POST without valid token returns 401. POST with valid token for completed booking succeeds.

- **TAL-R2** `[OPEN]` **Moderation queue**: Admin approves/rejects PENDING reviews with a reason. Approved reviews show verified badge.

### Analytics (P3)

- **TAL-A1** `[OPEN - VERIFY]` **Analytics summary accuracy**: Revenue figure matches `SUM(Transaction.amount)` where `status = SUCCESS` for the period.

- **TAL-A2** `[OPEN]` **Tour performance report**: Per-tour leads, conversion rate (leads -> confirmed bookings), revenue.

### Mobile, Accessibility & SEO (P3)

- **TAL-S1** `[OPEN]` **Replace public-facing `<img>` tags**: 20+ `no-img-element` ESLint warnings. Public tour images must use `next/image`. Admin thumbnails are acceptable with explicit dimensions.
  - *Acceptance*: Zero `no-img-element` warnings on public-facing pages.

- **TAL-S2** `[OPEN]` **Sitemap and robots.txt**: Verify `/sitemap.xml` and `/robots.txt` exist and include all active tours.

- **TAL-S3** `[OPEN]` **Mobile booking bar audit**: Sticky Book Now bar must not overlap content on 375px viewport.

---

## Phase 9 - Regression & Verification Tracking

| Test | Type | Status |
|---|---|---|
| `npx tsc --noEmit` zero errors | Static | PASS (this session) |
| `npm run lint` zero errors | ESLint | PASS (this session) |
| 27-section template heading count | Script | PASS (28/28 per legacy count) |
| TourAddon labels structure fix | Static | FIXED (this session) |
| Capacity fields in DailyTourManifest | Static | ADDED (this session) |
| `/api/admin/media/folders` auth guard | Integration | NOT VERIFIED |
| `/api/admin/media/move` prefix validation | Integration | NOT VERIFIED |
| Tour save-and-reload field consistency | Integration | NOT VERIFIED (needs live DB) |
| Admin notification on new lead | Integration | NOT VERIFIED |
| Customer conversation privacy | Integration | NOT VERIFIED |
| Backup restore procedure | Manual | MISSING - no restore script |

---

## Priority Matrix

| Priority | Tasks |
|---|---|
| P0 - Blocking | TAL-M6 (auth guard), TAL-M7 (prefix validation), TAL-C7 (privacy) |
| P1 - Core | TAL-T6 (save-reload), TAL-C4 (customer status page), TAL-C5 (admin notifications), TAL-C6 (reply notification) |
| P2 - Important | TAL-M8 (URL rewrite on move), TAL-C2/C3 verify, TAL-C8 (status transitions), TAL-D1 (restore script), TAL-D4 (deletion checklist), TAL-O1 verify, TAL-R1 |
| P3 - Roadmap | TAL-D5, TAL-O2, TAL-O3, TAL-R2, TAL-A1, TAL-A2, TAL-S1, TAL-S2, TAL-S3 |
