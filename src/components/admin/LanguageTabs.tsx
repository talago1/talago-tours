'use client';

import type { LanguageCode } from '@/types/tourBuilder';
import { LANGUAGE_CODES, LANGUAGE_LABELS } from '@/types/tourBuilder';

interface LanguageTabsProps {
  activeLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export default function LanguageTabs({
  activeLanguage,
  onLanguageChange,
}: LanguageTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-4">
      {LANGUAGE_CODES.map((code) => {
        const isActive = code === activeLanguage;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onLanguageChange(code)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              isActive
                ? 'bg-primary-coral text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
