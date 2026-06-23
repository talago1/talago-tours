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
    const saved = localStorage.getItem('talago-lang') as LanguageCode;
    if (saved && saved !== 'en' && LANGUAGES.includes(saved)) {
      setLanguageState(saved);
      loadLocale(saved).then(setDict);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    localStorage.setItem('talago-lang', lang);
    setLanguageState(lang);
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
