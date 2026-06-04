export type LanguageCode = 'en' | 'de' | 'ru' | 'fr' | 'it' | 'tr';

export const LANGUAGE_CODES: LanguageCode[] = ['en', 'de', 'ru', 'fr', 'it', 'tr'];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'EN',
  de: 'DE',
  ru: 'RU',
  fr: 'FR',
  it: 'IT',
  tr: 'TR',
};

export interface TranslationEntry {
  title: string;
  description: string;
  cancellationPolicies: string[];
}

export type Translations = Record<LanguageCode, TranslationEntry>;

export function createEmptyTranslations(): Translations {
  return {
    en: { title: '', description: '', cancellationPolicies: [] },
    de: { title: '', description: '', cancellationPolicies: [] },
    ru: { title: '', description: '', cancellationPolicies: [] },
    fr: { title: '', description: '', cancellationPolicies: [] },
    it: { title: '', description: '', cancellationPolicies: [] },
    tr: { title: '', description: '', cancellationPolicies: [] },
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
  cancellationPolicy: string;
}

export function createDefaultLogisticsFields(): LogisticsFields {
  return {
    whatToBring: '',
    pickupDescription: '',
    hotelPickupIncluded: false,
    pickupTime: '',
    cancellationPolicy: '',
  };
}

export interface PricingFields {
  adultPrice: number;
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
  translations: Translations;
  activeLanguage: LanguageCode;
  activeStep: number;
  cardExcerpt: string;
  showExcerptOnCard: boolean;
  seededReviews: SeededReview[];
  isSubmitting: boolean;
  isDirty: boolean;
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
  cancellationPolicy?: string;
  adultPrice: number;
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
