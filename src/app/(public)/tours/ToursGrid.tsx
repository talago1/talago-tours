'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';
import { useLanguage } from '@/context/LanguageContext';
import ToursEmptyState from './ToursEmptyState';

const PAGE_SIZE = 12;

export default function ToursGrid({ tours }: { tours: PublicTourCardData[] }) {
  const { dict } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // A new filter result set should start from the top again.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tours]);

  if (tours.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <ToursEmptyState />
      </div>
    );
  }

  const visible = tours.slice(0, visibleCount);
  const remaining = tours.length - visibleCount;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {visible.map((tour, index) => (
          <PublicTourCard key={tour.id} tour={tour} priority={index === 0} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
          >
            <span>{dict.catalog.showMore}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-slate-500">
            {dict.catalog.showingXofY.replace('{count}', String(visible.length)).replace('{total}', String(tours.length))}
          </p>
        </div>
      )}
    </>
  );
}
