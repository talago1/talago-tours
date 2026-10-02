import { cookies } from 'next/headers';
import { LANGUAGE_COOKIE, normalizeLanguage, type LanguageCode } from './i18n';

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
 *   1. explicit `?lang=` query param (shareable / crawlable links)
 *   2. the persisted `talago-lang` cookie (set by the language switcher)
 *   3. English
 *
 * Reading cookies opts the route into dynamic rendering, which every public
 * content page already uses.
 */
export function resolveServerLanguage(searchParams?: SearchParamsLike): LanguageCode {
  const fromQuery = readLangParam(searchParams);
  if (fromQuery) return normalizeLanguage(fromQuery);

  try {
    const cookieLang = cookies().get(LANGUAGE_COOKIE)?.value;
    if (cookieLang) return normalizeLanguage(cookieLang);
  } catch {
    // cookies() is unavailable in some contexts (e.g. static generation).
  }

  return 'en';
}
