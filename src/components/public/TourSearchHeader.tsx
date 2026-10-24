'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface TourSearchHeaderProps {
  totalCount: number;
  filteredCount: number;
}

/**
 * Keep the public catalog deliberately small: one search and one ordering
 * control. Legacy filter query parameters remain supported by the server so
 * bookmarked destination/category links continue to resolve.
 */
export default function TourSearchHeader({ totalCount, filteredCount }: TourSearchHeaderProps) {
  const { dict } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    updateParam('search', '');
  }, [updateParam]);

  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1">
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
          className="h-12 w-full rounded-lg border border-white/10 bg-white/[0.05] py-3 pl-11 pr-10 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-white/[0.08]"
        />
        {searchInput && (
          <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm text-slate-400">
          {currentSearch ? dict.catalog.showingXofY.replace('{count}', String(filteredCount)).replace('{total}', String(totalCount)) : dict.catalog.xAvailable.replace('{total}', String(totalCount))}
        </span>
        <label className="relative">
          <span className="sr-only">Sort tours</span>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select value={currentSort} onChange={(event) => updateParam('sort', event.target.value)} className="h-10 appearance-none rounded-lg border border-white/10 bg-white/[0.05] py-2 pl-9 pr-4 text-xs font-semibold text-slate-200 outline-none hover:border-white/25">
            <option value="" className="bg-[#0B1528]">{dict.catalog.sortDefault}</option>
            <option value="popular" className="bg-[#0B1528]">{dict.catalog.bestSeller || 'Best Sellers'}</option>
            <option value="rating_desc" className="bg-[#0B1528]">Top Rated</option>
            <option value="price_asc" className="bg-[#0B1528]">{dict.catalog.sortPriceAsc}</option>
            <option value="price_desc" className="bg-[#0B1528]">{dict.catalog.sortPriceDesc}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
