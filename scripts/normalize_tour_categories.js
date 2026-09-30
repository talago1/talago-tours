/**
 * Normalizes `Tour.category` casing and whitespace.
 *
 * The column is a free-form string that was never validated, so the database
 * holds drifted spellings such as "Cultural " with a trailing space. The public
 * catalog filter resolves groups with a case-insensitive `in`, which absorbs
 * casing differences but *not* stray whitespace — a tour stored as "Cultural "
 * matches no filter value and silently disappears from the catalog.
 *
 * This script rewrites only the spellings that already differ from a known
 * canonical label by case and/or surrounding whitespace. It never merges
 * distinct labels such as "Sea" and "Sea Excursions"; those are resolved by the
 * filter map in `src/utils/tourCategory.ts` instead.
 *
 * Pass --apply to write. The default is a dry run.
 *
 *   node scripts/normalize_tour_categories.js
 *   node scripts/normalize_tour_categories.js --apply
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

/**
 * The spellings the public catalog already understands. A tour whose category
 * matches one of these modulo case and surrounding whitespace is rewritten to
 * the exact spelling below.
 *
 * Deliberately *not* a synonym table: `Sea`/`Sea Excursions` and
 * `Safari`/`Desert Safari` are distinct labels that the catalog filter already
 * resolves to the same group, so rewriting one to the other would destroy
 * information the admin picks from. Only whitespace and casing drift is fixed.
 */
const CANONICAL_SPELLINGS = [
  'Sea',
  'Sea Excursions',
  'Safari',
  'Desert Safari',
  'Cultural',
  'Historical',
  'Spa & Wellness',
  'Entertainment',
];

function canonicalFor(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  const hit = CANONICAL_SPELLINGS.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  return hit || null;
}

async function main() {
  const tours = await prisma.tour.findMany({
    select: { id: true, slug: true, category: true, status: true },
  });

  console.log(`Scanning ${tours.length} tours (${APPLY ? 'APPLY' : 'dry run'})\n`);

  const changes = new Map();
  for (const tour of tours) {
    const current = tour.category ?? '';
    const target = canonicalFor(current);
    if (target === null) {
      if (current.trim()) {
        console.log(`  ?? ${tour.slug}: unrecognized category ${JSON.stringify(current)} — left as-is`);
      } else {
        console.log(`  ?? ${tour.slug}: empty category — left as-is`);
      }
      continue;
    }
    if (current === target) continue;
    changes.set(tour.id, { slug: tour.slug, from: current, to: target });
  }

  if (changes.size === 0) {
    console.log('All categories already canonical. Nothing to do.');
    return;
  }

  for (const c of changes.values()) {
    console.log(`  ${c.slug}\n    ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);
  }

  if (!APPLY) {
    console.log(`\n${changes.size} tour(s) would be normalized. Re-run with --apply.`);
    return;
  }

  for (const [id, c] of changes) {
    await prisma.tour.update({ where: { id }, data: { category: c.to } });
  }
  console.log(`\nNormalized ${changes.size} tour(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
