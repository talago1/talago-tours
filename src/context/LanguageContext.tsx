'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '@/locales/en';
import { de } from '@/locales/de';
import { ru } from '@/locales/ru';
import { it } from '@/locales/it';
import { fr } from '@/locales/fr';
import { pl } from '@/locales/pl';
import { es } from '@/locales/es';

export type LanguageCode = 'en' | 'de' | 'ru' | 'it' | 'fr' | 'pl' | 'es';

export const languageLabels: Record<LanguageCode, string> = {
  en: 'EN',
  de: 'DE',
  ru: 'RU',
  it: 'IT',
  fr: 'FR',
  pl: 'PL',
  es: 'ES',
};

const dictionaries = { en, de, ru, it, fr, pl, es };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dict: typeof en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('talago-lang') as LanguageCode;
    if (saved && ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'].includes(saved)) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    localStorage.setItem('talago-lang', lang);
    setLanguageState(lang);
  };

  const dict = mounted ? dictionaries[language] : en;

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
