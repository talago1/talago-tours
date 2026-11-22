# Local Setup & Development — Talago Tours

## 1. Prerequisites

- **Node.js:** v18.17+ or v20+ (recommended v20 LTS)
- **Package Manager:** `npm`
- **Database:** Supabase PostgreSQL instance

---

## 2. Environment Variables

Create a `.env.local` file in the project root with the following keys:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Database Connection (Direct & Pooled)
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"

# Telegram Bot & OIDC (Optional for local test)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_BOT_USERNAME="talagoo_bot"
TELEGRAM_OIDC_CLIENT_ID="your-client-id"
TELEGRAM_OIDC_CLIENT_SECRET="your-client-secret"
```

---

## 3. Installation & Database Sync

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Apply schema to database (if needed)
npm run db:push

# 4. Start local development server
npm run dev
```

Visit `http://localhost:3000` to preview the public storefront.

---

## 4. Quality Verification Commands

Before pushing or opening a PR, always run:

```bash
# Typecheck
npx tsc --noEmit

# Production Build
npm run build

# End-to-End Tests
npx playwright test
```
