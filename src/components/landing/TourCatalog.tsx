'use client';

import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';
import { categoryMatchesGroup } from '@/utils/tourCategory';

interface TourCatalogProps {
  tours: PublicTourCardData[];
  totalActiveCount?: number;
}

const EXPERIENCE_TYPES = ['Sea', 'Safari', 'Cultural', 'Spa'] as const;

function tourSearchText(tour: PublicTourCardData) {
  const translations = tour.translations as Record<string, { title?: string; description?: string }> | null;
  return `${translations?.en?.title || ''} ${translations?.en?.description || ''} ${tour.destination?.name || ''} ${tour.category || ''}`.toLowerCase();
}

/** The home catalog is the only search and filter surface on the home page. */
export default function TourCatalog({ tours, totalActiveCount }: TourCatalogProps) {
  const { dict } = useLanguage();
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [experience, setExperience] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const destinations = useMemo(
    () => Array.from(new Map(tours.filter((tour) => tour.destination).map((tour) => [tour.destination!.slug, tour.destination!])).values()),
    [tours],
  );

  const filteredTours = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = tours.filter((tour) => {
      if (normalizedQuery && !tourSearchText(tour).includes(normalizedQuery)) return false;
      if (destination && tour.destination?.slug !== destination) return false;
      if (experience && !categoryMatchesGroup(tour.category, experience)) return false;
      return true;
    });

    return filtered.sort((a, b) =>
      Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller))
      || Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
      || (b.ratingAverage || 0) - (a.ratingAverage || 0),
    );
  }, [destination, experience, query, tours]);

  const browseAllHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (destination) params.set('destination', destination);
    if (experience) params.set('type', experience.toUpperCase());
    const suffix = params.toString();
    return suffix ? `/tours?${suffix}` : '/tours';
  }, [destination, experience, query]);

  const clearFilters = () => {
    setQuery(''); setDestination(''); setExperience(''); setVisibleCount(12);
  };

  const displayedTours = filteredTours.slice(0, visibleCount);
  const hasFilters = Boolean(query || destination || experience);

  return (
    <section id="explore-trips" className="bg-[#070F1E] px-5 py-16 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#00E5FF]">{dict.catalog.homeBadge}</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{dict.catalog.homeHeading}</h2>
          </div>
          {totalActiveCount ? <span className="text-sm text-slate-400">{dict.catalog.xAvailable.replace('{total}', String(totalActiveCount))}</span> : null}
        </div>

        <div className="mb-8 rounded-lg border border-white/10 bg-[#0B1528] p-3 shadow-xl shadow-black/20">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(150px,.75fr)_minmax(150px,.75fr)]">
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-300 focus-within:border-cyan-300">
              <Search className="h-4 w-4 shrink-0 text-cyan-300" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search experiences" className="w-full bg-transparent outline-none placeholder:text-slate-500" />
            </label>
            <select value={destination} onChange={(event) => { setDestination(event.target.value); setVisibleCount(12); }} className="min-h-11 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300">
              <option value="">All destinations</option>
              {destinations.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
            <select value={experience} onChange={(event) => { setExperience(event.target.value); setVisibleCount(12); }} className="min-h-11 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300">
              <option value="">All experiences</option>
              {EXPERIENCE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
            <span>{filteredTours.length} experience{filteredTours.length === 1 ? '' : 's'} found</span>
            {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 font-semibold text-cyan-200 hover:text-white"><X className="h-3.5 w-3.5" /> Clear filters</button>}
          </div>
        </div>

        {displayedTours.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTours.map((tour) => <PublicTourCard key={tour.id} tour={tour} />)}
          </div>
        ) : <div className="border border-dashed border-white/15 py-16 text-center text-sm text-slate-400">No experiences match these filters.</div>}

        {filteredTours.length > visibleCount && (
          <div className="mt-12 flex justify-center"><button type="button" onClick={() => setVisibleCount((count) => count + 9)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-xs font-bold text-white transition hover:border-cyan-300/40 hover:text-cyan-200">{dict.catalog.showMore}<ArrowRight className="h-4 w-4" /></button></div>
        )}

        <div className="mt-8 text-center"><Link href={browseAllHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-cyan-200">{dict.catalog.browseAllTours}<ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </section>
  );
}
