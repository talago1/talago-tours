'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpDown, ChevronDown, Filter, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';
import { categoryMatchesGroup } from '@/utils/tourCategory';

interface TourCatalogProps {
  tours: PublicTourCardData[];
  totalActiveCount?: number;
}

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating';
const EXPERIENCE_TYPES = ['Sea', 'Safari', 'Cultural', 'Spa', 'Entertainment'] as const;

function tourPrice(tour: PublicTourCardData) {
  return tour.adultPrice ?? tour.priceAdult ?? tour.basePriceUSD ?? tour.basePrice ?? 0;
}

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
  const [duration, setDuration] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minimumRating, setMinimumRating] = useState('');
  const [hotelPickupOnly, setHotelPickupOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>('recommended');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const destinations = useMemo(
    () => Array.from(new Map(tours.filter((tour) => tour.destination).map((tour) => [tour.destination!.slug, tour.destination!])).values()),
    [tours],
  );

  const filteredTours = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const max = maxPrice ? Number(maxPrice) : null;
    const rating = minimumRating ? Number(minimumRating) : null;
    const filtered = tours.filter((tour) => {
      if (normalizedQuery && !tourSearchText(tour).includes(normalizedQuery)) return false;
      if (destination && tour.destination?.slug !== destination) return false;
      if (experience && !categoryMatchesGroup(tour.category, experience)) return false;
      if (duration === 'short' && (tour.durationHours ?? 0) > 2) return false;
      if (duration === 'half-day' && ((tour.durationHours ?? 0) <= 2 || (tour.durationHours ?? 0) > 5)) return false;
      if (duration === 'full-day' && (tour.durationHours ?? 0) <= 5) return false;
      if (max !== null && tourPrice(tour) > max) return false;
      if (rating !== null && (tour.ratingAverage ?? 0) < rating) return false;
      if (hotelPickupOnly && !(tour as PublicTourCardData & { hotelPickupIncluded?: boolean }).hotelPickupIncluded) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === 'price-low') return tourPrice(a) - tourPrice(b);
      if (sort === 'price-high') return tourPrice(b) - tourPrice(a);
      if (sort === 'rating') return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      return Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller))
        || Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
        || (b.ratingAverage || 0) - (a.ratingAverage || 0);
    });
  }, [destination, duration, experience, hotelPickupOnly, maxPrice, minimumRating, query, sort, tours]);

  const browseAllHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (destination) params.set('destination', destination);
    if (experience) params.set('category', experience);
    if (duration) params.set('duration', duration);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minimumRating) params.set('rating', minimumRating);
    if (hotelPickupOnly) params.set('pickup', 'hotel');
    if (sort !== 'recommended') params.set('sort', sort);
    const suffix = params.toString();
    return suffix ? `/tours?${suffix}` : '/tours';
  }, [destination, duration, experience, hotelPickupOnly, maxPrice, minimumRating, query, sort]);

  const clearFilters = () => {
    setQuery(''); setDestination(''); setExperience(''); setDuration(''); setMaxPrice('');
    setMinimumRating(''); setHotelPickupOnly(false); setSort('recommended'); setVisibleCount(12);
  };

  const displayedTours = filteredTours.slice(0, visibleCount);
  const hasFilters = Boolean(query || destination || experience || duration || maxPrice || minimumRating || hotelPickupOnly || sort !== 'recommended');

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
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(150px,.75fr)_minmax(150px,.75fr)_auto_auto]">
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
            <button type="button" onClick={() => setShowMoreFilters((shown) => !shown)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${showMoreFilters ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'}`}>
              <Filter className="h-4 w-4" /> More filters <ChevronDown className={`h-4 w-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
            </button>
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-300">
              <ArrowUpDown className="h-4 w-4 text-slate-400" />
              <select value={sort} onChange={(event) => { setSort(event.target.value as SortOption); setVisibleCount(12); }} className="min-w-0 bg-transparent outline-none">
                <option value="recommended">Recommended</option><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>

          {showMoreFilters && (
            <div className="mt-2 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <select value={duration} onChange={(event) => { setDuration(event.target.value); setVisibleCount(12); }} className="min-h-10 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300">
                <option value="">Any duration</option><option value="short">Up to 2 hours</option><option value="half-day">2 to 5 hours</option><option value="full-day">More than 5 hours</option>
              </select>
              <select value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setVisibleCount(12); }} className="min-h-10 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300">
                <option value="">Any price</option><option value="30">Up to $30</option><option value="60">Up to $60</option><option value="100">Up to $100</option><option value="200">Up to $200</option>
              </select>
              <select value={minimumRating} onChange={(event) => { setMinimumRating(event.target.value); setVisibleCount(12); }} className="min-h-10 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300">
                <option value="">Any rating</option><option value="4">4.0+ rating</option><option value="4.5">4.5+ rating</option>
              </select>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-[#070F1E] px-3 text-sm text-slate-200">
                <input type="checkbox" checked={hotelPickupOnly} onChange={(event) => { setHotelPickupOnly(event.target.checked); setVisibleCount(12); }} className="h-4 w-4 rounded border-slate-500 bg-transparent text-cyan-300 focus:ring-cyan-300" /> Hotel pickup included
              </label>
            </div>
          )}

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
