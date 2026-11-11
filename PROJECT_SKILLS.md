# Talago Tours — Project Skills Registry

This document records all specialized agent skills installed and maintained for the Talago Tours codebase.

---

## 1. Installed Project Skills

| Skill | Source | Path | Trigger & Purpose |
|---|---|---|---|
| **security-audit** | `cloudflare/security-audit-skill` | `.agents/skills/security-audit/SKILL.md` | Focused security reviews: customer auth, session tokens, booking ownership, API route authorization, Paymob HMAC, sensitive customer data protection. |
| **vercel-react-best-practices** | `vercel-labs/agent-skills` | `.agents/skills/vercel-react-best-practices/SKILL.md` | Performance and code hygiene guidelines for React & Next.js: reducing bundle size, client vs server components, eliminating re-renders, Suspense boundaries. |
| **vercel-optimize** | `vercel-labs/agent-skills` | `.agents/skills/vercel-optimize/SKILL.md` | Vercel production optimization: caching strategies, image optimization, edge function execution limits, bandwidth and invocation cost reduction. |
| **web-design-guidelines** | `vercel-labs/agent-skills` | `.agents/skills/web-design-guidelines/SKILL.md` | UX/UI accessibility, responsive design check (mobile/tablet/desktop), micro-interactions, form states, and design system consistency. |

---

## 2. Integrated Built-in Tools & Knowledge Engines

| Engine / Skill | Scope | How It Is Used |
|---|---|---|
| **Graphify** (`graphify-out/`) | Codebase Knowledge Graph | Used for dependency queries, node exploration (`graphify query`), and relationship tracing before modifying complex shared modules. |
| **Reverse Engineer Anything (REA)** | Competitive & System Architecture | Benchmarking against industry leaders (Sputnik8, Viator, GetYourGuide, Tripster) to replicate top-tier customer and operator workflows. |

---

## 3. Skill Activation Guidelines

1. **Before modifying auth, payments, or booking ownership:**
   - Consult `security-audit` principles (fail-closed auth, ownership checks via session & `accessToken`, constant-time HMAC comparison).
2. **Before building or refactoring UI components:**
   - Consult `vercel-react-best-practices` to ensure minimal client-side bundle and optimal server component usage.
   - Consult `web-design-guidelines` for mobile touch targets, contrast ratios, and loading/error states.
3. **Before deploying production builds:**
   - Verify zero TypeScript errors (`npx tsc --noEmit`).
   - Run production Next.js build verification (`npm run build`).
   - Run AST knowledge graph update (`graphify update .`).

