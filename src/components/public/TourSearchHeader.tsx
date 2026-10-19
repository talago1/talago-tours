'use client';

import { useCallback, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  Star,
  DollarSign,
  Filter,
  Check,
  Sparkles,
} from 'lucide-react';
import { TOUR_CATEGORIES } from '@/types/publicTour';
import { useLanguage } from '@/context/LanguageContext';
import type { SystemSettings } from '@/types/settings';

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
  modules?: SystemSettings['modules'];
}

export default function TourSearchHeader({
  destinations,
  totalCount,
  filteredCount,
  modules,
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
  const currentDuration = searchParams.get('duration') || '';
  const currentRating = searchParams.get('rating') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPickup = searchParams.get('pickup') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [drawerOpen, setDrawerOpen] = useState(
    Boolean(currentDuration || currentRating || currentMaxPrice || currentPickup)
  );

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

  const toggleFacet = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key);
      updateParam(key, current === value ? '' : value);
    },
    [searchParams, updateParam]
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

  const facetCount = useMemo(() => {
    let count = 0;
    if (currentDuration) count++;
    if (currentRating) count++;
    if (currentMaxPrice) count++;
    if (currentPickup) count++;
    return count;
  }, [currentDuration, currentRating, currentMaxPrice, currentPickup]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentSearch) count++;
    if (currentType) count++;
    if (currentDestination) count++;
    if (currentSort) count++;
    count += facetCount;
    return count;
  }, [currentSearch, currentType, currentDestination, currentSort, facetCount]);

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

      {/* Category Pills + Sort + Filters Toggle */}
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

        {/* Right side: Sort + Facet Filters Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Faceted Filters Drawer Toggle */}
          {modules?.facetedFilters !== false && (
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${
                drawerOpen || facetCount > 0
                  ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF] shadow-lg shadow-[#00E5FF]/20'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {facetCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00E5FF] px-1 text-[10px] font-black text-[#070F1E]">
                  {facetCount}
                </span>
              )}
            </button>
          )}

          {/* Sort */}
          <div className="relative">
            <select
              value={currentSort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-full border border-white/10 bg-white/5 px-4 py-2 pl-8 pr-10 text-xs font-black uppercase tracking-[0.18em] text-slate-400 outline-none transition-all hover:border-white/20 hover:text-white"
            >
              <option value="" className="bg-[#0B1528] text-slate-400">{dict.catalog.sortDefault}</option>
              <option value="popular" className="bg-[#0B1528] text-white">{dict.catalog.bestSeller || 'Best Sellers'}</option>
              <option value="rating_desc" className="bg-[#0B1528] text-white">Top Rated</option>
              <option value="price_asc" className="bg-[#0B1528] text-white">{dict.catalog.sortPriceAsc}</option>
              <option value="price_desc" className="bg-[#0B1528] text-white">{dict.catalog.sortPriceDesc}</option>
              <option value="duration_asc" className="bg-[#0B1528] text-white">{dict.catalog.sortDurationAsc}</option>
              <option value="duration_desc" className="bg-[#0B1528] text-white">{dict.catalog.sortDurationDesc}</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      {/* ── Advanced Faceted Search Drawer (GetYourGuide / Viator Standard) ── */}
      {modules?.facetedFilters !== false && drawerOpen && (
        <div className="rounded-3xl border border-white/10 bg-[#0B1528]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6 animate-fadeIn">
          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#00E5FF]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">
                Faceted Refinements
              </span>
            </div>
            {facetCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('duration');
                  params.delete('rating');
                  params.delete('maxPrice');
                  params.delete('pickup');
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                }}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Reset Facets
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Duration Buckets */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Clock className="h-3.5 w-3.5 text-[#FFD700]" />
                <span>Duration</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Under 2h', value: 'quick' },
                  { label: '2 – 4h', value: 'half' },
                  { label: '4 – 8h', value: 'extended' },
                  { label: 'Full Day (8h+)', value: 'fullday' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleFacet('duration', item.value)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      currentDuration === item.value
                        ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF] shadow-sm'
                        : 'border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Rating Threshold */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Star className="h-3.5 w-3.5 text-[#FFD700]" />
                <span>Guest Rating</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '★ 4.5 & up', value: '4.5' },
                  { label: '★ 4.0 & up', value: '4.0' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleFacet('rating', item.value)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      currentRating === item.value
                        ? 'border-[#FFD700] bg-[#FFD700]/20 text-[#FFD700] shadow-sm'
                        : 'border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Price Ceiling */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>Budget (USD)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '< $50', value: '50' },
                  { label: '< $100', value: '100' },
                  { label: '< $150', value: '150' },
                  { label: '< $200', value: '200' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleFacet('maxPrice', item.value)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      currentMaxPrice === item.value
                        ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300 shadow-sm'
                        : 'border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Perks & Inclusions */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Check className="h-3.5 w-3.5 text-cyan-400" />
                <span>Special Perks</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => toggleFacet('pickup', 'true')}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                    currentPickup === 'true'
                      ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF] shadow-sm'
                      : 'border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>Hotel Pickup Included</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Results count & active tags indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>
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

        {facetCount > 0 && (
          <span className="text-xs text-slate-400">
            {facetCount} faceted {facetCount === 1 ? 'filter' : 'filters'} active
          </span>
        )}
      </div>
    </div>
  );
}
