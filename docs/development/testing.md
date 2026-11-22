# Testing & Quality Gates — Talago Tours

## 1. Test Strategy & TDD Workflow

Talago Tours enforces a strict Test-Driven Development (TDD) workflow for all bug fixes and architectural modifications:

1. **RED:** Write a failing test reproducing the defect or specifying the new behavior before modifying production code.
2. **GREEN:** Implement the minimal, correct fix that makes the test pass.
3. **REFACTOR:** Clean up code, remove duplication, and optimize without breaking passing tests.
4. **REGRESSION VERIFICATION:** Run the entire test suite across desktop and mobile browsers.

---

## 2. Test Suite Overview

E2E testing is powered by **Playwright** (`@playwright/test`):

```
e2e/
├── auth-booking-notifications.spec.ts   # Core architectural regression suite
├── smoke.spec.ts                        # Basic public route availability
├── telegram-auth.spec.ts                # Telegram OIDC login flow verification
├── ai-tour-builder.spec.ts              # Admin tour editor functionality
├── importer-and-company.spec.ts         # Trip import and business profile tests
└── marketplace-consolidation.spec.ts    # Marketplace catalog consolidation tests
```

---

## 3. Running Tests

### Run all E2E tests:
```bash
npx playwright test
```

### Run specific critical architecture test:
```bash
npx playwright test e2e/auth-booking-notifications.spec.ts
```

### Run tests in headed UI mode (interactive debugging):
```bash
npx playwright test --ui
```

---

## 4. Protected Regressions

The test suite explicitly guards against:
- **Telegram login stuck on loading:** Verifies session creation and redirection to `/account`.
- **Redirect loops:** Verifies `/login` or `/auth` with existing session redirects cleanly without infinite loop.
- **Navbar & Auth disagreement:** Verifies authenticated identity is synchronized across navigation, account, and booking.
- **Booking idempotency:** Verifies submitting duplicate `idempotencyKey` values does not duplicate bookings in the database.
- **Category taxonomy & localization:** Verifies global activity categories render correctly without hardcoded city names.
- **Admin notifications layering:** Verifies notifications dropdown renders above all elements using React Portal.
