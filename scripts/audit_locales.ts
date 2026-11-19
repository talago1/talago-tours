import { en } from '../src/locales/en';
import { de } from '../src/locales/de';
import { fr } from '../src/locales/fr';
import { es } from '../src/locales/es';
import { it } from '../src/locales/it';
import { pl } from '../src/locales/pl';
import { ru } from '../src/locales/ru';
import { uk } from '../src/locales/uk';

const locales: Record<string, Record<string, any>> = {
  de,
  fr,
  es,
  it,
  pl,
  ru,
  uk,
};

function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getValue(obj: any, path: string): any {
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return curr;
}

const enKeys = getKeys(en);
console.log(`[Locale Audit] Canonical 'en' has ${enKeys.length} keys.`);

let totalErrors = 0;

for (const [lang, dict] of Object.entries(locales)) {
  const missing: string[] = [];
  const empty: string[] = [];
  const typeMismatch: string[] = [];

  for (const key of enKeys) {
    const enVal = getValue(en, key);
    const targetVal = getValue(dict, key);

    if (targetVal === undefined) {
      missing.push(key);
    } else if (typeof targetVal !== typeof enVal) {
      typeMismatch.push(`${key} (expected ${typeof enVal}, got ${typeof targetVal})`);
    } else if (typeof targetVal === 'string' && targetVal.trim() === '') {
      empty.push(key);
    }
  }

  // Also check for extraneous keys not in en
  const targetKeys = getKeys(dict);
  const extra = targetKeys.filter((k) => getValue(en, k) === undefined);

  console.log(`\n--- Locale [${lang.toUpperCase()}] ---`);
  console.log(`Total Keys: ${targetKeys.length}/${enKeys.length}`);
  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} keys:`);
    missing.forEach((k) => console.error(`   - ${k}`));
    totalErrors += missing.length;
  }
  if (typeMismatch.length > 0) {
    console.error(`❌ Type mismatch in ${typeMismatch.length} keys:`);
    typeMismatch.forEach((k) => console.error(`   - ${k}`));
    totalErrors += typeMismatch.length;
  }
  if (empty.length > 0) {
    console.warn(`⚠️ Empty values in ${empty.length} keys:`);
    empty.forEach((k) => console.warn(`   - ${k}`));
  }
  if (extra.length > 0) {
    console.warn(`ℹ️ ${extra.length} extra keys not present in en:`);
    extra.forEach((k) => console.warn(`   + ${k}`));
  }

  if (missing.length === 0 && typeMismatch.length === 0) {
    console.log(`✅ [${lang.toUpperCase()}] is 100% synchronized with en.`);
  }
}

if (totalErrors > 0) {
  console.error(`\n❌ Audit failed with ${totalErrors} total error(s).`);
  process.exit(1);
} else {
  console.log(`\n🎉 All 8 locales passed 100% key parity audit!`);
  process.exit(0);
}
