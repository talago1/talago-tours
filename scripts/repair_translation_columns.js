/**
 * Repairs English copy clobbered by the localized-editors bug.
 *
 * UnifiedTourEditor used to write the active editor language into the flat
 * `highlights` / `inclusions` / `exclusions` / `whatToBring` / `requirements` /
 * `cancellationPolicy` columns. The public tour page renders those columns as
 * the English copy, so a tour last edited in German now shows German bullets to
 * English visitors while `translations.en` still holds the real text.
 *
 * This script copies `translations.en` back onto the flat columns, and only for
 * tours that actually look damaged, so it is safe to re-run.
 *
 *   node scripts/repair_translation_columns.js          # dry run
 *   node scripts/repair_translation_columns.js --apply  # write changes
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const LANGUAGES = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];
const FIELD_NAMES = new Set([
  'highlights',
  'inclusions',
  'exclusions',
  'whatToBring',
  'cancellationPolicy',
]);

const sameArray = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((v, i) => v === b[i]);

const scriptLooksNonLatin = (value) => {
  if (typeof value !== 'string') return false;
  // Latin-1 supplement / punctuation that shows up in translations but is not
  // enough on its own, so require a meaningful number of non-Latin characters.
  const nonLatin = value.match(/[^\u0000-\u024F\u1E00-\u1EFF]/g);
  return nonLatin ? nonLatin.length >= 3 : false;
};

async function main() {
  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      highlights: true,
      inclusions: true,
      exclusions: true,
      whatToBring: true,
      cancellationPolicy: true,
      translations: true,
    },
  });

  console.log(`Scanning ${tours.length} tours (${APPLY ? 'APPLY' : 'dry run'})\n`);

  let repaired = 0;
  let skipped = 0;

  for (const tour of tours) {
    const translations =
      tour.translations && typeof tour.translations === 'object' ? tour.translations : {};
    const en = translations.en;

    if (!en || typeof en !== 'object') {
      skipped++;
      continue;
    }

    const patch = {};

    // Array fields: the flat column should mirror translations.en exactly.
    for (const field of ['highlights', 'inclusions', 'exclusions']) {
      const flat = tour[field];
      const enValue = en[field];
      if (!Array.isArray(enValue) || enValue.length === 0) continue;
      if (sameArray(flat, enValue)) continue;

      // Only overwrite when the flat copy is genuinely foreign content, so we
      // never clobber a deliberate admin edit made directly on the column.
      const flatText = Array.isArray(flat) ? flat.join(' ') : '';
      const enText = enValue.join(' ');
      const looksForeign =
        scriptLooksNonLatin(flatText) && !scriptLooksNonLatin(enText);

      if (looksForeign) {
        patch[field] = enValue;
      } else if (!Array.isArray(flat) || flat.length === 0) {
        patch[field] = enValue;
      }
    }

    // Scalar fields.
    for (const field of ['whatToBring', 'cancellationPolicy']) {
      const flat = tour[field];
      const enValue = en[field];
      if (typeof enValue !== 'string' || enValue.length === 0) continue;
      if (flat === enValue) continue;
      if (scriptLooksNonLatin(flat) && !scriptLooksNonLatin(enValue)) {
        patch[field] = enValue;
      } else if (!flat) {
        patch[field] = enValue;
      }
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    const fields = Object.keys(patch).join(', ');
    console.log(`  ${tour.slug}`);
    console.log(`    fix: ${fields}`);
    for (const field of Object.keys(patch)) {
      const before = tour[field];
      const after = patch[field];
      const clip = (v) => {
        const s = Array.isArray(v) ? v.join(' | ') : String(v ?? '');
        return s.length > 70 ? `${s.slice(0, 70)}…` : s;
      };
      console.log(`      ${field}\n        - ${clip(before)}\n        + ${clip(after)}`);
    }

    if (APPLY) {
      await prisma.tour.update({ where: { id: tour.id }, data: patch });
    }
    repaired++;
  }

  console.log(
    `\n${APPLY ? 'Repaired' : 'Would repair'} ${repaired} tour(s); ${skipped} left untouched.`
  );
  if (!APPLY && repaired > 0) {
    console.log('Re-run with --apply to write these changes.');
  }

  // Report the shape of the localized data so the admin can eyeball coverage.
  console.log('\nTranslation coverage:');
  for (const tour of tours) {
    const translations = tour.translations || {};
    const filled = LANGUAGES.filter((l) => {
      const entry = translations[l];
      return entry && typeof entry === 'object' && (entry.title || '').trim();
    });
    if (filled.length < LANGUAGES.length) {
      console.log(
        `  ${tour.slug}: ${filled.length}/${LANGUAGES.length} (${filled.join(', ')})`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
