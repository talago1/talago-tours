'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ToursCatalogHeader() {
  const { dict } = useLanguage();

  return (
    <div className="mb-12">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">
        {dict.catalog.pageBadge}
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">
        {dict.catalog.pageTitle}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
        {dict.catalog.pageDesc}
      </p>
    </div>
  );
}
