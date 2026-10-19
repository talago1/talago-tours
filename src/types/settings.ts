import { DEFAULT_SETTINGS } from '@/lib/systemSettings';

export interface SiteBanner {
  id: string;
  label: string;
  url: string;
  section: 'hero' | 'split' | 'general';
}

export interface SystemSettings {
  contact: {
    whatsappNumber: string;
    corporateEmail: string;
    phoneNumber?: string;
    socialLinks: {
      instagram: string;
      facebook: string;
      twitter: string;
    };
    showContactChannels?: boolean;
    showWhatsApp?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
  };
  financial: {
    baseCurrency: string;
    exchangeRates: Record<string, number>;
  };
  system: {
    maintenanceMode: boolean;
    paymentGateways: {
      paymob: boolean;
      fawry: boolean;
    };
  };
  paymentMethods: {
    allowPayOnArrival: boolean;
    allowFullOnline: boolean;
    allowDepositOnline: boolean;
    defaultDepositPercentage: number;
    allowPaymentLink: boolean;
  };
  banners: {
    heroBackground: string;
    heroBackgroundMobile?: string;
    heroOverlayOpacity?: number;
    showHero?: boolean;
    splitSectionLeft: string;
    splitSectionRight: string;
    toursCatalogBackground: string;
    destinationsBackground: string;
    bookingCheckoutBackground: string;
    conciergePickImage: string;
    conciergePickTitle: string;
    conciergePickDescription: string;
    conciergePickBadge?: string;
    conciergePickPrice?: string;
    conciergePickLink?: string;
    showConciergePick?: boolean;

    heroBadge?: string;
    heroTitle?: string;
    heroTagline?: string;
    heroDescription?: string;
    showHeroBadge?: boolean;
    showHeroTagline?: boolean;
    showHeroDescription?: boolean;

    heroPrimaryBtnText?: string;
    heroPrimaryBtnLink?: string;
    showPrimaryBtn?: boolean;
    heroSecondaryBtnText?: string;
    heroSecondaryBtnLink?: string;
    showSecondaryBtn?: boolean;

    /* ── /tours page hero ── */
    toursHeroBackground?: string;
    toursHeroBadge?: string;
    toursHeroTitle?: string;
    toursHeroDescription?: string;
    toursHeroBtnText?: string;
    toursHeroRatingValue?: string;
    toursHeroRatingLabel?: string;

    showHeroMetrics?: boolean;
    heroMetric1Value?: string;
    heroMetric1Label?: string;
    heroMetric2Value?: string;
    heroMetric2Label?: string;
    heroMetric3Value?: string;
    heroMetric3Label?: string;

    aboutPhilosophyImage: string;
    assets: SiteBanner[];
    heroTranslations?: Partial<Record<string, HeroLanguageTexts>>;
  };
  /**
   * Advanced marketplace modules — all default to `false`. Enabling these turns on
   * multi-operator features (partners, suppliers, affiliates, applications) and
   * expansion beyond the curated destinations.
   */
  modules: {
    partners: boolean;
    supplierPortal: boolean;
    affiliates: boolean;
    applications: boolean;
    additionalCountries: boolean;
  };
}

export interface HeroLanguageTexts {
  heroBadge?: string;
  heroTitle?: string;
  heroTagline?: string;
  heroDescription?: string;
  heroPrimaryBtnText?: string;
  heroSecondaryBtnText?: string;
  conciergePickBadge?: string;
  conciergePickTitle?: string;
  conciergePickDescription?: string;
  conciergePickPrice?: string;
}

// Single source of truth lives in `src/lib/systemSettings.ts` so the public
// read path, the admin defaults endpoint and this type module cannot drift.
export const DEFAULT_SYSTEM_SETTINGS = DEFAULT_SETTINGS as unknown as SystemSettings;
