'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Clock,
  MapPin,
  Star,
  Waves,
  Mountain,
  Landmark,
  Sparkles,
  Ticket,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import CarouselImages from '../ui/CarouselImages';

type TourCategory = 'Sea' | 'Safari' | 'Cultural' | 'Spa' | 'Entertainment';

interface TourData {
  id: string;
  slug: string;
  coverImage: string | null;
  galleryImages?: string[] | null;
  thumbnailUrl: string | null;
  basePriceUSD: number | null;
  basePrice: number | null;
  duration: string | null;
  durationHours: number | null;
  translations: unknown;
  displayExcerpt: boolean | null;
  cardExcerpt: string | null;
  category: string | null;
  ratingAverage: number;
  ratingCount: number;
  priceAdult: number | null;
  adultPrice: number | null;
  originalPrice?: number | null;
  isBestSeller?: boolean | null;
  isFeatured?: boolean | null;
  isRecommended?: boolean | null;
  isVip?: boolean | null;
  isNew?: boolean | null;
  customBadge?: string | null;
  destinationId?: string | null;
  destination: { id?: string; name: string; slug: string } | null;
}

interface TourCatalogProps {
  tours: TourData[];
}

function normalizeCategory(cat: string | null): TourCategory {
  if (!cat) return 'Sea';
  const lower = cat.toLowerCase();
  if (lower.includes('cultural') || lower.includes('histor') || lower === 'city') return 'Cultural';
  if (lower.includes('spa') || lower.includes('wellness')) return 'Spa';
  if (lower.includes('entertainment') || lower.includes('dolphin')) return 'Entertainment';
  if (lower.includes('safari') || lower.includes('desert') || lower.includes('adventure')) return 'Safari';
  return 'Sea';
}

function getGradient(category: TourCategory): string {
  if (category === 'Safari') return 'from-[#EAB308] via-[#92400E] to-[#070F1E]';
  if (category === 'Cultural') return 'from-[#A78BFA] via-[#6D28D9] to-[#070F1E]';
  if (category === 'Spa') return 'from-[#34D399] via-[#065F46] to-[#070F1E]';
  if (category === 'Entertainment') return 'from-[#F472B6] via-[#9D174D] to-[#070F1E]';
  return 'from-[#0EA5E9] via-[#075985] to-[#070F1E]';
}

function RatingStars({ ratingAverage }: { ratingAverage: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(ratingAverage) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-slate-600'
          }`}
        />
      ))}
    </div>
  );
}

function getCategoryIcon(category: TourCategory) {
  if (category === 'Safari') return <Mountain className="h-3.5 w-3.5 text-[#EAB308]" />;
  if (category === 'Cultural') return <Landmark className="h-3.5 w-3.5 text-[#A78BFA]" />;
  if (category === 'Spa') return <Sparkles className="h-3.5 w-3.5 text-[#34D399]" />;
  if (category === 'Entertainment') return <Ticket className="h-3.5 w-3.5 text-[#F472B6]" />;
  return <Waves className="h-3.5 w-3.5 text-[#00E5FF]" />;
}

export default function TourCatalog({ tours }: TourCatalogProps) {
  const { dict, language } = useLanguage();
  const isAr = (language as string) === 'ar';

  const [activeDestination, setActiveDestination] = useState<string>('ALL');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{ destination: string; name: string } | null>(null);

  // Auto-detect guest location and recommend nearest destination experiences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = sessionStorage.getItem('talago_active_dest');
    if (saved) {
      setActiveDestination(saved);
      return;
    }

    // 1. IP-based location check from Vercel edge
    fetch('/api/public/geo')
      .then((res) => res.json())
      .then((data) => {
        if (data.destination && ['hurghada', 'sharm-el-sheikh', 'marsa-alam'].includes(data.destination)) {
          setActiveDestination(data.destination);
          setDetectedLocation({
            destination: data.destination,
            name: data.destinationName || data.destination,
          });
        }
      })
      .catch(() => {});

    // 2. High-precision browser geolocation if allowed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const dests = [
            { id: 'hurghada', name: 'Hurghada', lat: 27.2579, lng: 33.8116 },
            { id: 'sharm-el-sheikh', name: 'Sharm El Sheikh', lat: 27.9158, lng: 34.3299 },
            { id: 'marsa-alam', name: 'Marsa Alam', lat: 25.0676, lng: 34.8790 },
          ];
          let closest = dests[0];
          let minD = Infinity;
          dests.forEach((d) => {
            const dist = Math.hypot(d.lat - latitude, d.lng - longitude);
            if (dist < minD) {
              minD = dist;
              closest = d;
            }
          });
          if (minD < 2.5) {
            setActiveDestination(closest.id);
            setDetectedLocation({ destination: closest.id, name: closest.name });
          }
        },
        () => {},
        { timeout: 4000, maximumAge: 600000 }
      );
    }
  }, []);

  const handleDestinationSelect = (id: string) => {
    setActiveDestination(id);
    setVisibleCount(9);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('talago_active_dest', id);
    }
  };

  // Destination options
  const destinationTabs = [
    { id: 'ALL', label: isAr ? 'كافة الوجهات' : 'All Destinations' },
    { id: 'hurghada', label: isAr ? 'الغردقة' : 'Hurghada' },
    { id: 'sharm-el-sheikh', label: isAr ? 'شرم الشيخ' : 'Sharm El Sheikh' },
    { id: 'marsa-alam', label: isAr ? 'مرسى علم' : 'Marsa Alam' },
  ];

  // Category options
  const categoryTabs = [
    { id: 'ALL', label: dict.catalog.all },
    { id: 'Sea', label: dict.catalog.sea },
    { id: 'Safari', label: dict.catalog.safari },
    { id: 'Cultural', label: dict.catalog.cultural },
    { id: 'Spa', label: dict.catalog.spa },
  ];

  // Filter & sort tours: best sellers first, then top rated
  const filteredTours = useMemo(() => {
    return tours
      .filter((t) => {
        // Destination filter
        if (activeDestination !== 'ALL') {
          const destSlug = t.destination?.slug?.toLowerCase() || '';
          if (destSlug !== activeDestination) return false;
        }
        // Category filter
        if (activeCategory !== 'ALL') {
          const cat = normalizeCategory(t.category);
          if (cat !== activeCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Best sellers first
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        // Featured next
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Highest rating
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      });
  }, [tours, activeDestination, activeCategory]);

  const displayedTours = filteredTours.slice(0, visibleCount);

  const getLocalizedCategory = (cat: TourCategory) => {
    if (cat === 'Safari') return dict.catalog.safari;
    if (cat === 'Cultural') return dict.catalog.cultural;
    if (cat === 'Spa') return dict.catalog.spa;
    if (cat === 'Entertainment') return dict.catalog.entertainment;
    return dict.catalog.sea;
  };

  return (
    <section id="explore-trips" className="bg-[#070F1E] px-5 py-16 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#00E5FF]">
              <Sparkles className="h-3.5 w-3.5 text-[#00E5FF]" />
              {isAr ? 'أفضل التجارب والرحلات المختارة' : 'Curated World Experiences'}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {isAr ? 'الأكثر حجزاً وإقبالاً حول العالم' : 'Best Selling & Top Rated Experiences'}
            </h2>
          </div>

          {/* Destination Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {destinationTabs.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => handleDestinationSelect(dest.id)}
                className={`rounded-full border px-4 py-2 text-xs font-black transition-all duration-300 ${
                  activeDestination === dest.id
                    ? 'border-[#00E5FF]/50 bg-[#00E5FF] text-[#070F1E] shadow-lg shadow-[#00E5FF]/20'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
              >
                {dest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detected Location Banner */}
        {detectedLocation && activeDestination === detectedLocation.destination && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-4 py-3 text-xs text-[#00E5FF] backdrop-blur-md">
            <span className="flex items-center gap-2 font-bold">
              <MapPin className="h-4 w-4 shrink-0 text-[#00E5FF]" />
              {isAr
                ? `نعرض لك التجارب الأكثر طلباً في ${detectedLocation.name} الأقرب لموقعك الحالي`
                : `Showing experiences closest to your current location in ${detectedLocation.name}`}
            </span>
            <button
              type="button"
              onClick={() => handleDestinationSelect('ALL')}
              className="font-black underline transition-colors hover:text-white"
            >
              {isAr ? 'استعراض كافة الوجهات' : 'Explore All Destinations'}
            </button>
          </div>
        )}

        {/* Secondary Category Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
            <SlidersHorizontal className="h-3 w-3 text-slate-400" />
            {isAr ? 'التصنيف:' : 'Category:'}
          </span>
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setVisibleCount(9);
              }}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="text-xs text-slate-500 ml-auto font-medium">
            {filteredTours.length} {isAr ? 'تجربة متاحة' : 'experiences available'}
          </span>
        </div>

        {/* Grid of Experiences */}
        {filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-base font-bold text-slate-300">
              {isAr ? 'لا توجد تجارب في هذا التصنيف حالياً' : 'No experiences found for this selection'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {isAr ? 'جرب اختيار تصنيف آخر أو كافة الوجهات' : 'Try selecting All Destinations or another category to view more.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTours.map((tour) => {
              const t = tour.translations as Record<string, { title?: string; description?: string }> | undefined;
              const langT = (t as any)?.[language] || {};
              const enT = (t as any)?.en || {};
              const title = langT.title || enT.title || 'Untitled Experience';

              const gallery = (tour.galleryImages || []).filter(Boolean) as string[];
              const allImages = [tour.coverImage, ...gallery].filter((x): x is string => typeof x === 'string' && x.length > 0);
              const price = tour.priceAdult ?? tour.adultPrice ?? tour.basePriceUSD ?? tour.basePrice;
              const duration = tour.duration || `${tour.durationHours ?? 0}h`;
              const cat = normalizeCategory(tour.category);
              const hasDiscount = Boolean(tour.originalPrice && price && tour.originalPrice > price);
              const discountPercent = hasDiscount ? Math.round((1 - price! / tour.originalPrice!) * 100) : 0;

              return (
                <article
                  key={tour.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] via-[#0B1528]/60 to-[#070F1E] shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/40 hover:shadow-[#00E5FF]/10"
                  onMouseEnter={() => setHoveredCardId(tour.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <Link href={`/tours/${tour.slug}`} className="block">
                    {/* Media Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
                      {allImages.length > 0 ? (
                        <CarouselImages
                          images={allImages}
                          isHovered={hoveredCardId === tour.id}
                          tourId={tour.id}
                        />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${getGradient(cat)}`}>
                          <div className="flex h-full items-end p-6">
                            <span className="text-sm font-bold text-white">{getLocalizedCategory(cat)}</span>
                          </div>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute left-3.5 right-3.5 top-3.5 z-10 flex items-center justify-between gap-2">
                        {/* Destination Tag */}
                        <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#070F1E]/85 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#00E5FF] backdrop-blur-md">
                          <MapPin className="h-3 w-3 text-[#00E5FF]" />
                          {tour.destination?.name || 'Red Sea'}
                        </span>

                        {/* Best Seller / Promotion Tag */}
                        {tour.isBestSeller ? (
                          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#FFD700] to-[#EAB308] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#070F1E] shadow-lg">
                            <Flame className="h-3 w-3 fill-[#070F1E]" />
                            {isAr ? 'الأكثر طلباً' : 'Best Seller'}
                          </span>
                        ) : tour.isFeatured ? (
                          <span className="flex items-center gap-1 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                            <Sparkles className="h-3 w-3" />
                            {isAr ? 'مميز' : 'Featured'}
                          </span>
                        ) : tour.isNew ? (
                          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            {isAr ? 'جديد' : 'New'}
                          </span>
                        ) : hasDiscount ? (
                          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-black text-red-400">
                            -{discountPercent}%
                          </span>
                        ) : null}
                      </div>

                      {/* Bottom Image Overlay: Category & Duration */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#070F1E]/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                          {getCategoryIcon(cat)}
                          <span>{getLocalizedCategory(cat)}</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#070F1E]/80 px-2.5 py-1 text-xs font-bold text-slate-300 backdrop-blur-md">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* Rating Row */}
                      <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <RatingStars ratingAverage={tour.ratingAverage} />
                          <span className="text-xs font-bold text-white">
                            {tour.ratingAverage > 0 ? tour.ratingAverage.toFixed(1) : '5.0'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({tour.ratingCount || 12} {dict.catalog.reviews})
                          </span>
                        </div>

                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {isAr ? 'تأكيد فوري' : 'Instant'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-black leading-snug text-white transition-colors group-hover:text-[#00E5FF] line-clamp-2">
                        {title}
                      </h3>

                      {/* Price & Action Row */}
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {dict.catalog.startingAt}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-[#FFD700]">
                              ${price ?? 0}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-slate-500 line-through">
                                ${tour.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white transition-all group-hover:bg-[#00E5FF] group-hover:text-[#070F1E] group-hover:border-[#00E5FF]">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More / Explore All Experiences Button */}
        {filteredTours.length > visibleCount && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 9)}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:scale-105"
            >
              <span>{isAr ? 'عرض المزيد من التجارب' : 'Show More Experiences'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Link to Full Catalog */}
        <div className="mt-8 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-[#00E5FF]"
          >
            <span>{isAr ? 'استعراض كافة الرحلات المتاحة في الدليل الشامل' : 'Browse full experience directory & search filters'}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
