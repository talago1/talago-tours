# Specification: Performance Engineering & Resource Optimization

## 1. Existing Behavior and Actual Problem
- First Load JS bundles on certain routes approached 300kB due to unoptimized client libraries, duplicate date parsing utilities, and unnecessary client components.
- Repeated polling and duplicate fetches on initial render caused unnecessary database load on Supabase/PostgreSQL.

## 2. Desired Behavior
- **Strict Performance Budgets**:
  - Shared First Load JS <= 90 kB.
  - Critical customer routes (Homepage, Tours Catalog, Checkout) First Load JS optimized with selective dynamic imports for non-critical modals (Review Modal, Cancellation Modal).
- **Server Components by Default**:
  - Data fetching for tours, destinations, and initial metadata handled server-side in Server Components.
  - `'use client'` reserved exclusively for interactive UI trees (booking forms, calendar, language toggles).
- **Database & Query Optimization**:
  - Zero N+1 queries. Foreign key indexes verified on `Booking`, `Tour`, `CustomerProfile`, `Review`, `Transaction`.
  - Pagination and strict limits on all public catalog and review APIs.
- **Image & Media Optimization**:
  - Next.js `<Image />` with `sizes`, `priority` on above-the-fold heroes, and modern web formats (AVIF/WebP).

## 3. Tooling & Guidelines
- Applied skills: `speed-engineer`, `vercel-optimize`, `vercel-react-best-practices`.
- Next.js production build bundle analyzer.

## 4. Acceptance Criteria
- All 92+ routes build green with zero compiler warnings or bundle errors.
- Lighthouse / Core Web Vitals targets: LCP < 2.5s, FID/INP < 100ms, CLS < 0.1.
