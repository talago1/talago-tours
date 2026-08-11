'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from '@/locales/en';

export type LanguageCode = 'en' | 'de' | 'ru' | 'it' | 'fr' | 'pl' | 'es';
type LocaleDict = typeof en;

export const languageLabels: Record<LanguageCode, string> = {
  en: 'EN', de: 'DE', ru: 'RU', it: 'IT', fr: 'FR', pl: 'PL', es: 'ES',
};

const LANGUAGES: LanguageCode[] = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];
const localeCache: Partial<Record<LanguageCode, LocaleDict>> = { en };

async function loadLocale(lang: LanguageCode): Promise<LocaleDict> {
  if (localeCache[lang]) return localeCache[lang]!;
  const mod = await import(`@/locales/${lang}`);
  localeCache[lang] = mod[lang] as LocaleDict;
  return localeCache[lang]!;
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dict: LocaleDict;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [dict, setDict] = useState<LocaleDict>(en);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let chosenLang: LanguageCode | null = null;

    // 1. Check URL query string (?lang=de)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang') as LanguageCode;
      if (urlLang && LANGUAGES.includes(urlLang)) {
        chosenLang = urlLang;
      }
    }

    // 2. Check localStorage (user explicit preference)
    if (!chosenLang) {
      const saved = localStorage.getItem('talago-lang') as LanguageCode;
      if (saved && LANGUAGES.includes(saved)) {
        chosenLang = saved;
      }
    }

    // 3. Fallback: Auto-detect device/browser language (phone settings)
    if (!chosenLang && typeof navigator !== 'undefined') {
      const userLangs = navigator.languages ? Array.from(navigator.languages) : [navigator.language];
      for (const l of userLangs) {
        if (!l) continue;
        const code = l.split('-')[0].toLowerCase() as LanguageCode;
        if (LANGUAGES.includes(code)) {
          chosenLang = code;
          break;
        }
      }
    }

    if (chosenLang && LANGUAGES.includes(chosenLang)) {
      setLanguageState(chosenLang);
      if (chosenLang !== 'en') {
        loadLocale(chosenLang).then(setDict);
      }
    }

    setMounted(true);
  }, []);

  // Sync html lang attribute for SEO and accessibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    localStorage.setItem('talago-lang', lang);
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (lang === 'en') {
      setDict(en);
    } else {
      loadLocale(lang).then(setDict);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict: mounted ? dict : en }}>
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
