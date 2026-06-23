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
    <div className="mb-4 flex gap-1 border-b border-white/10">
      {LANGUAGE_CODES.map((code) => {
        const isActive = code === activeLanguage;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onLanguageChange(code)}
            className={`rounded-t-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
              isActive
                ? 'bg-[#00E5FF] text-[#070F1E]'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {LANGUAGE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
