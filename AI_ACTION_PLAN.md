# 🚀 TALAGO PLATFORM: ULTIMATE MASTER ARCHITECTURE & PRODUCTION BLUEPRINT
**Role:** CTO, Principal Full-Stack Architect, Security Auditor & Lead UX Engineer.
**Target Tech Stack:** Next.js / React, Supabase (Postgres DB, Auth, Storage Buckets: `talago-media`, `talago-tour-media`), Resend Email, Telegram Bot API (100% Free), WhatsApp Webhook (Free/Community API Provider, e.g., Baileys / Evolution API / Green API free tier), Universal AI Router (Gemini, Groq, OpenRouter, DeepSeek).
**STRICT DIRECTIVE:** Execute the following phases sequentially. Write production-ready, defensively programmed, error-handled code. DO NOT trigger or execute any production deployment (`vercel deploy`, `git push production`, etc.) until I explicitly write: `"APPROVED FOR PRODUCTION DEPLOYMENT"`.

---

## PHASE 1: SECURITY HARDENING & API AUDIT
1. **Secrets & Bundle Protection:**
   - Audit all client bundles to ensure zero key exposure (Supabase Service Role, Resend Keys, AI API Keys). Server-side actions/API routes only.
2. **Server-Side Re-Validation:**
   - Re-derive all order prices, currency conversions, and user authorization roles (`isAdmin`) strictly on the server-side. Never trust client calculations.
3. **Endpoint Authorization & RLS:**
   - Verify active Supabase session tokens on all mutation endpoints.
   - Enforce Row Level Security (RLS) across all tables (`tours`, `bookings`, `profiles`, `destinations`, `media`, `reviews`).
4. **Rate Limiting & Sanitization:**
   - Implement rate-limiting on Auth, Magic Link, OTP, and AI endpoints to block spam.
   - Sanitize all user inputs (reviews, forms) against XSS/CSRF.
5. **Dynamic OpenGraph (SEO):**
   - Implement dynamic `<meta property="og:...">` tags on Tour and Destination routes for high-converting social media/WhatsApp link previews.

---

## PHASE 2: FRICTIONLESS PHONE BOOKING & INSTANT MESSAGING (FREE WEBHOOKS)
1. **Phone-Only Guest Booking:**
   - On the Tour Detail checkout modal, enable guests to book using **ONLY their Phone Number and Name**.
   - **Auto-Account Creation:** Automatically upsert a user profile in Supabase using the phone number as the unique identifier if no account exists yet.
2. **Instant QR Boarding Pass (PDF Generation):**
   - On booking completion, auto-generate a sleek PDF Boarding Pass preview containing booking summary, pickup details, and a cryptographically signed QR Code (`QR_HMAC_SECRET`).
   - Store the PDF in `talago-media` bucket and obtain a public URL.
3. **Free WhatsApp & Telegram Webhook Integrations:**
   - **Telegram:** Use free Telegram Bot API (`sendDocument` & `sendMessage`) via `@BotFather` `TELEGRAM_BOT_TOKEN`.
   - **WhatsApp:** Build a modular webhook router prepared for a free/community WhatsApp API wrapper (e.g., Baileys engine / Evolution API / Green-API free tier) to send the confirmation message & PDF ticket link directly to the guest's WhatsApp.
4. **Abandoned Booking Recovery:**
   - Store partial checkout entries (Name + Phone) when entered in the modal.
   - Create a background cron job/webhook logic to send a friendly WhatsApp follow-up reminder 30 minutes after an uncompleted booking.

---

## PHASE 3: CENTRALIZED MEDIA LIBRARY (EXISTING SUPABASE BUCKETS)
1. **Existing Bucket Storage Integration:**
   - Connect directly to existing Supabase buckets: `talago-tour-media` (for tour assets) and `talago-media` (for general media/blogs/avatars). DO NOT create new buckets.
   - Configure RLS: Public READ, Admin-only WRITE/DELETE.
2. **Admin Media Gallery Component (`/admin/media`):**
   - Multi-file drag-and-drop upload directly routing to the target bucket based on context.
   - Search, tag/category filter, delete, and copy public URL controls.
3. **Tour Admin Form Refactor:**
   - Replace manual URL input fields with a "Select from Media Library" modal.
   - Allow selecting multiple photos for tour galleries and explicitly toggling one photo as `isCover` (Cover Image).

---

## PHASE 4: FRONTEND UX, LIGHTBOX & MOBILE CAROUSELS
1. **Tour Detail Lightbox Integration:**
   - **Remove Clunky Standalone Buttons:** Delete standalone gallery buttons underneath images.
   - **Direct Image Lightbox:** Make EVERY tour gallery image directly clickable. Clicking any photo opens a full-screen Lightbox modal starting at that specific index with swipe and keyboard controls.
2. **Interactive Taxonomy Tags:**
   - Convert top static tags (e.g., "Hurghada", "Safari") into active `<Link>` components:
     - Destination Tag -> Routes to `/destinations/[slug]` (e.g., `/destinations/hurghada`).
     - Category/Activity Tag -> Routes to `/tours?category=[category]` (e.g., `/tours?category=safari`).
3. **Mobile Touch Carousels vs Desktop Hover:**
   - Desktop: Retain CSS `:hover` image cycling on tour cards.
   - Mobile/Touch: Convert card images into touch-swipeable carousels with visual indicator dots using CSS Scroll Snap or Embla Carousel.
4. **Multi-Currency Switcher:**
   - Add a global header selector (USD `$`, EUR `€`, GBP `£`, EGP `EGP`).
   - Calculate live conversion rates using a free currency API (e.g., `exchangerate-api`), keeping EGP as base currency in Supabase.
5. **Verified Guest Reviews with Photos:**
   - Allow verified guests to upload authentic photos/videos with their review. Display a "Verified Guest" badge on authentic entries.

---

## PHASE 5: UNIVERSAL AI KEY POOL & SMART DYNAMIC FAILOVER
1. **Admin Universal AI Manager (`/admin/settings/ai`):**
   - Build a UI to manage unlimited AI Providers dynamically.
   - Admin can register entries with fields: `Provider Name`, `Base URL` (OpenAI-compatible endpoint format: Groq, OpenRouter, Gemini, DeepSeek, SambaNova), `API Key`, and `Model ID`.
2. **Dynamic Round-Robin & Quota Failover Router (`lib/ai-router.ts`):**
   - **Primary Strategy:** Execute request against the first active key/model in the pool.
   - **Automatic Failover:** If Provider A throws `429 (Quota Exceeded)`, `503 (High Demand)`, or network error, seamlessly retry the exact request on Provider B, then Provider C without crashing or interrupting the user.
   - **Default Provider:** Default to `gemini-1.5-flash` (DO NOT use `3.8-flash` due to strict free tier limits).
3. **Database-Driven i18n & Auto-Translation:**
   - Translatable Tour fields (`title`, `description`, `itinerary`, `inclusions`) use JSONB format (`{ "en": "...", "ar": "..." }`).
   - Admin UI "Auto-Translate" button calls the AI Router to populate all missing JSONB language keys in 1-click.
4. **AI Blog Generator (`/admin/blogs`):**
   - SEO Article Generator modal: Input topic/destination -> AI Router writes a fully formatted Markdown article saved as Draft for review.

---

## PHASE 6: ADMIN CONTROL TOGGLES & LEGACY MIGRATIONS
1. **Destination Visibility Toggle:**
   - Add `isVisible: boolean` column to `destinations`.
   - Admin Dashboard toggle to show/hide specific destinations instantly from public frontend listings.
2. **Legacy Tour Data Backfill:**
   - Provide a migration script/utility to format legacy tours missing structured `itinerary` or `inclusions/exclusions` arrays into the new schema.

---

## PHASE 7: VERIFICATION & CODE COMMIT PROTOCOL
- Execute step-by-step.
- Report completion of each phase with TypeScript validation checks.
- **DEPLOYMENT BLOCK:** DO NOT deploy until receiving explicit instruction: `"APPROVED FOR PRODUCTION DEPLOYMENT"`.