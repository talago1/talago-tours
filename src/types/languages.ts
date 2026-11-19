/**
 * Managed Language Configuration for TALAGO Tours
 * Stored in SystemSetting key: "managed_languages"
 */

export interface ManagedLanguage {
  code: string;           // e.g. "en", "de", "ru", "ar"
  displayName: string;    // e.g. "English", "German"
  nativeName: string;     // e.g. "English", "Deutsch"
  flag: string;           // emoji flag e.g. "🇬🇧", "🇩🇪"
  direction: 'ltr' | 'rtl';
  isActive: boolean;      // visible to public storefront
  includeInTranslations: boolean; // included in AI translation jobs
  isSource: boolean;      // true for source language (e.g. English)
  order: number;          // display order
}

export const DEFAULT_MANAGED_LANGUAGES: ManagedLanguage[] = [
  { code: 'en', displayName: 'English', nativeName: 'English', flag: '🇬🇧', direction: 'ltr', isActive: true, includeInTranslations: false, isSource: true, order: 0 },
  { code: 'de', displayName: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 1 },
  { code: 'ru', displayName: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 2 },
  { code: 'fr', displayName: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 3 },
  { code: 'it', displayName: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 4 },
  { code: 'pl', displayName: 'Polish', nativeName: 'Polski', flag: '🇵🇱', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 5 },
  { code: 'es', displayName: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 6 },
  { code: 'uk', displayName: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', direction: 'ltr', isActive: true, includeInTranslations: true, isSource: false, order: 7 },
];
