# Coding Standards & Guidelines — Talago Tours

## 1. TypeScript & React Invariants

- **Strict Mode:** `tsconfig.json` has `strict: true`. No implicit `any` allowed.
- **Server Components by Default:** Keep page wrappers and static data fetchers as React Server Components (RSC). Only add `'use client'` when hooks (`useState`, `useEffect`, `useCallback`), custom context, or client event listeners are strictly necessary.
- **Path Aliases:** Use `@/*` pointing to `./src/*`. Never use brittle relative deep imports like `../../../../components/*`.

---

## 2. Component Guidelines (UI/UX Pro Max & Unslop)

- **One Responsibility:** Break large screens into focused domain components (`src/components/tours/`, `src/components/checkout/`).
- **No Inconsistent Design Overlaps:** Use standard Tailwind utility classes conforming to the tokens defined in `docs/design-system/visual-philosophy.md`.
- **Accessible Forms:** All inputs must have associated labels (or `aria-label`), visible focus rings (`focus:ring-[#00E5FF]`), and clear error messages.
- **Responsive Targets:** Minimum interactive touch target size is 44px for buttons, chips, and selector options.

---

## 3. API Route Handler Guidelines

- Always use the Next.js `NextRequest` and `NextResponse` abstractions.
- All mutating endpoints (`POST`, `PUT`, `DELETE`) must validate the request payload using Zod or strict type guards.
- Protected endpoints must verify the session using the authoritative Supabase client or server session cookie before accessing database records.
- Handle rate-limiting gracefully using `src/utils/rateLimit.ts`.
