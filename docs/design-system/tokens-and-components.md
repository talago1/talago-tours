# Design Tokens & Component Catalog — Talago Tours

## 1. Palette Tokens (Tailwind Configuration)

```typescript
// Core Brand Colors
navy: {
  950: '#070F1E', // Canvas & deep background
  900: '#0B1528', // Elevated cards & surface panels
  800: '#111F38', // Hover surfaces & inputs
  700: '#1E293B', // Dividers & secondary outlines
}
cyan: {
  400: '#00E5FF', // Electric Cyan: CTA buttons & key active links
  500: '#00C2E0', // Pressed active state
}
gold: {
  400: '#FFD700', // Star ratings & premium badges
  500: '#EAB308', // Discount chips
}
coral: {
  500: '#FF5B00', // Pay on Arrival & urgency alerts
}
```

---

## 2. Reusable Component Primitives

- **Buttons:**
  - `variant="primary"`: Gradient from `#00E5FF` to `#0284C7` with dark text (`#070F1E`), uppercase, font-black.
  - `variant="outline"`: Border `border-white/10 bg-white/5` with hover `hover:border-[#00E5FF]/40`.
- **Cards (`PublicTourCard`):**
  - Rounded `rounded-2xl`, border `border-white/10`, background `bg-[#0B1528]`.
  - Image aspect ratio: 4:3 with subtle zoom on hover.
  - Badge positioning: Top-left tag with backdrop blur.
- **Modal Dialogs (`ContinuousBookingModal`):**
  - Full mobile screen with safe-area padding; centered dialog on desktop (`max-w-xl`).
  - Backdrop blur `backdrop-blur-md` with `bg-black/80`.
