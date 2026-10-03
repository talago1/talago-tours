import type { LucideIcon } from 'lucide-react';
import { Ship, Compass, Waves, Utensils, Building, MapPin } from 'lucide-react';

export type LanguageCode = 'en' | 'de' | 'ru' | 'fr' | 'it' | 'pl' | 'es' | 'uk';

export type IconToken = 'boat' | 'safari' | 'swim' | 'food' | 'hotel' | 'generic';

// v2 — Route point type enum (additive, optional on existing milestones)
export type ItineraryPointType =
  | 'DEPARTURE'
  | 'STOP'
  | 'ACTIVITY'
  | 'MEAL'
  | 'ARRIVAL'
  | 'TRANSFER';

export interface LocalizedMilestoneTitle {
  en: string;
  de: string;
  ru: string;
  fr: string;
  it: string;
  pl: string;
  es: string;
  uk: string;
}

// v2 milestone — all new fields are optional to preserve backward compatibility
export interface ItineraryMilestone {
  // --- v1 fields (preserved) ---
  id: string;
  timeTag: string;
  iconToken: IconToken;
  title: LocalizedMilestoneTitle;

  // --- v2 additions ---
  /** Localized descriptions (one per language, optional per milestone) */
  description?: Partial<LocalizedMilestoneTitle>;
  /** Duration of this stop/activity in minutes */
  durationMinutes?: number;
  /** Human-readable location name (e.g. "Giftun Island") */
  location?: string;
  /** GPS coordinates for map rendering */
  latitude?: number;
  longitude?: number;
  /** Semantic role of this milestone in the route */
  pointType?: ItineraryPointType;
  /** Unstructured free time at this stop, in minutes */
  freeTimeMinutes?: number;
  /** Entrance / admission fee note (e.g. "€5 per person, paid on site") */
  entranceFee?: string;
  /** Local guide accompanying this stop */
  guideIncluded?: boolean;
  /** Whether this stop is covered by the tour price (defaults to true) */
  included?: boolean;
  /** Transport mode used to reach this stop (e.g. "Air-conditioned van") */
  transport?: string;
  /** Meal provided at this stop (e.g. "Lunch included") */
  meal?: string;
  /** Optional add-on activity available at this stop */
  optionalActivity?: string;
  /** Free-form notes / instructions for this stop */
  notes?: string;
  /** Schema version marker — set to 2 on new milestones */
  _v?: number;
}

export const ICON_MAP: Record<IconToken, LucideIcon> = {
  boat: Ship,
  safari: Compass,
  swim: Waves,
  food: Utensils,
  hotel: Building,
  generic: MapPin,
};

export const ICON_TOKENS: IconToken[] = ['boat', 'safari', 'swim', 'food', 'hotel', 'generic'];

export const ICON_LABELS: Record<IconToken, string> = {
  boat: 'Boat',
  safari: 'Safari',
  swim: 'Swim',
  food: 'Food',
  hotel: 'Hotel',
  generic: 'General',
};

export const POINT_TYPES: ItineraryPointType[] = [
  'DEPARTURE',
  'STOP',
  'ACTIVITY',
  'MEAL',
  'ARRIVAL',
  'TRANSFER',
];

export const POINT_TYPE_LABELS: Record<ItineraryPointType, string> = {
  DEPARTURE: 'Departure',
  STOP: 'Stop / Visit',
  ACTIVITY: 'Activity',
  MEAL: 'Meal',
  ARRIVAL: 'Arrival',
  TRANSFER: 'Transfer',
};

export const POINT_TYPE_ICONS: Record<ItineraryPointType, string> = {
  DEPARTURE: '🚀',
  STOP: '📍',
  ACTIVITY: '🎯',
  MEAL: '🍽️',
  ARRIVAL: '🏁',
  TRANSFER: '🚐',
};

export function createEmptyMilestone(): ItineraryMilestone {
  return {
    id: crypto.randomUUID(),
    timeTag: '',
    iconToken: 'generic',
    pointType: 'STOP',
    title: { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '', uk: '' },
    description: { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '', uk: '' },
    durationMinutes: undefined,
    location: '',
    _v: 2,
  };
}

export function createLocalizedMilestoneTitle(): LocalizedMilestoneTitle {
  return { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '', uk: '' };
}
