export const LANGUAGES = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es', 'uk'] as const;

export type LanguageCode = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_COOKIE = 'talago-lang';

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'EN',
  de: 'DE',
  ru: 'RU',
  it: 'IT',
  fr: 'FR',
  pl: 'PL',
  es: 'ES',
  uk: 'UA',
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Normalises any input (query param, cookie, browser locale such as `de-DE`)
 * into a supported LanguageCode, falling back to English.
 */
export function normalizeLanguage(value: unknown): LanguageCode {
  if (isLanguageCode(value)) return value;
  if (typeof value === 'string') {
    const base = value.split('-')[0].split('_')[0].toLowerCase();
    if (isLanguageCode(base)) return base;
    if (base === 'ua') return 'uk';
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Reads a field from a Prisma `translations` JSON column for the requested
 * language, falling back to English and then to undefined. Works with plain
 * string maps (`{ en: { title } }`) and returns never an empty string as a hit.
 */
export function getLocalizedValue<T = unknown>(
  translations: unknown,
  lang: LanguageCode,
  key: string,
): T | undefined {
  if (!translations || typeof translations !== 'object') return undefined;
  const record = translations as Record<string, unknown>;

  const readFrom = (bucket: unknown): T | undefined => {
    if (!bucket || typeof bucket !== 'object') return undefined;
    const value = (bucket as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && value !== '') return value as T;
    return undefined;
  };

  return readFrom(record[lang]) ?? readFrom(record[DEFAULT_LANGUAGE]);
}

/**
 * Convenience for the common `translations[lang].title || translations.en.title`
 * pattern used across client components.
 */
export function localizeField(
  translations: unknown,
  lang: LanguageCode,
  key: string,
  fallback?: string,
): string | undefined {
  const value = getLocalizedValue<string>(translations, lang, key);
  if (typeof value === 'string' && value.trim()) return value;
  return fallback;
}
