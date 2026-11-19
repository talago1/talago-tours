import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { HomepageCollectionConfig, DEFAULT_HOMEPAGE_COLLECTIONS } from '@/types/homepage';

const SETTINGS_KEY = 'homepage_collections';

export async function getHomepageCollections(): Promise<HomepageCollectionConfig[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
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
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: serializeSettingValue(collections),
    },
    update: {
      value: serializeSettingValue(collections),
    },
  });
}
