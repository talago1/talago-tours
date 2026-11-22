---
name: speed-engineer
description: Keeps apps built with AI fast under real users. Covers the 5 things AI usually forgets — database indexes and N+1 queries, pagination, image optimization, caching, and skeleton loading — sized to how big the project really is. Use whenever you create or change anything that touches the database (tables, migrations, queries, Supabase, Postgres, Prisma, Drizzle), a list/feed/table of records, data fetching or API routes, image upload or display, or loading states. Also use when the user says the app or a page is slow, laggy, hangs, or "takes time to load", asks to optimize performance, or asks to review/audit the project before launch. Triggers include "speed", "performance", "slow", "بطيء", "تقيل", "بيهنج", "سرّع".
---

# Speed Engineer: build apps that stay fast with real users

An app feels fast when one developer tests it with 10 rows. It slows down when 100+ real users and thousands of rows arrive. This skill makes you build — and review — for the real load, **without over-engineering a small project**.

Two principles drive every decision here:

1. **Right-size.** Every recommendation depends on the project's size tier (S / M / L). A 50-user MVP does not need Redis. A 50k-user app cannot live without indexes and caching. Never apply L-tier solutions to an S-tier project.
2. **Evidence, not guesses.** Read the code before claiming something is slow or fine. Measure before and after a fix when you can.

---

## Step 0 — Pick the mode

Decide from the user's request:

| Mode | When | What you do |
|---|---|---|
| **Build** | Writing or changing a feature that touches DB, lists, images, data fetching or loading UI | Apply the rules while writing, then run the self-check (end of this file) |
| **Audit** | "Review / audit / check performance / before launch / راجع المشروع" | **Read-only.** Produce the report, then ask which fix to start with |
| **Fix-slow** | "This page is slow / the app hangs" | Find the biggest bottleneck first, fix it, verify, then move to the next |

If unclear, ask in one short line. When in Build mode for a small change, keep it light: do not run the full profile questions for a one-line edit (see Step 2).

---

## Step 1 — Map the project (read-only, quick)

Before deciding anything, look. Spend a few tool calls, not many.

- **Stack:** read `package.json` (and lockfile if needed). Note framework + **exact version** (Next.js / React / Vite / Remix / Nuxt / Express…), ORM or client (supabase-js, Prisma, Drizzle, raw `pg`), data-fetching library (TanStack Query, SWR, none), image handling (`next/image`, Supabase Storage, Cloudinary, plain `<img>`), hosting hints (`vercel.json`, `netlify.toml`, Dockerfile).
- **Database shape:** find the schema (`supabase/migrations/`, `prisma/schema.prisma`, Drizzle schema, SQL files). Count tables; note which ones will grow without limit (posts, messages, orders, logs, events, notifications…).
- **Existing profile:** check `CLAUDE.md` / `AGENTS.md` for a `## Performance profile` section. If it exists, **use it and skip Step 2** unless the user says things changed.
- **Size signals:** number of tables and routes, presence of auth/multi-tenant, payments, uploads, realtime, admin dashboards, existing indexes, any analytics or row counts you can see. If a database MCP/CLI is available and the user allows it, row counts of the biggest tables are the strongest signal.

Write down (for yourself) a one-paragraph map: stack, versions, growing tables, current state of each of the 5 areas.

---

## Step 2 — Ask the user about expected scale

The code shows what exists. Only the user knows how big it will get. Ask **once per project**, in **one round**, and only what the code could not answer.

**When to ask:** Audit and Fix-slow modes always (unless a saved profile exists). Build mode only when the change creates a new table, a new list/feed, image upload, or a new data-heavy page — not for small edits.

**How to ask:** if an `AskUserQuestion` tool (or similar multiple-choice question tool) is available, use it — max 4 questions, each with 2–4 clear options (an "Other" free-text option is added automatically). If no such tool exists (e.g. Cursor), ask the same questions as a short numbered list in chat and wait for the answer.

Write the questions in **the user's language** (Arabic → Egyptian Arabic, keep technical words in English). Pick the most useful 3–4 of these, skipping any the code already answered:

1. **Users** — "How many users do you expect in the first 6 months?"
   Options: Under 100 (testing / MVP) · 100–1,000 · 1,000–10,000 · More than 10,000
2. **Biggest data** — "What's the biggest thing in your app that will keep growing?" (offer the actual growing tables you found, e.g. "posts", "orders", "messages") and/or "Roughly how many rows will it reach in a year?" Options: Under 10k · 10k–100k · 100k–1M · Over 1M
3. **Freshness** — "When data changes, how fast must other users see it?"
   Options: Instantly (chat, live prices, stock) · Within a minute is fine · Within an hour is fine · Mostly static content
4. **Images** — "How central are images?" Options: Barely any · Some (avatars, logos) · Many (products, posts, galleries) · The app is about images/media
5. **Budget / infra** — "Can we add paid or extra services (Redis, image CDN, Supabase Pro image transforms) if needed?"
   Options: Free tier only · A small monthly cost is OK · Whatever it needs
6. **Pain right now** (Fix-slow only) — "Which page or action feels slow?"

If the user skips or says "I don't know": pick the tier from the size signals, **state your assumption in one line** ("I'll assume tier S: under 1,000 users"), and continue. Never block on this.

**Save the answers.** Offer to add (or update) this block in `CLAUDE.md` (or `AGENTS.md` if that's what the project uses) so nobody asks again:

```markdown
## Performance profile
- Tier: S | M | L  (decided YYYY-MM-DD)
- Expected users (6 months): …
- Biggest growing tables: … (~rows/year)
- Freshness needs: …
- Images: …
- Infra budget: …
- Always use the `speed-engineer` skill when touching DB queries/schema, lists, data fetching, images or loading states.
```

That last line matters: it keeps this skill active in future sessions, even when a request doesn't look like a "performance" task. In Audit mode, ask before writing it.

---

## Step 3 — Choose the tier

| Tier | Typical signals |
|---|---|
| **S** — MVP / small | < 1,000 users, biggest table < 100k rows, single region, free tier |
| **M** — growing product | 1,000–50,000 users, tables 100k–5M rows, real traffic daily |
| **L** — scale | 50,000+ users, tables in the millions, spikes, multiple services |

When signals disagree, choose by the **biggest growing table** and the **freshness needs**, not by today's user count. If in doubt between two tiers, choose the smaller one and note what to revisit when the app grows.

### What each tier needs

| Area | S | M | L |
|---|---|---|---|
| **1. Database** | Index every FK and every column used in WHERE / ORDER BY / JOIN of real queries. Zero N+1. Select only needed columns. | + composite indexes matching common filter+sort, check slow queries with `EXPLAIN ANALYZE`, `pg_stat_statements`/Supabase advisors | + partial/covering indexes, connection pooling, materialized views or summary tables for heavy aggregates, read replicas if needed |
| **2. Pagination** | Every list query has a `limit`. Offset pagination is fine. | Keyset (cursor) pagination for feeds / infinite scroll / big tables. Avoid exact `count(*)` on large tables. | Keyset everywhere that grows. Search via proper indexes (trigram / full-text) or a search service. |
| **3. Images** | Compress + resize on upload (or before upload), WebP, lazy-load, width/height set | + generated thumbnails per size, responsive `srcset`/`sizes`, image CDN or storage transforms | + dedicated image CDN with long-lived cache, async processing queue for uploads |
| **4. Caching** | Framework/HTTP caching for public static data, client cache (`staleTime`) for repeated fetches. **No Redis.** | + CDN/ISR for public pages, tagged revalidation on writes, cache expensive aggregates | + shared cache (Redis/KV) for hot data, cache stampede protection, precomputed results |
| **5. Loading UX** | Skeleton for every async view, empty + error states, no request waterfalls | + streaming / Suspense per section, optimistic updates for common actions | + prefetch on hover/viewport, performance budgets in CI |

The **S column is the baseline for every project**. M and L add to it.

---

## The 5 areas — rules, how to apply them, and how to verify

For every rule: apply it in Build mode; check it in Audit mode. Adapt code to the project's actual stack and version — **check the installed version's docs instead of assuming APIs**, especially for framework caching, which changes between major versions.

### 1. Database: indexes and N+1

**Why:** without an index, every lookup scans the whole table — invisible at 100 rows, painful at 100k. N+1 turns one page view into 100 round trips.

**Indexes — do:**
- Postgres does **not** index foreign keys automatically. Add an index on every FK column (`user_id`, `post_id`, `org_id`…).
- Index columns used in `WHERE`, `ORDER BY`, `JOIN`, and in **RLS policies** (e.g. `user_id = auth.uid()` → index `user_id`). An unindexed RLS column slows every query on that table.
- For a common "filter + sort" pattern, use one composite index in that order: `(user_id, created_at desc)` serves `where user_id = ? order by created_at desc`.
- Add indexes through a **migration file**, never by hand only in a dashboard.
- On a large table that is already in production, prefer `create index concurrently` (it must run outside a transaction — check how the project's migration tool handles that). On small tables a normal `create index` is fine.

```sql
-- FK + sort pattern used by the posts feed
create index if not exists posts_user_id_created_at_idx
  on public.posts (user_id, created_at desc);
```

**Indexes — don't:** index every column "just in case" (each index slows writes and uses space), or index low-variety columns alone (e.g. a boolean) unless it's a partial index for a rare value.

**N+1 — do:**
- Fetch related data in **one query**: a JOIN, Supabase nested select, Prisma `include`/`select`, Drizzle `with`, or a single `where id in (...)` batch.
- Watch for N+1 in the UI too: a list component where **each row** calls its own fetch.
- Select only the columns the page shows. No `select *` on wide tables or tables with large text/JSON columns.

```ts
// ❌ N+1: one query for posts, then one per post for the author
const { data: posts } = await supabase.from('posts').select('*').limit(20)
for (const p of posts) { await supabase.from('profiles').select('*').eq('id', p.user_id) }

// ✅ One query, only needed columns
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, created_at, author:profiles(id, name, avatar_url)')
  .order('created_at', { ascending: false })
  .limit(20)
```

**Verify:** run `explain analyze` on the main queries (look for `Seq Scan` on big tables → missing index). Count the queries a page makes (server logs / Network tab): it should not grow with the number of rows shown. On Supabase, check the Performance / Index advisors.

### 2. Pagination: never load everything

**Why:** `select *` with no limit sends thousands of rows to the browser — slow query, huge payload, frozen UI. It gets worse every day the table grows.

**Do:**
- **Every query that returns a list has a limit.** Default page size 20 (range 10–50), hard max 100 enforced on the server, not only in the UI.
- Always order by a **stable, unique** key (add `id` as a tie-breaker): `order by created_at desc, id desc`. Without it, rows repeat or go missing between pages.
- **Offset** pagination (page 1, 2, 3…) is fine for admin tables and small/medium data where users jump to page numbers.
- **Keyset (cursor)** pagination for feeds, infinite scroll, and big tables (tier M+): "give me 20 rows older than the last one I saw". It stays fast at page 1,000; offset does not.
- Filter and search **on the server**. Never download the whole table to filter it in JavaScript.
- Avoid exact `count(*)` on large tables for every page view; use an estimate (Supabase: `{ count: 'estimated' }`) or "Load more" without a total.

```ts
// ✅ Keyset: next 20 posts after the cursor (created_at + id of the last row shown)
let q = supabase
  .from('posts')
  .select('id, title, created_at')
  .order('created_at', { ascending: false })
  .order('id', { ascending: false })
  .limit(20)
if (cursor) {
  // values are quoted because timestamps contain ':' and '+'
  q = q.or(`created_at.lt."${cursor.created_at}",and(created_at.eq."${cursor.created_at}",id.lt.${cursor.id})`)
}
```

Make sure an index matches the order (`(created_at desc, id desc)`, or with the filter column first if there is one).

**Don't:** paginate tiny fixed lists (countries, 8 categories) — that's over-engineering.

**Verify:** open the page with the Network tab — the response should contain one page of rows, not the whole table. Seed or imagine 100k rows: would this query still return 20?

### 3. Images: never serve the original

**Why:** a 5–10 MB phone photo shown as a 300px card wastes bandwidth, kills mobile performance, and usually becomes the slowest thing on the page.

**Do:**
- **Resize and compress at upload time** (or right before upload in the browser): cap the long side (e.g. 1600–2000px for full view), convert to **WebP** (or AVIF), quality ~75–80. Strip metadata.
  - Server: `sharp`. Browser before upload: a compression library. Or the storage provider's transforms (Supabase Storage image transformations require a paid plan — check before relying on them), Cloudinary, etc. Pick what fits the stack and the budget answer from Step 2; **ask before adding a dependency or a paid service**.
- **Serve the size that is displayed:** thumbnails for lists/cards (~200–400px), larger only on detail pages. Rough targets: list thumbnail ≲ 50 KB, hero/LCP image ≲ 200 KB.
- Use the framework's image component when available (Next.js `next/image` with a correct `sizes` prop), otherwise `srcset` + `sizes`.
- Always set `width` and `height` (or aspect-ratio) so the layout doesn't jump.
- `loading="lazy"` for images below the fold. **Do not lazy-load the main above-the-fold image** (the LCP image) — mark it high priority instead (`priority` in Next.js / `fetchpriority="high"`).
- Validate uploads: allowed types (jpg/png/webp/…), max upload size (e.g. 10 MB).

**Don't:** generate five sizes for an app with three avatars (tier S with "barely any images"), or add an image CDN when the framework's built-in optimizer is enough.

**Verify:** Network tab → filter Img → check sizes and formats. Lighthouse → "Properly size images", "Serve images in modern formats", LCP.

### 4. Caching: don't ask the database the same question 1,000 times

**Why:** data that rarely changes (categories, settings, plans, public pages, counts) gets re-queried on every visit. Caching removes that load — but wrong caching shows stale or, worse, **another user's** data.

**First classify each piece of data:**

| Type | Examples | Strategy |
|---|---|---|
| Static / rarely changes | categories, plans, site settings, blog posts | Cache long (hours/days), revalidate on edit |
| Public, changes sometimes | product listings, public profiles, leaderboards | Cache short (seconds–minutes) or revalidate on write |
| Per-user | dashboard, cart, notifications | Client cache only (`staleTime`), never in a shared/CDN cache |
| Must be exact / real-time | balances, stock, payments, chat | **Do not cache** — use realtime subscriptions if needed |

**Do (in this order — cheapest first):**
1. **Client cache:** with TanStack Query/SWR set a sensible `staleTime` so navigating back doesn't refetch everything. Deduplicate identical requests.
2. **Framework / HTTP cache** for public data: the framework's data cache / ISR / `revalidate`, or `Cache-Control` headers (`public, s-maxage=…, stale-while-revalidate=…`). **Check the installed framework version's caching docs** — defaults differ between versions (e.g. Next.js changed fetch caching defaults between 14 and 15).
3. **Shared cache (Redis / KV)** only for tier L, or tier M with a measured hot spot — and only after asking the user (it's a new service).

**Every cache needs an invalidation plan:** when the data is edited, revalidate the tag/path or update the client cache. A cache without invalidation is a bug waiting to happen.

**Never:** put user-specific or auth-dependent responses in a public/CDN cache (use `Cache-Control: private` or no-store), or cache money/stock values.

**Verify:** load the page twice — the second load should not hit the database for static data (check logs/Network). Edit the data — the change should appear within the intended time.

### 5. Loading UX: never show a blank screen

**Why:** a white screen for 2 seconds feels broken — users think the app hung. A skeleton in the final layout feels fast even when the data takes the same time.

**Do:**
- Every async view has **three states**: loading (skeleton), empty ("No orders yet" + next action), error (friendly message + retry). Never leave a blank area.
- Skeletons **match the final layout** (same sizes and positions) so nothing jumps when data arrives. Use the project's existing UI kit skeleton component if it has one.
- Show the page shell immediately and load sections independently: Next.js `loading.tsx` / `<Suspense>` boundaries per section, or per-component loading states. Don't make the whole page wait for the slowest query.
- **Kill waterfalls:** independent requests run in parallel (`Promise.all`), not one after another. Start fetching as early as possible (on the server, or in the route loader), not in a chain of nested `useEffect`s.
- Buttons that trigger a request show a pending state and are disabled to prevent double submits. For common, safe actions (like, toggle, add to list) consider optimistic updates with rollback on error (tier M+).

**Don't:** use a full-screen spinner for the whole app, or add a skeleton to something that loads instantly from cache.

**Verify:** throttle the network (DevTools → Slow 4G) and reload: you should see the layout with skeletons immediately, then content, with no layout jump.

---

## Mode workflows

### Build mode
1. If the change creates a table, list, upload, or data-heavy page and there's no saved profile → Step 2 (quick).
2. Write the feature applying the rules of the current tier.
3. Include the migration for any new index in the same change.
4. Run the **self-check** below before saying you're done. In your summary, mention in one or two lines which speed rules you applied (e.g. "added index on `orders(user_id, created_at)`, list is paginated by 20, images converted to WebP").

### Audit mode (read-only)
1. Step 1 → Step 2 → Step 3.
2. Check all 5 areas against the tier. Read the actual code; cite `file:line` for every finding.
3. Report (in the user's language, technical terms in English):
   - **Project profile** (2–4 lines): stack, tier, and the user's answers.
   - **Results table:** `# | Area | Status (✅ Good / ⚠️ Needs improvement / ❌ Problem / ➖ N/A) | Impact (High / Medium / Low) | Evidence (file:line) | Fix (one line)`
   - **Top problems first**, each with: what's wrong, what users will feel, where it is, the smallest safe fix.
   - **Fix order** (short list). Impact = how much it hurts at the expected scale — a missing index on a table that will have 1M rows is High; on a 50-row table it's Low.
4. **Stop and ask which fix to start with.** Do not change code until the user confirms.
5. Fix **one item at a time**, verify it, then move on. Never rewrite everything at once.

### Fix-slow mode
1. Reproduce: which page/action, how slow, with how much data.
2. Find the bottleneck **with evidence** (Network tab payload/timings, server logs, `explain analyze`, counting queries) — don't guess.
3. Fix the biggest one, re-measure, report before → after (e.g. "45 queries → 2", "3.2 MB → 180 KB", "1.8 s → 0.3 s").
4. Then check the other 4 areas on that same page quickly.

---

## Guardrails

- **Don't change behavior** while optimizing: same data, same order, same permissions. Pagination and caching must not hide or leak rows.
- **Ask before:** adding a dependency, adding a paid/external service (Redis, image CDN), changing the database schema beyond adding indexes, or running anything against a production database.
- Never weaken security for speed (e.g. disabling RLS, using the service-role key in the browser, caching private data publicly).
- Prefer the project's existing tools and patterns over introducing new ones.
- Keep fixes small and reviewable. Explain each change in one line a non-expert understands.
- Talk to the user in their language. Keep code, file paths, and technical terms in English.

---

## Self-check before you say "done"

Run through this for the code you touched (Build) or the whole app (Audit):

- [ ] Every FK and every filtered/sorted/RLS column used by the new queries has an index (via a migration)
- [ ] No query runs inside a loop or per list row (no N+1, server or client)
- [ ] Queries select only needed columns
- [ ] Every list query has a server-enforced limit and a stable order; big/infinite lists use keyset pagination (tier M+)
- [ ] No whole-table downloads for client-side filtering/search
- [ ] Uploaded images are resized + compressed (WebP), displayed at the shown size, lazy-loaded below the fold, with width/height set
- [ ] Rarely-changing public data is cached with an invalidation path; private data is never in a shared cache; real-time/money data isn't cached
- [ ] Every async view has skeleton, empty and error states; no blank screen; independent requests run in parallel
- [ ] Nothing added is bigger than the tier needs (no Redis/CDN/queues for tier S)
- [ ] Behavior and permissions unchanged
