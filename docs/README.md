# Talago Tours — Engineering Documentation

Welcome to the central technical documentation for the Talago Tours platform.

This directory serves as the definitive reference for the platform's architecture, implementation patterns, development standards, and operations.

---

## 1. Documentation Map

```
docs/
├── README.md                           # This index
├── architecture/                       # Core system architecture & subsystems
│   ├── system-overview.md              # High-level architecture, technology stack, and topology
│   ├── authentication.md               # Supabase auth, session cookies, Telegram OIDC, and role guards
│   ├── booking.md                      # Unified booking engine, pricing, drafts, and idempotency
│   ├── notifications-and-chat.md       # Live chat, admin/customer notifications, and portal layering
│   ├── database-and-data-ownership.md  # Prisma schema, model relationships, and data boundaries
│   ├── categories-and-localization.md  # 8-locale taxonomy, destination translation, and i18n
│   ├── feature-inventory.md            # Comprehensive breakdown of all platform capabilities
│   └── project-map.md                  # Component, route, and API map
├── design-system/                      # Design philosophy and component standards
│   ├── visual-philosophy.md            # Canvas Design & UI/UX Pro Max visual philosophy
│   └── tokens-and-components.md        # Color tokens, typography, button variants, and spacing
├── development/                        # Developer onboarding and workflows
│   ├── local-setup.md                  # Running locally, database setup, and environment variables
│   ├── testing.md                      # Playwright E2E, TDD workflow, and test fixtures
│   └── coding-standards.md             # TypeScript strictness, server vs client components, and linting
├── operations/                         # Operational runbooks and infrastructure
│   ├── deployment.md                   # Vercel production deployment and CI/CD pipelines
│   ├── email-configuration.md          # Resend / Brevo transactional notifications
│   └── incident-runbook.md             # Common production issues, monitoring, and debugging
├── decisions/                          # Architecture Decision Records (ADRs)
│   └── decisions-log.md                # Key technical decisions and historical architectural choices
└── archive/                            # Historical reports, audit logs, and retirement dry runs
```

---

## 2. Fast Links for Engineering Tasks

- **Working on Auth / Telegram Login?** → See [`docs/architecture/authentication.md`](./architecture/authentication.md)
- **Modifying the Booking Flow or Checkout?** → See [`docs/architecture/booking.md`](./architecture/booking.md)
- **Adding or Localizing Categories & Destinations?** → See [`docs/architecture/categories-and-localization.md`](./architecture/categories-and-localization.md)
- **Styling or Adding UI Components?** → See [`docs/design-system/visual-philosophy.md`](./design-system/visual-philosophy.md)
- **Running Automated E2E Tests?** → See [`docs/development/testing.md`](./development/testing.md)
- **Deploying to Vercel or Updating Database?** → See [`docs/operations/deployment.md`](./operations/deployment.md)

---

## 3. Maintenance Rules

1. **Keep documentation aligned with code**: Whenever an API route, Prisma model, or component contract changes, update the corresponding document.
2. **Never duplicate knowledge**: Put architectural details in the designated architecture doc and reference it from `AGENTS.md` and `README.md`.
3. **Archive, don't clutter**: Store one-off reports and historical decisions in `docs/archive/`.
