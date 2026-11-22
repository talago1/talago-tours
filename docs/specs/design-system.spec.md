# Specification: Global Design System & Component Visual Architecture

## 1. Existing Behavior and Actual Problem
- The UI suffered from "AI slop" tells: inconsistent purple/cyan glows, excessive emoji badges, redundant floating cards, and mixed typography styles across pages.
- Competing button variants, different modal structures, and scattered CSS utilities made maintenance difficult and bloated the bundle.

## 2. Desired Behavior
- **Refined International Marketplace Aesthetic**:
  - Deep luxury palette grounded in Slate 900 (`#070F1E` / `#0B1528`), clean warm white text (`#F8FAFC`), and an elegant cyan accent (`#00E5FF`).
  - Clear typography scale utilizing Inter/system sans-serif fonts with strict hierarchical weights.
  - Generous spacing (consistent 8pt grid system) without visual clutter.
- **Component Consolidation**:
  - One authoritative Card architecture (`PublicTourCard.tsx`) used across homepage, catalog, and related tours.
  - One authoritative Modal foundation (Radix/Portal dialogs) for booking, reviews, and cancellations.
  - One authoritative Button hierarchy: Primary, Secondary, Ghost, Danger.
- **Motion & Micro-interactions**:
  - Purposeful, lightweight transitions (150ms-250ms ease-out) for dropdowns and hover states.
  - Zero heavy animation libraries that impact First Input Delay (FID) or Interaction to Next Paint (INP).
  - No decorative animations on checkout or account forms where speed and clarity matter most.

## 3. Source-of-Truth Data and Module Ownership
- **Design Tokens**: `docs/design-system/tokens-and-components.md` and `tailwind.config.js`.
- **Visual Philosophy**: `docs/design-system/visual-philosophy.md`.
- **Shared Components**: `src/components/ui/`, `src/components/landing/PublicTourCard.tsx`.

## 4. Acceptance Criteria
- Zero missing Tailwind classes or raw inline styles.
- Flawless responsiveness across standard mobile viewports (375px, 390px, 414px) and desktop displays (1280px, 1440px, 1920px).
- Dark/Light storefront contrast passes WCAG AA standards (minimum 4.5:1 ratio for body text).
