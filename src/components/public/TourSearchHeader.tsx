'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, ChevronDown, Filter, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface TourSearchHeaderProps {
  destinations: { name: string; slug: string }[];
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES = [
  { value: '', label: 'All experiences' },
  { value: 'SNORKELING', label: 'Snorkeling & sea' },
  { value: 'SAFARI', label: 'Safari & desert' },
  { value: 'CULTURAL', label: 'Culture & history' },
  { value: 'SPA', label: 'Wellness' },
];

/** One catalog filter system: primary controls stay visible, refinements do not. */
export default function TourSearchHeader({ destinations, totalCount, filteredCount }: TourSearchHeaderProps) {
  const { dict } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [moreOpen, setMoreOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const activeRefinementCount = useMemo(
    () => ['duration', 'rating', 'maxPrice', 'pickup'].filter((key) => searchParams.get(key)).length,
    [searchParams],
  );

  const clearAll = useCallback(() => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const selectClass = 'h-12 min-w-0 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-200 outline-none transition hover:border-white/25 focus:border-cyan-300/60';

  return (
    <section aria-label="Tour filters" className="rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(150px,.65fr)_minmax(160px,.7fr)_auto_auto] lg:items-center">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => {
              const value = event.target.value;
              setSearchInput(value);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => updateParam('search', value.trim()), 250);
            }}
            placeholder={dict.catalog.searchPlaceholder}
            className="h-12 w-full rounded-lg border border-white/10 bg-[#070F1E] py-3 pl-11 pr-10 text-sm text-white outline-none transition focus:border-cyan-300/60"
          />
          {searchInput && (
            <button type="button" onClick={() => { setSearchInput(''); updateParam('search', ''); }} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select aria-label="Destination" value={searchParams.get('destination') || ''} onChange={(event) => updateParam('destination', event.target.value)} className={selectClass}>
          <option value="" className="bg-[#0B1528]">All destinations</option>
          {destinations.map((destination) => <option key={destination.slug} value={destination.slug} className="bg-[#0B1528]">{destination.name}</option>)}
        </select>

        <select aria-label="Experience type" value={searchParams.get('type') || ''} onChange={(event) => updateParam('type', event.target.value)} className={selectClass}>
          {CATEGORIES.map((category) => <option key={category.value || 'all'} value={category.value} className="bg-[#0B1528]">{category.label}</option>)}
        </select>

        <button type="button" onClick={() => setMoreOpen((open) => !open)} className="relative inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100">
          <Filter className="h-4 w-4" /> More filters
          {activeRefinementCount > 0 && <span className="rounded-full bg-cyan-300 px-1.5 text-xs font-bold text-slate-950">{activeRefinementCount}</span>}
          <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>

        <label className="relative">
          <span className="sr-only">Sort tours</span>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select value={searchParams.get('sort') || ''} onChange={(event) => updateParam('sort', event.target.value)} className={`${selectClass} pl-9`}>
            <option value="" className="bg-[#0B1528]">{dict.catalog.sortDefault}</option>
            <option value="popular" className="bg-[#0B1528]">{dict.catalog.bestSeller || 'Best Sellers'}</option>
            <option value="rating_desc" className="bg-[#0B1528]">Top Rated</option>
            <option value="price_asc" className="bg-[#0B1528]">Price: low to high</option>
            <option value="price_desc" className="bg-[#0B1528]">Price: high to low</option>
          </select>
        </label>
      </div>

      {moreOpen && (
        <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <select aria-label="Duration" value={searchParams.get('duration') || ''} onChange={(event) => updateParam('duration', event.target.value)} className={selectClass}>
            <option value="" className="bg-[#0B1528]">Any duration</option>
            <option value="quick" className="bg-[#0B1528]">Up to 2 hours</option>
            <option value="half" className="bg-[#0B1528]">2 to 4 hours</option>
            <option value="extended" className="bg-[#0B1528]">4 to 8 hours</option>
            <option value="fullday" className="bg-[#0B1528]">Full day</option>
          </select>
          <select aria-label="Price" value={searchParams.get('maxPrice') || ''} onChange={(event) => updateParam('maxPrice', event.target.value)} className={selectClass}>
            <option value="" className="bg-[#0B1528]">Any price</option>
            <option value="50" className="bg-[#0B1528]">Up to $50</option>
            <option value="100" className="bg-[#0B1528]">Up to $100</option>
            <option value="200" className="bg-[#0B1528]">Up to $200</option>
          </select>
          <select aria-label="Rating" value={searchParams.get('rating') || ''} onChange={(event) => updateParam('rating', event.target.value)} className={selectClass}>
            <option value="" className="bg-[#0B1528]">Any rating</option>
            <option value="4.5" className="bg-[#0B1528]">4.5 and above</option>
            <option value="4" className="bg-[#0B1528]">4.0 and above</option>
          </select>
          <label className="flex h-12 items-center gap-3 rounded-lg border border-white/10 px-3 text-sm text-slate-200">
            <input type="checkbox" checked={searchParams.get('pickup') === 'true'} onChange={(event) => updateParam('pickup', event.target.checked ? 'true' : '')} className="h-4 w-4 rounded border-white/30 bg-transparent accent-cyan-300" />
            Hotel pickup included
          </label>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>{currentSearch || searchParams.get('destination') || searchParams.get('type') || activeRefinementCount ? dict.catalog.showingXofY.replace('{count}', String(filteredCount)).replace('{total}', String(totalCount)) : dict.catalog.xAvailable.replace('{total}', String(totalCount))}</span>
        {(currentSearch || searchParams.get('destination') || searchParams.get('type') || searchParams.get('sort') || activeRefinementCount > 0) && <button type="button" onClick={clearAll} className="font-semibold text-cyan-200 hover:text-white">Clear all</button>}
      </div>
    </section>
  );
}
