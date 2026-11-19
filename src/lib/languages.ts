import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { ManagedLanguage, DEFAULT_MANAGED_LANGUAGES } from '@/types/languages';

const SETTINGS_KEY = 'managed_languages';

/**
 * Loads managed languages from database, falling back to defaults.
 */
export async function getManagedLanguages(): Promise<ManagedLanguage[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (record) {
      const parsed = parseSettingValue<ManagedLanguage[]>(record.value, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.warn('[languages] Unable to load languages from DB, using defaults:', err);
  }

  return DEFAULT_MANAGED_LANGUAGES;
}

/**
 * Saves managed languages back to the database.
 */
export async function saveManagedLanguages(languages: ManagedLanguage[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: serializeSettingValue(languages),
    },
    update: {
      value: serializeSettingValue(languages),
    },
  });
}

/**
 * Get active translation languages (not source, translation enabled, active).
 */
export async function getActiveTranslationLanguages(): Promise<ManagedLanguage[]> {
  const all = await getManagedLanguages();
  return all.filter((l) => !l.isSource && l.includeInTranslations && l.isActive);
}

/**
 * Inspect whether a language has stored content across tours or destinations.
 */
export async function inspectLanguageUsage(code: string): Promise<{
  tourCount: number;
  destinationCount: number;
  canSafelyDelete: boolean;
}> {
  let tourCount = 0;
  let destinationCount = 0;

  try {
    const tours = await prisma.tour.findMany({
      select: { id: true, translations: true },
    });

    for (const t of tours) {
      if (t.translations && typeof t.translations === 'object') {
        const transObj = t.translations as Record<string, unknown>;
        if (transObj[code]) {
          tourCount++;
        }
      }
    }
  } catch (e) {
    console.error('[inspectLanguageUsage] Error querying tours:', e);
  }

  try {
    const destinations = await prisma.destination.findMany({
      select: { id: true, translations: true },
    });

    for (const d of destinations) {
      if (d.translations && typeof d.translations === 'object') {
        const transObj = d.translations as Record<string, unknown>;
        if (transObj[code]) {
          destinationCount++;
        }
      }
    }
  } catch (e) {
    console.error('[inspectLanguageUsage] Error querying destinations:', e);
  }

  return {
    tourCount,
    destinationCount,
    canSafelyDelete: tourCount === 0 && destinationCount === 0,
  };
}
