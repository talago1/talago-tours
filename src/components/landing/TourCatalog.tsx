'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';

interface TourCatalogProps {
  tours: PublicTourCardData[];
  totalActiveCount?: number;
}

/** The homepage is an editorial selection, not a second catalog. */
export default function TourCatalog({ tours, totalActiveCount }: TourCatalogProps) {
  const { dict } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(12);
  const featuredTours = [...tours]
    .sort((a, b) => Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) || Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || (b.ratingAverage || 0) - (a.ratingAverage || 0));
  const displayedTours = featuredTours.slice(0, visibleCount);

  return (
    <section id="explore-trips" className="bg-[#070F1E] px-5 py-16 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#00E5FF]">{dict.catalog.homeBadge}</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{dict.catalog.homeHeading}</h2>
          </div>
          {totalActiveCount ? <span className="text-sm text-slate-400">{dict.catalog.xAvailable.replace('{total}', String(totalActiveCount))}</span> : null}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedTours.map((tour) => <PublicTourCard key={tour.id} tour={tour} />)}
        </div>

        {featuredTours.length > visibleCount && (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 9)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white transition hover:border-cyan-300/40 hover:text-cyan-200">
              {dict.catalog.showMore}<ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/tours" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-cyan-200">
            {dict.catalog.browseAllTours}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
