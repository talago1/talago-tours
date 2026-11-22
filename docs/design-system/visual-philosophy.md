# Visual Philosophy & Design Reference — Talago Tours

## 1. Visual Philosophy (Canvas Design & UI/UX Pro Max)

Talago Tours is designed to evoke the warmth, majesty, and crystal-clear waters of Egypt and the Red Sea. It steers clear of generic "AI aesthetic tropes" (such as random purple gradient glows, floating glossy blobs, and meaningless animations) in favor of purposeful, high-contrast, editorial travel aesthetics.

### Key Pillars:
1. **Marine Depth & Night Sky:** Deep midnight navy backgrounds (`#070F1E` and `#0B1528`) provide maximum contrast for vivid photography and crisp typography.
2. **Electric Aqua & Gold Highlights:**
   - `#00E5FF` (Electric Aqua / Cyan): Used for primary action buttons, active navigation states, links, and confidence badges.
   - `#FFD700` / `#EAB308` (Desert Gold): Used for ratings, reviews, exclusive VIP badges, and pricing discounts.
   - `#FF5B00` (Coral Amber): Used for urgent availability badges and "Zero Upfront / Pay on Arrival" guarantees.
3. **Typography Hierarchy:**
   - Clear modern sans-serif typeface (`Inter` / `system-ui`).
   - High typographic scale contrast: bold editorial headings (`font-black tracking-tight`) paired with refined, legible metadata captions (`text-xs font-semibold`).
4. **Purposeful Micro-Interactions:**
   - Subtle scale hover (`hover:scale-[1.02] active:scale-[0.98]`).
   - Smooth horizontal snap scrolling for mobile experience chips (`snap-x snap-mandatory`).
   - Clean popover layering mounted to `document.body` via React Portals (`z-[9999]`) to guarantee zero z-index conflicts.

---

## 2. Design Tokens

| Token | Hex Value | Semantic Usage |
|---|---|---|
| `bg-navy-950` | `#070F1E` | Root page background, deep contrast canvas |
| `bg-navy-900` | `#0B1528` | Card backgrounds, modals, elevated surfaces |
| `accent-cyan` | `#00E5FF` | Primary action triggers, key links, active badges |
| `accent-gold` | `#FFD700` | Review stars, VIP indicators, premium highlights |
| `accent-coral` | `#FF5B00` | Pay on Arrival highlights, discounts, warnings |
| `border-card` | `rgba(255, 255, 255, 0.1)` | Crisp, subtle border separating cards |
| `text-primary` | `#F8FAFC` | Primary headings, titles, active labels |
| `text-muted` | `#94A3B8` | Body descriptions, secondary labels, subtitles |

---

## 3. UI Component Systems

- **shadcn/ui Principles:** Clean, accessible Radix-style primitives, accessible dialogs, and controlled inputs without heavy external runtimes.
- **Mobile First Touch Targets:** All interactive chips, buttons, and inputs maintain a minimum touch target size of 44x44px.
- **Animation Safety:** All CSS and transition animations honor `prefers-reduced-motion` to ensure accessibility and high mobile frame rates.
