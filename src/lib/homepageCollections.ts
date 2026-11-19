import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import {
  HomepageCollectionConfig,
  DEFAULT_HOMEPAGE_COLLECTIONS,
  HomepageSectionConfig,
  DEFAULT_HOMEPAGE_SECTIONS,
} from '@/types/homepage';

const COLLECTIONS_KEY = 'homepage_collections';
const SECTIONS_KEY = 'homepage_sections';

export async function getHomepageCollections(): Promise<HomepageCollectionConfig[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: COLLECTIONS_KEY },
    });

    if (record) {
      const parsed = parseSettingValue<HomepageCollectionConfig[]>(record.value, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.warn('[homepageCollections] Could not load from DB, using defaults:', err);
  }

  return DEFAULT_HOMEPAGE_COLLECTIONS;
}

export async function saveHomepageCollections(collections: HomepageCollectionConfig[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: COLLECTIONS_KEY },
    create: {
      key: COLLECTIONS_KEY,
      value: serializeSettingValue(collections),
    },
    update: {
      value: serializeSettingValue(collections),
    },
  });
}

export async function getHomepageSections(): Promise<HomepageSectionConfig[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SECTIONS_KEY },
    });

    if (record) {
      const parsed = parseSettingValue<HomepageSectionConfig[]>(record.value, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults in case any new section was added
        const existingKeys = new Set(parsed.map((s) => s.key));
        const merged = [...parsed];
        for (const def of DEFAULT_HOMEPAGE_SECTIONS) {
          if (!existingKeys.has(def.key)) {
            merged.push({ ...def, order: merged.length });
          }
        }
        return merged.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.warn('[homepageSections] Could not load from DB, using defaults:', err);
  }

  return DEFAULT_HOMEPAGE_SECTIONS;
}

export async function saveHomepageSections(sections: HomepageSectionConfig[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SECTIONS_KEY },
    create: {
      key: SECTIONS_KEY,
      value: serializeSettingValue(sections),
    },
    update: {
      value: serializeSettingValue(sections),
    },
  });
}
