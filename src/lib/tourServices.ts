import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { TourServiceItem, DEFAULT_TOUR_SERVICES } from '@/types/services';

const SETTINGS_KEY = 'tour_services_catalog';

/**
 * Loads tour services catalog from DB, falling back to defaults.
 */
export async function getTourServicesCatalog(): Promise<TourServiceItem[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (record) {
      const parsed = parseSettingValue<TourServiceItem[]>(record.value, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.warn('[tourServices] Unable to load services from DB, using defaults:', err);
  }

  return DEFAULT_TOUR_SERVICES;
}

/**
 * Saves tour services catalog to DB.
 */
export async function saveTourServicesCatalog(services: TourServiceItem[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: serializeSettingValue(services),
    },
    update: {
      value: serializeSettingValue(services),
    },
  });
}
