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
    socialLinks: {
      instagram: string;
      facebook: string;
      twitter: string;
    };
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
  banners: {
    heroBackground: string;
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

    showHeroMetrics?: boolean;
    heroMetric1Value?: string;
    heroMetric1Label?: string;
    heroMetric2Value?: string;
    heroMetric2Label?: string;
    heroMetric3Value?: string;
    heroMetric3Label?: string;

    aboutPhilosophyImage: string;
    assets: SiteBanner[];
  };
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  contact: {
    whatsappNumber: '+2010222434602',
    corporateEmail: 'tala.tour@outlook.com',
    socialLinks: {
      instagram: 'https://instagram.com/talago',
      facebook: 'https://facebook.com/talago',
      twitter: 'https://twitter.com/talago',
    },
  },
  financial: {
    baseCurrency: 'USD',
    exchangeRates: {
      USD: 1,
      EUR: 0.92,
      RUB: 92.5,
      GBP: 0.79,
      PLN: 4.05,
      EGP: 48.5,
    },
  },
  system: {
    maintenanceMode: false,
    paymentGateways: {
      paymob: true,
      fawry: false,
    },
  },
  banners: {
    heroBackground: '',
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

    showHeroMetrics: true,
    heroMetric1Value: '',
    heroMetric1Label: '',
    heroMetric2Value: '',
    heroMetric2Label: '',
    heroMetric3Value: '',
    heroMetric3Label: '',

    aboutPhilosophyImage: '',
    assets: [],
  },
};
