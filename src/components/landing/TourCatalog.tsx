'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';
import TourSearchHeader from '@/components/public/TourSearchHeader';
import { resolveCategoryFilter } from '@/utils/tourCategory';

interface TourCatalogProps {
  tours: PublicTourCardData[];
  totalActiveCount?: number;
}

function tourSearchText(tour: PublicTourCardData) {
  const translations = tour.translations as Record<string, { title?: string; description?: string }> | null;
  return `${translations?.en?.title || ''} ${translations?.en?.description || ''} ${tour.destination?.name || ''} ${tour.category || ''}`.toLowerCase();
}

/** The home catalog is the only search and filter surface on the home page. */
export default function TourCatalog({ tours, totalActiveCount }: TourCatalogProps) {
  const { dict } = useLanguage();
  const searchParams = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(12);
  const query = searchParams.get('search') || '';
  const destination = searchParams.get('destination') || '';
  const type = searchParams.get('type') || '';
  const duration = searchParams.get('duration') || '';
  const rating = Number(searchParams.get('rating') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || 0);
  const pickupOnly = searchParams.get('pickup') === 'true';
  const sort = searchParams.get('sort') || '';

  const destinations = useMemo(
    () => Array.from(new Map(tours.filter((tour) => tour.destination).map((tour) => [tour.destination!.slug, tour.destination!])).values()),
    [tours],
  );

  const filteredTours = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = tours.filter((tour) => {
      if (normalizedQuery && !tourSearchText(tour).includes(normalizedQuery)) return false;
      if (destination && tour.destination?.slug !== destination) return false;
      const categoryValues = resolveCategoryFilter(type);
      if (categoryValues && !categoryValues.some((value) => tour.category?.toLowerCase().includes(value.toLowerCase()))) return false;
      if (duration === 'quick' && (tour.durationHours || 0) > 2) return false;
      if (duration === 'half' && ((tour.durationHours || 0) <= 2 || (tour.durationHours || 0) > 4)) return false;
      if (duration === 'extended' && ((tour.durationHours || 0) <= 4 || (tour.durationHours || 0) > 8)) return false;
      if (duration === 'fullday' && (tour.durationHours || 0) < 8) return false;
      if (rating && (tour.ratingAverage || 0) < rating) return false;
      if (maxPrice && (tour.priceAdult ?? tour.adultPrice ?? tour.basePriceUSD ?? tour.basePrice ?? 0) > maxPrice) return false;
      if (pickupOnly && !tour.hotelPickupIncluded) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === 'price_asc') return (a.priceAdult ?? a.adultPrice ?? a.basePriceUSD ?? a.basePrice ?? 0) - (b.priceAdult ?? b.adultPrice ?? b.basePriceUSD ?? b.basePrice ?? 0);
      if (sort === 'price_desc') return (b.priceAdult ?? b.adultPrice ?? b.basePriceUSD ?? b.basePrice ?? 0) - (a.priceAdult ?? a.adultPrice ?? a.basePriceUSD ?? a.basePrice ?? 0);
      if (sort === 'rating_desc') return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      return Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller)) || Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || (b.ratingAverage || 0) - (a.ratingAverage || 0);
    });
  }, [destination, duration, maxPrice, pickupOnly, query, rating, searchParams, sort, tours, type]);

  const browseAllHref = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (destination) params.set('destination', destination);
    if (type) params.set('type', type);
    const suffix = params.toString();
    return suffix ? `/tours?${suffix}` : '/tours';
  }, [destination, query, type]);

  const displayedTours = filteredTours.slice(0, visibleCount);
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

        <div className="mb-8">
          <TourSearchHeader destinations={destinations} totalCount={totalActiveCount || tours.length} filteredCount={filteredTours.length} />
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
