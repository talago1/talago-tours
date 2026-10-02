'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { en } from '@/locales/en';
import { de } from '@/locales/de';
import { ru } from '@/locales/ru';
import { it } from '@/locales/it';
import { fr } from '@/locales/fr';
import { pl } from '@/locales/pl';
import { es } from '@/locales/es';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  LANGUAGE_LABELS,
  LANGUAGES,
  normalizeLanguage,
  type LanguageCode,
} from '@/lib/i18n';

export type { LanguageCode } from '@/lib/i18n';
export const languageLabels = LANGUAGE_LABELS;

type LocaleDict = typeof en;

// All seven bundles are imported statically. This is a deliberate trade: a few
// extra kB of JS in exchange for a correct first paint (no flash of English
// while an async chunk loads) and server/client hydration parity.
const DICTS: Record<LanguageCode, LocaleDict> = { en, de, ru, it, fr, pl, es };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dict: LocaleDict;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: {
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);

  // Adopt an explicit `?lang=` deep link on first mount without a full reload.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (!urlLang) return;
    const next = normalizeLanguage(urlLang);
    if (!LANGUAGES.includes(next)) return;
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLanguageState((current) => (current === next ? current : next));
  }, []);

  // Keep the document language attribute in sync for a11y and SEO.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback(
    (lang: LanguageCode) => {
      if (!LANGUAGES.includes(lang)) return;
      try {
        localStorage.setItem('talago-lang', lang);
      } catch {
        // localStorage can be unavailable (private mode); cookie still works.
      }
      document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = lang;
      setLanguageState(lang);
      // Re-render server components (metadata, headers, breadcrumbs, DB copy)
      // in the new language so the whole visible experience stays consistent.
      router.refresh();
    },
    [router],
  );

  const dict = DICTS[language] ?? en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
