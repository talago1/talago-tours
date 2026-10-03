export type LanguageCode = 'en' | 'de' | 'ru' | 'fr' | 'it' | 'pl' | 'es' | 'uk';

export const LANGUAGE_CODES: LanguageCode[] = ['en', 'de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'];

// Tour Add-on / Option that the admin can fully control
export interface TourAddon {
  id: string;
  price: number;
  priceType: 'per_person' | 'flat';
  enabled: boolean;
  labels: Record<LanguageCode, string>; // e.g. { en: 'Photo Pack', ru: 'Фото-пакет', ... }
  descriptions: Record<LanguageCode, string>;
}

export function createDefaultAddon(): TourAddon {
  const emptyLabels = { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '', uk: '' };
  return {
    id: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    price: 0,
    priceType: 'per_person',
    enabled: true,
    labels: { ...emptyLabels },
    descriptions: { ...emptyLabels },
  };
}

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'EN',
  de: 'DE',
  ru: 'RU',
  fr: 'FR',
  it: 'IT',
  pl: 'PL',
  es: 'ES',
  uk: 'UK',
};

export interface TranslationEntry {
  title: string;
  description: string;
  cardExcerpt?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  whatToBring?: string;
  pickupDescription?: string;
  cancellationPolicy?: string;
  cancellationPolicies?: string[];
}

export type Translations = Record<LanguageCode, TranslationEntry>;

export function createEmptyTranslationEntry(): TranslationEntry {
  return {
    title: '',
    description: '',
    cardExcerpt: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    whatToBring: '',
    pickupDescription: '',
    cancellationPolicy: '',
    cancellationPolicies: [],
  };
}

export function createEmptyTranslations(): Translations {
  return {
    en: createEmptyTranslationEntry(),
    de: createEmptyTranslationEntry(),
    ru: createEmptyTranslationEntry(),
    fr: createEmptyTranslationEntry(),
    it: createEmptyTranslationEntry(),
    pl: createEmptyTranslationEntry(),
    es: createEmptyTranslationEntry(),
    uk: createEmptyTranslationEntry(),
  };
}

export type TourType = 'SHARED' | 'PRIVATE';

export interface GlobalFields {
  slug: string;
  durationHours: number;
  maxCapacity: number;
  tourType: TourType;
  zoneId: string;
  basePriceUSD: number;
}

export function createDefaultGlobalFields(): GlobalFields {
  return {
    slug: '',
    durationHours: 0,
    maxCapacity: 0,
    tourType: 'SHARED',
    zoneId: '',
    basePriceUSD: 0,
  };
}

export interface MediaFields {
  coverImage: string;
  galleryImages: string[];
}

export function createDefaultMediaFields(): MediaFields {
  return { coverImage: '', galleryImages: [] };
}

export interface MarketingFields {
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
}

export function createDefaultMarketingFields(): MarketingFields {
  return { highlights: [], inclusions: [], exclusions: [] };
}

import type { ItineraryMilestone } from './itinerary';

export interface LogisticsFields {
  whatToBring: string;
  pickupDescription: string;
  hotelPickupIncluded: boolean;
  pickupTime: string;
  pickupTimes: string[];
  cancellationPolicy: string;
}

export function createDefaultLogisticsFields(): LogisticsFields {
  return {
    whatToBring: '',
    pickupDescription: '',
    hotelPickupIncluded: false,
    pickupTime: '',
    pickupTimes: [],
    cancellationPolicy: '',
  };
}

export interface PricingFields {
  adultPrice: number;
  originalPrice?: number;
  childEnabled: boolean;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantEnabled: boolean;
  infantPrice: number;
  infantMinAge: number;
  infantMaxAge: number;
  ageRestrictionsNotes: string;
}

export function createDefaultPricingFields(): PricingFields {
  return {
    adultPrice: 0,
    originalPrice: 0,
    childEnabled: false,
    childPrice: 0,
    childMinAge: 3,
    childMaxAge: 11,
    infantEnabled: false,
    infantPrice: 0,
    infantMinAge: 0,
    infantMaxAge: 2,
    ageRestrictionsNotes: '',
  };
}

export interface TourFormState {
  globalFields: GlobalFields;
  media: MediaFields;
  marketing: MarketingFields;
  itinerary: ItineraryMilestone[];
  logistics: LogisticsFields;
  pricing: PricingFields;
  addons: TourAddon[];
  translations: Translations;
  activeLanguage: LanguageCode;
  activeStep: number;
  cardExcerpt: string;
  showExcerptOnCard: boolean;
  seededReviews: SeededReview[];
  isSubmitting: boolean;
  isDirty: boolean;
  editingTourId?: string; // set when in edit mode
}

export interface SeededReview {
  customerName: string;
  rating: number;
  comment: string;
}

export function createInitialFormState(): TourFormState {
  return {
    globalFields: createDefaultGlobalFields(),
    media: createDefaultMediaFields(),
    marketing: createDefaultMarketingFields(),
    itinerary: [],
    logistics: createDefaultLogisticsFields(),
    pricing: createDefaultPricingFields(),
    addons: [],
    translations: createEmptyTranslations(),
    activeLanguage: 'en',
    activeStep: 0,
    cardExcerpt: '',
    showExcerptOnCard: true,
    seededReviews: [],
    isSubmitting: false,
    isDirty: false,
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface TourCreatePayload {
  slug: string;
  type: TourType;
  basePriceUSD: number;
  durationHours: number;
  maxCapacity: number;
  zoneId: string;
  translations: Translations;
  coverImage?: string;
  galleryImages?: string[];
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: ItineraryMilestone[];
  whatToBring?: string;
  pickupDescription?: string;
  hotelPickupIncluded?: boolean;
  pickupTime?: string;
  pickupTimes?: string[];
  cancellationPolicy?: string;
  adultPrice: number;
  originalPrice?: number;
  priceAdult?: number;
  childEnabled?: boolean;
  childPrice?: number;
  childMinAge?: number;
  childMaxAge?: number;
  infantEnabled?: boolean;
  infantPrice?: number;
  infantMinAge?: number;
  infantMaxAge?: number;
  ageRestrictionsNotes?: string;
  cardExcerpt?: string;
  showExcerptOnCard?: boolean;
  displayExcerpt?: boolean;
  reviews?: SeededReview[];
}

export interface TourCreateResponse {
  tour: {
    id: string;
    slug: string;
    type: string;
    basePriceUSD: number;
    durationHours: number;
    maxCapacity: number;
    zoneId: string;
    createdAt: string;
  };
  message: string;
}

export interface ApiError {
  error: string;
  field?: string;
}
