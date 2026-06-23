import type { LucideIcon } from 'lucide-react';
import { Ship, Compass, Waves, Utensils, Building, MapPin } from 'lucide-react';

export type LanguageCode = 'en' | 'de' | 'ru' | 'fr' | 'it' | 'pl' | 'es';

export type IconToken = 'boat' | 'safari' | 'swim' | 'food' | 'hotel' | 'generic';

export interface LocalizedMilestoneTitle {
  en: string;
  de: string;
  ru: string;
  fr: string;
  it: string;
  pl: string;
  es: string;
}

export interface ItineraryMilestone {
  id: string;
  timeTag: string;
  iconToken: IconToken;
  title: LocalizedMilestoneTitle;
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

export function createEmptyMilestone(): ItineraryMilestone {
  return {
    id: crypto.randomUUID(),
    timeTag: '',
    iconToken: 'generic',
    title: { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '' },
  };
}

export function createLocalizedMilestoneTitle(): LocalizedMilestoneTitle {
  return { en: '', de: '', ru: '', fr: '', it: '', pl: '', es: '' };
}
