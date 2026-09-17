'use client';

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { TOUR_CATEGORIES } from '@/types/publicTour';
import { useLanguage } from '@/context/LanguageContext';

// Map internal categories to display labels
const categoryLabels: Record<string, string> = {
  SNORKELING:    'Snorkeling',
  DIVING:        'Diving',
  BOAT_TRIP:     'Boat Trip',
  SAFARI:        'Safari',
  DESERT:        'Desert',
  CULTURAL:      'Cultural',
  SPA:           'Spa & Wellness',
  ENTERTAINMENT: 'Entertainment',
  CITY:          'City',
  ADVENTURE:     'Adventure',
};

interface TourSearchHeaderProps {
  destinations: { name: string; slug: string }[];
  totalCount: number;
  filteredCount: number;
}

export default function TourSearchHeader({
  destinations,
  totalCount,
  filteredCount,
}: TourSearchHeaderProps) {
  const { dict } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSearch = searchParams.get('search') || '';
  const currentType = searchParams.get('type') || '';
  const currentDestination = searchParams.get('destination') || '';
  const currentSort = searchParams.get('sort') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParam('search', value);
      }, 300);
    },
    [updateParam]
  );

  const toggleCategory = useCallback(
    (cat: string) => {
      updateParam('type', currentType === cat ? '' : cat);
    },
    [currentType, updateParam]
  );

  const setDestination = useCallback(
    (slug: string) => {
      updateParam('destination', currentDestination === slug ? '' : slug);
    },
    [currentDestination, updateParam]
  );

  const setSort = useCallback(
    (sort: string) => {
      updateParam('sort', currentSort === sort ? '' : sort);
    },
    [currentSort, updateParam]
  );

  const clearAll = useCallback(() => {
    setSearchInput('');
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentSearch) count++;
    if (currentType) count++;
    if (currentDestination) count++;
    if (currentSort) count++;
    return count;
  }, [currentSearch, currentType, currentDestination, currentSort]);

  const activeCategory = currentType;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="group relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#06B6D4]/20 via-transparent to-[#EAB308]/20 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100" />
        <div className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 transition-all duration-300 group-focus-within:border-[#06B6D4]/40 group-focus-within:bg-white/[0.06] group-focus-within:shadow-lg group-focus-within:shadow-[#06B6D4]/5">
          <Search className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-[#06B6D4]" />
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={dict.catalog.searchPlaceholder}
            className="flex-1 bg-transparent text-base font-medium text-white placeholder-slate-500 outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('search', '');
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-slate-400 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* All / Reset pill */}
          <button
            type="button"
            onClick={() => { if (activeFilterCount > 0) clearAll(); }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 ${
              activeFilterCount === 0
                ? 'bg-[#FF5B00] text-white shadow-lg shadow-[#FF5B00]/25'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:border-[#FF5B00]/40 hover:text-[#FF5B00]'
            }`}
          >
            {dict.catalog.all}
          </button>

          {/* Category pills */}
          {TOUR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-[#06B6D4] text-[#070F1E] shadow-lg shadow-[#06B6D4]/25'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:border-[#06B6D4]/40 hover:text-[#06B6D4]'
              }`}
            >
              {categoryLabels[cat] || cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-full border border-white/10 bg-white/5 px-4 py-2 pl-8 pr-10 text-xs font-black uppercase tracking-[0.18em] text-slate-400 outline-none transition-all hover:border-white/20 hover:text-white"
          >
            <option value="" className="bg-[#0B1528] text-slate-400">{dict.catalog.sortDefault}</option>
            <option value="price_asc" className="bg-[#0B1528] text-white">{dict.catalog.sortPriceAsc}</option>
            <option value="price_desc" className="bg-[#0B1528] text-white">{dict.catalog.sortPriceDesc}</option>
            <option value="duration_asc" className="bg-[#0B1528] text-white">{dict.catalog.sortDurationAsc}</option>
            <option value="duration_desc" className="bg-[#0B1528] text-white">{dict.catalog.sortDurationDesc}</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      {/* Destination Tags */}
      {destinations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          {destinations.map((d) => (
            <button
              key={d.slug}
              type="button"
              onClick={() => setDestination(d.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                currentDestination === d.slug
                  ? 'bg-[#00473F] text-[#A7F3D0] border border-[#00473F]'
                  : 'border border-white/5 bg-white/[0.02] text-slate-500 hover:border-[#00473F]/30 hover:text-[#A7F3D0]'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-slate-500">
        {activeFilterCount > 0
          ? dict.catalog.showingXofY.replace('{count}', String(filteredCount)).replace('{total}', String(totalCount))
          : dict.catalog.xAvailable.replace('{total}', String(totalCount))}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-3 font-semibold text-[#06B6D4] hover:text-[#EAB308] transition-colors"
          >
            {dict.catalog.clearAll}
          </button>
        )}
      </p>
    </div>
  );
}
