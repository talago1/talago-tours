# Talago Tours — Brand Guidelines

> **Identity:** Marine Depth & Night Sky — an international Red Sea & Egypt editorial travel marketplace.

---

## 1. Brand Voice & Copywriting
- **Tone:** Direct, trustworthy, warm, and traveler-focused — never robotic or filled with hype.
- **Voice:** Active, sentence-case verbs (*"Book now"*, *"Continue booking"*, *"Withdraw request"*). Keep action names consistent from trigger to confirmation.
- **Clarity over cleverness:** Name things by what travelers understand (*"My Requests"*, *"Pay on Arrival"*, *"Free cancellation"*), not internal system terms.
- **Errors & Empty States:** State clearly what happened and how to proceed; never apologize vaguely or leave a dead end.
- **8-Locale Parity:** Every user-facing string must be localized across all 8 supported locales (`en`, `de`, `ru`, `uk`, `fr`, `it`, `pl`, `es`) with no hardcoded English leaks.

---

## 2. Color System

| Token | Hex | Role |
|-------|-----|------|
| `navy-950` | `#070F1E` | Root page canvas & deep night background |
| `navy-900` | `#0B1528` | Cards, modals, drawers, elevated surfaces |
| `navy-800` | `#111F38` | Interactive hover surfaces & form inputs |
| `navy-700` | `#1E293B` | Subtle dividers & secondary borders |
| `aqua-400` | `#00E5FF` | Primary CTAs, active states, focus rings, key links |
| `aqua-500` | `#00C2E0` | Pressed/hover primary state |
| `gold-400` | `#FFD700` | Star ratings, verified highlights, VIP indicators |
| `coral-500` | `#FF5B00` | Pay on Arrival, urgency badges, limited slots |

---

## 3. Typography & Layout Rules
- **Typeface:** `Inter` / `system-ui` sans-serif with strong scale contrast (`font-black tracking-tight` headings, `text-xs`/`text-sm` legible metadata).
- **Readable Measure:** Body copy and descriptions stay under `80ch` (`max-w-prose`).
- **Cross-Screen Parity:** Mobile (`320px–639px`), tablet (`640px–1023px`), and desktop (`1024px+`) must expose identical booking, resume, withdraw, and notification capabilities.
- **Touch & Accessibility:** Minimum `44×44px` touch targets for interactive controls, visible `:focus-visible` ring (`#00E5FF`), and full respect for `prefers-reduced-motion`.
