# Specification: Repository Inventory, Consolidation & Aggressive Cleanup

## 1. Existing Behavior and Actual Problem
- Over successive fix iterations, the repository accumulated dead code, duplicate route handlers, orphaned draft pages, obsolete prompts, duplicate test files, and superseded audit reports.
- Redundant and dead directories include:
  - `src/app/auth/callback/` (duplicated outside `src/app/(public)/auth`)
  - `src/app/(public)/destinations/[slug]` (redundant separate destination landing pages)
  - `src/app/(public)/destinations` (redundant catalog wrapper)
  - Superseded markdown documents in `docs/archive/` and `docs/engineering/`
  - Obsolete test artifacts and loose scratch files.

## 2. Desired Behavior
- **Aggressive & Technologically Justified Deletion**:
  - Delete every confirmed obsolete, orphaned, and duplicate file.
  - Consolidate single sources of truth.
  - Remove dead dependencies from `package.json`.
- **Protected Assets**:
  - Prisma schema, migrations, active seed scripts.
  - Security configurations and environment schemas.
  - Active E2E tests and production build tooling.
  - Authoritative documentation in `docs/architecture/`, `docs/specs/`, and `AGENTS.md`.

## 3. Inventory & Categorization
- Review all tracked files across `src/`, `docs/`, `scripts/`, `e2e/`.
- Maintain a clear manifest of deleted, consolidated, and retained files.

## 4. Acceptance Criteria
- Zero dangling imports or broken references across the entire codebase.
- `npx tsc --noEmit` passes with 0 errors.
- `npm run build` succeeds across all routes.
- Repository is clean, lightweight, and instantly navigable for future agents.
