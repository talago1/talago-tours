<!--
  Sync Impact Report
  Version change: N/A (initial) → 1.0.0
  This is the initial constitution for the TALAGO project.
  No previous version to compare against.

  Sections added:
  - I. Code Quality & Architecture Principles
  - II. Performance Requirements & Core Web Vitals
  - III. User Experience (UX) Consistency & Conversion Architecture
  - IV. Verification & Testing Standards
  - V. The Developer's Pledge
  - Development Workflow & Governance

  Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No changes needed (constitution check gate is generic)
  - .specify/templates/spec-template.md: ✅ No changes needed (generic structure)
  - .specify/templates/tasks-template.md: ✅ No changes needed (generic structure)

  Follow-up TODOs: None
-->

# TALAGO Constitution

## Core Principles

### I. Code Quality & Architecture Principles
We write code optimized for maximum readability, strict type safety, and seamless horizontal scaling.

- **Server-First Mindset (Next.js App Router):** By default, components are React Server Components (RSC) to maximize SEO and fetch data directly at the edge. Explicitly use `"use client"` only for components requiring user interaction, dynamic states, or browser APIs (e.g., the Booking Widget or Image Uploader).
- **Strict Type-Safety Matrix:** The type `any` is strictly prohibited. All translation models containing our 6 launch languages (EN, DE, RU, FR, IT, TR) must use structured JSON schemas backed by TypeScript types:
  ```typescript
  type LocalizedString = {
    en: string;
    de: string;
    ru: string;
    fr: string;
    it: string;
    tr: string;
  };
  ```
- **Zero Tailwind Bloat:** Avoid utility-class soup. Use logical layouts (`flex`, `grid`) and componentize recurring design structures rather than relying on global style sheets. Maintain strict compliance with the **LTR** visual layout orientation across all pages.
- **Semantic HTML Only:** Interfaces must rely on semantic native tags (`<main>`, `<section>`, `<article>`, `<aside>`) to maintain structural elegance and maximum search engine scrapability.

### II. Performance Requirements & Core Web Vitals
TALAGO is built to win the Google SEO war for Red Sea tourism. Speed is our primary currency.

- **Google PageSpeed Insights Thresholds:** Target mobile score ≥ 90, Target desktop score ≥ 95.
- **Core Web Vitals Enforcements:**
  - **LCP (Largest Contentful Paint):** ≤ 1.5s. Main image grids must use priority loading (`priority={true}`) via `next/image`.
  - **CLS (Cumulative Layout Shift):** Absolute 0. All dynamic elements, pricing calculations, and media placeholders must have predetermined aspect ratios or bounding boxes to avoid text or layout popping.
- **Media Treatment Protocol:** No raw assets are permitted. All uploaded images from the device must be intercepted on the client side, compressed and converted into lightweight WebP files before hitting the secure Supabase storage.
- **Zero Third-Party Animation Bloat:** Absolutely no heavy outer dependencies (like Framer Motion or GSAP) for structural UI elements. All transitions, hovers, active sidebar states, and modal viewports must rely exclusively on high-performance native Tailwind transitions (`transition-all duration-300 ease-in-out`).

### III. User Experience (UX) Consistency & Conversion Architecture
The interface acts as a continuous sales funnel. Visual components must evoke immediate trust and direct action.

- **The Conversion Palette Tokens:**
  - `primary-coral` (`#FF5B00`): Strictly dedicated to primary Action Prompts, Checkout triggers, and Call-to-Actions (CTAs). No passive styling or backgrounds can use this color.
  - `secondary-forest` (`#00473F`): Reserved for trust badges, validation icons, header layouts, and premium adventure tags.
  - `neutral-canvas`: Pure crisp white surfaces (`#FFFFFF`) with ultra-light structural gray breaks (`#F8F9FA`).
- **Sticky & Floating Widget Mechanics:**
  - **Desktop:** Booking sidebars must lock cleanly to the screen on scroll without micro-stuttering.
  - **Mobile:** The checkout selector transforms into a persistent, finger-accessible bottom sheet that takes zero text space but remains ready for instant click execution.
- **Fail-Safe Error Form Interactions:** Inputs (especially Zone selection and Hotel Names) must handle client-side validations gracefully before hitting endpoints. Button states must transform instantly into disabled loading states upon click to eliminate duplicate booking double-charges.

### IV. Verification & Testing Standards
Code cannot be pushed to production without systematic verification of data and responsiveness.

| Test Focus | Methodology / Target Verification | Expected Success Criteria |
| :--- | :--- | :--- |
| **Multi-Currency Precision** | JavaScript Decimal operations via Prisma for all pricing transformations. | Absolute tracking accuracy without rounding errors (e.g., $100.00 USD must calculate exactly across foreign exchange rate floats). |
| **Zone Edge Calculation** | Mocking checkouts from remote hotels (El Gouna, Makadi). | Script accurately appends the predetermined extra transfer fee to base rates. |
| **Cross-Device Fluidity** | Chrome DevTools device matrix emulation (from iPhone SE to Ultra-wide 4K). | Fluid breakpoint responses without text wrapping drops or horizontal page bleeding. |
| **Edge-Case Form Resilience** | Simulating missing data injections (empty hotel rows, malformed phone strings). | UI halts submissions smoothly with precise validation tooltips. |

### V. The Developer's Pledge
We commit to zero-compromise engineering. We will not use placeholder components, fake code snippets, or shortcuts. Every piece of code will be modular, structural, enterprise-ready, and fully compliant with the TALAGO digital ecosystem blueprint.

## Development Workflow & Governance

### Amendment Procedure
- Amendments require documentation of the change, approval from the project lead, and a migration plan for any affected code.
- This constitution supersedes all other practices and ad hoc decisions.

### Versioning Policy
- **MAJOR:** Backward incompatible governance/principle removals or redefinitions.
- **MINOR:** New principle/section added or materially expanded guidance.
- **PATCH:** Clarifications, wording, typo fixes, non-semantic refinements.

### Compliance Review
- All PRs and reviews must verify compliance with this constitution.
- Complexity must be justified when it deviates from the principles herein.
- Use `.specify/memory/constitution.md` as the single source of truth for governance.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
