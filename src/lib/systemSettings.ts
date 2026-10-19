export const SETTINGS_KEYS = ['contact', 'financial', 'system', 'paymentMethods', 'banners', 'modules'] as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export function isSettingsKey(key: string): key is SettingsKey {
  return SETTINGS_KEYS.includes(key as SettingsKey);
}

export function parseSettingValue<T = unknown>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function serializeSettingValue(value: unknown): string {
  return JSON.stringify(value);
}

export const DEFAULT_SETTINGS = {
  contact: {
    whatsappNumber: '+2010222434602',
    corporateEmail: 'support@talago-tours.com',
    phoneNumber: '',
    socialLinks: { instagram: '', facebook: '', twitter: '' },
    showContactChannels: true,
    showWhatsApp: true,
    showEmail: true,
    showPhone: false,
  },
  financial: {
    baseCurrency: 'USD',
    exchangeRates: { USD: 1, EUR: 0.92, RUB: 92.5, GBP: 0.79, PLN: 4.05, EGP: 48.5 },
  },
  system: {
    maintenanceMode: false,
    paymentGateways: { paymob: true, fawry: false },
  },
  paymentMethods: {
    allowPayOnArrival: true,
    allowFullOnline: true,
    allowDepositOnline: true,
    defaultDepositPercentage: 20,
    allowPaymentLink: true,
  },
  banners: {
    heroBackground: '',
    heroBackgroundMobile: '',
    heroOverlayOpacity: 40,
    showHero: true,
    splitSectionLeft: '',
    splitSectionRight: '',
    toursCatalogBackground: '',
    destinationsBackground: '',
    bookingCheckoutBackground: '',
    conciergePickImage: '',
    conciergePickTitle: 'Private yacht sunrise to Giftun Island',
    conciergePickDescription: 'Champagne breakfast, reef snorkel guide, and flexible return timing.',
    conciergePickBadge: 'CONCIERGE PICK',
    conciergePickPrice: 'VIP All-Inclusive',
    conciergePickLink: '/tours',
    showConciergePick: true,

    heroBadge: '',
    heroTitle: '',
    heroTagline: '',
    heroDescription: '',
    showHeroBadge: true,
    showHeroTagline: true,
    showHeroDescription: true,

    heroPrimaryBtnText: '',
    heroPrimaryBtnLink: '/tours',
    showPrimaryBtn: true,
    heroSecondaryBtnText: '',
    heroSecondaryBtnLink: '/#verified-reviews',
    showSecondaryBtn: true,

    toursHeroBackground: '',
    toursHeroBadge: '',
    toursHeroTitle: '',
    toursHeroDescription: '',
    toursHeroBtnText: '',
    toursHeroRatingValue: '',
    toursHeroRatingLabel: '',

    showHeroMetrics: true,
    heroMetric1Value: '',
    heroMetric1Label: '',
    heroMetric2Value: '',
    heroMetric2Label: '',
    heroMetric3Value: '',
    heroMetric3Label: '',

    aboutPhilosophyImage: '',
    assets: [] as { id: string; label: string; url: string; section: string }[],
    heroTranslations: {} as Record<string, any>,
  },
  // Advanced marketplace modules are intentionally OFF by default. TALAGO ships as a
  // single-operator tours platform; these stay dormant until explicitly enabled.
  modules: {
    partners: false,
    supplierPortal: false,
    affiliates: false,
    applications: false,
    additionalCountries: false,
    wishlist: true,
    showWishlistInNav: true,
    stickyMobileBookingBar: true,
    activityAtAGlance: true,
  },
};

export type SystemSettingsPayload = typeof DEFAULT_SETTINGS;

export function mergeSystemSettings(settingsMap: Record<string, unknown>): SystemSettingsPayload {
  const merged = { ...DEFAULT_SETTINGS };
  for (const key of SETTINGS_KEYS) {
    const value = settingsMap[key];
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = deepMerge(
        (merged as Record<string, unknown>)[key],
        value,
      );
    }
  }
  return merged;
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source;
  }
  if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
    return source;
  }
  const result = { ...(target as Record<string, unknown>) };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const tv = (target as Record<string, unknown>)[key];
    const sv = (source as Record<string, unknown>)[key];
    if (typeof tv === 'object' && tv !== null && typeof sv === 'object' && sv !== null) {
      result[key] = deepMerge(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}
