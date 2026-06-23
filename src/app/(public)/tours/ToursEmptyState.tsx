'use client';

import { Waves } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ToursEmptyState() {
  const { dict } = useLanguage();

  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-white/[0.02] py-24 text-center">
      <Waves className="mb-4 h-12 w-12 text-slate-600" />
      <h3 className="text-xl font-black text-white">{dict.catalog.noResultsTitle}</h3>
      <p className="mt-2 text-sm text-slate-500">{dict.catalog.noResultsDesc}</p>
    </div>
  );
}
