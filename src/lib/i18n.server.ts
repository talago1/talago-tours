import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  LANGUAGES,
  normalizeLanguage,
  type LanguageCode,
} from './i18n';

export type SearchParamsLike =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | null
  | undefined;

function readLangParam(searchParams: SearchParamsLike): string | null {
  if (!searchParams) return null;
  if (searchParams instanceof URLSearchParams) return searchParams.get('lang');
  const raw = searchParams.lang;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

/**
 * Resolves the active language on the server. Priority:
 *   1. explicit `?lang=` query param (shareable / Google crawlable links)
 *   2. persisted `talago-lang` cookie (user preference)
 *   3. `Accept-Language` header (user's phone / browser OS language)
 *   4. English (DEFAULT_LANGUAGE)
 *
 * Reading cookies or headers opts the route into dynamic rendering, which every
 * public content page already uses.
 */
export function resolveServerLanguage(searchParams?: SearchParamsLike): LanguageCode {
  // 1. Explicit query parameter (highest priority: deep links and search engine indexed alternates)
  const fromQuery = readLangParam(searchParams);
  if (fromQuery) {
    const norm = normalizeLanguage(fromQuery);
    if (LANGUAGES.includes(norm)) return norm;
  }

  // 2. Persisted cookie from previous selection
  try {
    const cookieLang = cookies().get(LANGUAGE_COOKIE)?.value;
    if (cookieLang) {
      const norm = normalizeLanguage(cookieLang);
      if (LANGUAGES.includes(norm)) return norm;
    }
  } catch {
    // cookies() unavailable in static build steps
  }

  // 3. User's phone / browser OS language from Accept-Language header
  try {
    const acceptHeader = headers().get('accept-language');
    if (acceptHeader) {
      const entries = acceptHeader.split(',');
      for (const entry of entries) {
        const [langCode] = entry.trim().split(';');
        const norm = normalizeLanguage(langCode);
        if (LANGUAGES.includes(norm)) {
          return norm;
        }
      }
    }
  } catch {
    // headers() unavailable in static contexts
  }

  // 4. Default fallback
  return DEFAULT_LANGUAGE;
}
