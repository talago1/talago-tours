import type { LanguageCode, ItineraryMilestone } from './itinerary';
import type { TourAddon, SeededReview } from './tourBuilder';

export type { LanguageCode, ItineraryMilestone, TourAddon, SeededReview };

export const ALL_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export interface LocalizedTourContent {
  title: string;
  shortTitle?: string;
  description: string;
  cardExcerpt?: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  whatToBring?: string;
  importantInfo?: string;
  pickupDescription?: string;
  cancellationPolicy?: string;
  cancellationPolicies?: string[];
  meetingPointInstructions?: string;
  meetingPointLandmark?: string;
  safetyGuidelines?: string[];
  seoTitle?: string;
  seoDescription?: string;
  requirements?: string;
  accessibilityNotes?: string;
  mobilityNotes?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  internalNotes?: string;
}

export interface TourVariant {
  id: string;
  name: string;
  description?: string;
  priceAdult?: number;
  priceChild?: number;
  durationHours?: number;
  capacity?: number;
  inclusions?: string[];
  isDefault?: boolean;
}

export type TourEditorTranslations = Record<LanguageCode, LocalizedTourContent>;

export function createDefaultLocalizedContent(): LocalizedTourContent {
  return {
    title: '',
    shortTitle: '',
    description: '',
    cardExcerpt: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    whatToBring: '',
    importantInfo: '',
    pickupDescription: '',
    cancellationPolicy: '',
    cancellationPolicies: [],
    meetingPointInstructions: '',
    meetingPointLandmark: '',
    safetyGuidelines: [],
    seoTitle: '',
    seoDescription: '',
    requirements: '',
    accessibilityNotes: '',
    mobilityNotes: '',
    faqItems: [],
    internalNotes: '',
  };
}

export function createDefaultTranslations(): TourEditorTranslations {
  return {
    en: createDefaultLocalizedContent(),
    de: createDefaultLocalizedContent(),
    ru: createDefaultLocalizedContent(),
    fr: createDefaultLocalizedContent(),
    it: createDefaultLocalizedContent(),
    pl: createDefaultLocalizedContent(),
    es: createDefaultLocalizedContent(),
  };
}

export interface RoutePoint {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  durationMinutes?: number;
  order: number;
}

export type BookingQuestionType = 'text' | 'number' | 'phone' | 'select' | 'radio' | 'checkbox' | 'date';

export interface BookingQuestion {
  id: string;
  question: string;
  type: BookingQuestionType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export type TourEditorSectionId =
  | 'basic-info'
  | 'destination-location'
  | 'media'
  | 'pricing'
  | 'guest-types'
  | 'availability'
  | 'schedule'
  | 'pickup'
  | 'meeting-point'
  | 'route'
  | 'itinerary'
  | 'activities'
  | 'transportation'
  | 'inclusions'
  | 'exclusions'
  | 'requirements'
  | 'accessibility'
  | 'what-to-bring'
  | 'important-info'
  | 'faqs'
  | 'safety'
  | 'addons'
  | 'booking-questions'
  | 'cancellation'
  | 'seo'
  | 'publishing'
  | 'advanced'
  | 'operator'
  | 'completeness';

export interface SectionMeta {
  id: TourEditorSectionId;
  title: string;
  shortLabel: string;
  description: string;
  group: 'core' | 'pricing' | 'logistics' | 'content' | 'rules' | 'publishing';
  isEssential: boolean;
}

export const TOUR_EDITOR_SECTIONS: SectionMeta[] = [
  // Group 1: Core & Identity
  { id: 'basic-info', title: '1. Basic Information', shortLabel: 'Basic Info', description: 'Title, slug, category, badges and overview', group: 'core', isEssential: true },
  { id: 'destination-location', title: '2. Destination & Location', shortLabel: 'Destination', description: 'Country, city, destination and pickup zone assignment', group: 'core', isEssential: true },
  { id: 'media', title: '3. Images & Media', shortLabel: 'Media', description: 'Cover hero, gallery images and video links', group: 'core', isEssential: true },
  { id: 'operator', title: '4. Operator & Operations', shortLabel: 'Operator', description: 'Local operator identity, contact and dispatch notes', group: 'core', isEssential: false },

  // Group 2: Pricing & Guests
  { id: 'pricing', title: '5. Pricing Engine', shortLabel: 'Pricing', description: 'Adult price, deposit rules and payment methods', group: 'pricing', isEssential: true },
  { id: 'guest-types', title: '6. Guest Types & Age Rules', shortLabel: 'Guests', description: 'Child & infant tiers, age bounds and participant limits', group: 'pricing', isEssential: false },
  { id: 'addons', title: '7. Add-ons & Upgrades', shortLabel: 'Add-ons', description: 'Optional upgrades, photo packages and equipment rentals', group: 'pricing', isEssential: false },

  // Group 3: Schedule & Logistics
  { id: 'availability', title: '8. Availability & Capacity', shortLabel: 'Capacity', description: 'Max participants per slot and cut-off window', group: 'logistics', isEssential: true },
  { id: 'schedule', title: '9. Schedule & Pickup Times', shortLabel: 'Schedule', description: 'Tour duration and scheduled departure times', group: 'logistics', isEssential: false },
  { id: 'pickup', title: '10. Hotel Pickup & Transfers', shortLabel: 'Pickup', description: 'Pickup inclusion, coverage description and instructions', group: 'logistics', isEssential: false },
  { id: 'meeting-point', title: '11. Meeting Point', shortLabel: 'Meeting Point', description: 'Direct arrival location, GPS coordinates and directions', group: 'logistics', isEssential: false },
  { id: 'transportation', title: '12. Transportation Details', shortLabel: 'Transport', description: 'Vehicles, boats, air conditioning and fleet specifications', group: 'logistics', isEssential: false },

  // Group 4: Program & Content
  { id: 'route', title: '13. Route & Waypoints', shortLabel: 'Route', description: 'Geographical route stops and map landmarks', group: 'content', isEssential: false },
  { id: 'itinerary', title: '14. Itinerary Timeline', shortLabel: 'Itinerary', description: 'Step-by-step milestones with icons and localized descriptions', group: 'content', isEssential: false },
  { id: 'activities', title: '15. Activities & Highlights', shortLabel: 'Activities', description: 'Activity tags and marketing key selling points', group: 'content', isEssential: false },
  { id: 'inclusions', title: '16. Included Features', shortLabel: 'Included', description: 'Everything included in the ticket price', group: 'content', isEssential: false },
  { id: 'exclusions', title: '17. Excluded Items', shortLabel: 'Excluded', description: 'What is not included / extra costs to expect', group: 'content', isEssential: false },
  { id: 'what-to-bring', title: '18. What to Bring', shortLabel: 'What to Bring', description: 'Recommended clothing, gear, sunscreen, passport', group: 'content', isEssential: false },
  { id: 'important-info', title: '18a. Important Information', shortLabel: 'Important Info', description: 'Need-to-know notes, restrictions and good-to-know details', group: 'content', isEssential: false },
  { id: 'faqs', title: '18b. FAQs', shortLabel: 'FAQs', description: 'Frequently asked questions with localized answers', group: 'content', isEssential: false },

  // Group 5: Rules & Safety
  { id: 'requirements', title: '19. Requirements & Fitness', shortLabel: 'Requirements', description: 'Fitness level, swimming ability and minimum requirements', group: 'rules', isEssential: false },
  { id: 'accessibility', title: '20. Accessibility & Special Needs', shortLabel: 'Accessibility', description: 'Wheelchair, stroller and mobility accommodation info', group: 'rules', isEssential: false },
  { id: 'safety', title: '21. Safety & Guidelines', shortLabel: 'Safety', description: 'Safety equipment, insurance status and emergency protocols', group: 'rules', isEssential: false },
  { id: 'cancellation', title: '22. Cancellation Policy', shortLabel: 'Cancellation', description: 'Refund policy, cancellation windows and penalty terms', group: 'rules', isEssential: false },
  { id: 'booking-questions', title: '23. Custom Booking Questions', shortLabel: 'Questions', description: 'Questions asked during customer checkout (e.g. hotel, room)', group: 'rules', isEssential: false },

  // Group 6: SEO & Publishing
  { id: 'seo', title: '24. SEO & Metadata', shortLabel: 'SEO', description: 'Custom page title, meta description and search indexing', group: 'publishing', isEssential: false },
  { id: 'publishing', title: '25. Publishing & Visibility', shortLabel: 'Publishing', description: 'Catalog status (Draft, Active, Hidden) and promotional badges', group: 'publishing', isEssential: true },
  { id: 'advanced', title: '26. Advanced & Operations', shortLabel: 'Advanced', description: 'Internal admin notes and operational configurations', group: 'publishing', isEssential: false },
  { id: 'completeness', title: '27. Completeness & Review', shortLabel: 'Review', description: 'Health check, missing fields audit and final launch action', group: 'publishing', isEssential: true },
];

export interface TourEditorData {
  // Identity
  id?: string;
  slug: string;
  type: 'SHARED' | 'PRIVATE';
  status: 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'ARCHIVED' | 'COMING_SOON';
  category: string;
  secondaryCategories: string[];
  tags: string[];

  // Badges
  isFeatured: boolean;
  isBestSeller: boolean;
  isRecommended: boolean;
  isVip: boolean;
  isFamilyFriendly: boolean;
  isNew: boolean;
  customBadge?: string;

  // Location
  destinationId: string;
  zoneId: string;
  countryCode?: string;
  region?: string;
  city?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;

  // Media
  coverImage: string;
  galleryImages: string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  imageAlt?: string;

  // Pricing
  adultPrice: number;
  originalPrice?: number;
  privatePrice?: number;
  basePriceUSD: number;
  costPerPerson?: number;
  allowDeposit: boolean;
  depositType: 'PERCENTAGE' | 'FIXED';
  depositPercentage: number;
  depositAmount?: number;
  allowPayAtLocation: boolean;

  // Guest Tiers
  childEnabled: boolean;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantEnabled: boolean;
  infantPrice: number;
  infantMinAge: number;
  infantMaxAge: number;
  ageRestrictionsNotes?: string;

  // Availability & Scheduling
  maxCapacity: number;
  durationHours: number;
  durationDisplay?: string;
  pickupTimes: string[];
  instantConfirmation: boolean;
  cutoffHours: number;

  // Logistics
  hotelPickupIncluded: boolean;
  pickupDescription?: string;
  pickupType: 'hotel' | 'meeting_point' | 'airport' | 'port' | 'station' | 'private_address' | 'both' | 'none';
  meetingPointName?: string;
  meetingPointAddress?: string;
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointLandmark?: string;
  meetingPointInstructions?: string;
  meetingPointMapUrl?: string;
  meetingPointImageUrl?: string;

  // Transport
  vehicleType?: string;
  airConditioned?: boolean;
  boatType?: string;
  transferNotes?: string;

  // Program & Content
  routeStops: RoutePoint[];
  itinerary: ItineraryMilestone[];
  activityTypes: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  whatToBring?: string;
  requirements?: string;
  faqItems?: { question: string; answer: string }[];

  // Rules & Safety
  fitnessLevel?: string;
  wheelchairAccessible: boolean;
  strollerAccessible: boolean;
  mobilityNotes?: string;
  accessibilityNotes?: string;
  safetyGuidelines: string[];
  insuranceIncluded: boolean;
  emergencyContact?: string;
  cancellationPolicy?: string;
  freeCancellationHours: number;

  // Booking & Addons
  addons: TourAddon[];
  bookingQuestions: BookingQuestion[];

  // SEO & Catalog
  cardExcerpt?: string;
  showExcerptOnCard: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords: string[];

  // Operations & Operator
  operatorName?: string;
  operatorPhone?: string;
  operatorEmail?: string;
  internalNotes?: string;

  // Variants
  variants?: TourVariant[];

  // Reviews
  reviews: SeededReview[];

  // Multilingual
  translations: TourEditorTranslations;
  activeLanguage: LanguageCode;
}

export function createDefaultTourEditorData(): TourEditorData {
  return {
    slug: '',
    type: 'SHARED',
    status: 'DRAFT',
    category: 'sea',
    secondaryCategories: [],
    tags: [],
    isFeatured: false,
    isBestSeller: false,
    isRecommended: false,
    isVip: false,
    isFamilyFriendly: true,
    isNew: false,
    destinationId: '',
    zoneId: '',
    countryCode: 'EG',
    city: 'Hurghada',
    coverImage: '',
    galleryImages: [],
    adultPrice: 0,
    basePriceUSD: 0,
    allowDeposit: false,
    depositType: 'PERCENTAGE',
    depositPercentage: 100,
    depositAmount: undefined,
    allowPayAtLocation: true,
    childEnabled: false,
    childPrice: 0,
    childMinAge: 3,
    childMaxAge: 11,
    infantEnabled: false,
    infantPrice: 0,
    infantMinAge: 0,
    infantMaxAge: 2,
    maxCapacity: 20,
    durationHours: 4,
    pickupTimes: [],
    instantConfirmation: true,
    cutoffHours: 12,
    hotelPickupIncluded: true,
    pickupType: 'hotel',
    wheelchairAccessible: false,
    strollerAccessible: false,
    safetyGuidelines: [],
    insuranceIncluded: true,
    freeCancellationHours: 24,
    routeStops: [],
    itinerary: [],
    activityTypes: [],
    highlights: [],
    inclusions: [],
    exclusions: [],
    addons: [],
    bookingQuestions: [],
    variants: [],
    showExcerptOnCard: true,
    keywords: [],
    reviews: [],
    translations: createDefaultTranslations(),
    activeLanguage: 'en',
  };
}

export function calculateTourCompleteness(data: TourEditorData): {
  score: number;
  checks: { name: string; complete: boolean; weight: number; message: string; critical: boolean }[];
} {
  const en = data.translations.en || createDefaultLocalizedContent();
  const checks = [
    {
      name: 'Title & Slug',
      complete: Boolean(data.slug.trim() && (en.title || '').trim()),
      weight: 15,
      message: 'Provide an English title and unique URL slug',
      critical: true,
    },
    {
      name: 'Destination & Zone',
      complete: Boolean(data.zoneId || data.destinationId),
      weight: 10,
      message: 'Select a destination and pickup zone',
      critical: true,
    },
    {
      name: 'Cover Image',
      complete: Boolean(data.coverImage.trim()),
      weight: 15,
      message: 'Upload or select a primary cover image',
      critical: true,
    },
    {
      name: 'Gallery (2+ Photos)',
      complete: data.galleryImages.filter(Boolean).length >= 2,
      weight: 5,
      message: 'Add at least 2 gallery images for the photo slider',
      critical: false,
    },
    {
      name: 'Pricing & Capacity',
      complete: Boolean(data.adultPrice > 0 && data.durationHours > 0 && data.maxCapacity > 0),
      weight: 15,
      message: 'Set an adult price, tour duration, and maximum guest capacity',
      critical: true,
    },
    {
      name: 'Full Description',
      complete: Boolean((en.description || '').trim().length > 30),
      weight: 10,
      message: 'Provide a thorough tour description in English (min 30 characters)',
      critical: true,
    },
    {
      name: 'Highlights & Inclusions',
      complete: Boolean(
        (data.highlights.length > 0 || en.highlights.length > 0) &&
        (data.inclusions.length > 0 || en.inclusions.length > 0)
      ),
      weight: 10,
      message: 'Add at least one highlight and one inclusion',
      critical: false,
    },
    {
      name: 'Itinerary / Timeline',
      complete: Boolean(data.itinerary.length > 0),
      weight: 8,
      message: 'Add at least one milestone to the itinerary timeline',
      critical: false,
    },
    {
      name: 'Pickup & Logistics',
      complete: Boolean(data.pickupDescription || en.pickupDescription || data.pickupTimes.length > 0 || data.meetingPointName),
      weight: 7,
      message: 'Configure pickup instructions, pickup times, or a meeting point',
      critical: false,
    },
    {
      name: 'Cancellation Policy',
      complete: Boolean((data.cancellationPolicy || '').trim() || (en.cancellationPolicy || '').trim()),
      weight: 5,
      message: 'Describe the cancellation and refund policy',
      critical: false,
    },
    {
      name: 'SEO Metadata',
      complete: Boolean((en.seoTitle || '').trim() || (en.seoDescription || '').trim()),
      weight: 5,
      message: 'Add a custom SEO title and meta description for search visibility',
      critical: false,
    },
    {
      name: 'Safety Guidelines',
      complete: data.safetyGuidelines.length > 0 || Boolean((en.safetyGuidelines || []).length > 0),
      weight: 5,
      message: 'Add at least one safety guideline or requirement for participants',
      critical: false,
    },
  ];

  const totalPossible = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.complete ? c.weight : 0), 0);
  const score = Math.round((earned / totalPossible) * 100);

  return { score, checks };
}
