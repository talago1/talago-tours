'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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
  Heart,
} from 'lucide-react';
import CarouselImages from '@/components/ui/CarouselImages';

import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { getCategoryGradient, normalizeCategory } from '@/utils/tourCategory';

export interface PublicTourCardData {
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
  displayExcerpt?: boolean | null;
  cardExcerpt?: string | null;
  category: string | null;
  ratingAverage: number;
  ratingCount: number;
  priceAdult: number | null;
  adultPrice: number | null;
  originalPrice?: number | null;
  isBestSeller?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  customBadge?: string | null;
  hotelPickupIncluded?: boolean | null;
  destination: { name: string; slug: string } | null;
}

function getCategoryIcon(category: ReturnType<typeof normalizeCategory>) {
  if (category === 'Safari') return <Mountain className="h-4 w-4 text-[#EAB308]" />;
  if (category === 'Cultural') return <Landmark className="h-4 w-4 text-[#A78BFA]" />;
  if (category === 'Spa') return <Sparkles className="h-4 w-4 text-[#34D399]" />;
  if (category === 'Entertainment') return <Ticket className="h-4 w-4 text-[#F472B6]" />;
  return <Waves className="h-4 w-4 text-[#06B6D4]" />;
}

function RatingStars({ ratingAverage }: { ratingAverage: number }) {
  const rounded = Math.round(ratingAverage);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < rounded
              ? 'fill-[#FFD700] text-[#FFD700]'
              : 'fill-slate-700/60 text-slate-700/60'
          }`}
        />
      ))}
    </div>
  );
}

export default function PublicTourCard({ tour, priority = false }: { tour: PublicTourCardData; priority?: boolean }) {
  const { dict, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [wishAnim, setWishAnim] = useState(false);

  const wishlisted = isWishlisted(tour.id);

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const price = tour.priceAdult ?? tour.adultPrice ?? tour.basePriceUSD ?? tour.basePrice ?? 0;
      const t = tour.translations as Record<string, { title?: string }> | undefined;
      const title =
        (t as any)?.[language]?.title ||
        (t as any)?.en?.title ||
        'Untitled Experience';
      toggleWishlist({
        id: tour.id,
        slug: tour.slug,
        title,
        coverImage: tour.coverImage || '',
        priceUSD: price,
        ratingAverage: tour.ratingAverage,
        ratingCount: tour.ratingCount,
        duration: tour.duration ?? undefined,
        durationHours: tour.durationHours,
        destinationName: tour.destination?.name,
        category: tour.category,
        addedAt: Date.now(),
      });
      setWishAnim(true);
      setTimeout(() => setWishAnim(false), 400);
    },
    [tour, language, toggleWishlist]
  );

  const t = tour.translations as Record<string, { title?: string; description?: string; cardExcerpt?: string }> | undefined;
  const langT = (t as any)?.[language] || {};
  const enT = (t as any)?.en || {};

  const title = langT.title || enT.title || 'Untitled Experience';
  const description = langT.cardExcerpt || langT.description || enT.cardExcerpt || enT.description || tour.cardExcerpt || '';

  const cat = normalizeCategory(tour.category);

  const getLocalizedCategory = (c: ReturnType<typeof normalizeCategory>) => {
    if (c === 'Safari') return dict.catalog.safari;
    if (c === 'Cultural') return dict.catalog.cultural;
    if (c === 'Spa') return dict.catalog.spa;
    if (c === 'Entertainment') return dict.catalog.entertainment;
    return dict.catalog.sea;
  };

  const gallery = (tour.galleryImages || []).filter(Boolean) as string[];
  const allImages = [tour.coverImage, ...gallery].filter(
    (x): x is string => typeof x === 'string' && x.length > 0
  );

  const price = tour.priceAdult ?? tour.adultPrice ?? tour.basePriceUSD ?? tour.basePrice;
  const duration = tour.duration || `${tour.durationHours ?? 0}h`;
  const hasDiscount = Boolean(tour.originalPrice && price && tour.originalPrice > price);
  const discountPercent = hasDiscount ? Math.round((1 - price! / tour.originalPrice!) * 100) : 0;

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] via-[#0B1528]/60 to-[#070F1E] shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/40 hover:shadow-[#00E5FF]/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Wishlist Heart Button (outside Link to prevent navigation) ── */}
      <button
        type="button"
        onClick={handleWishlistToggle}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        className={`absolute right-3.5 top-[calc(45%-1rem)] z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 ${
          wishlisted
            ? 'border-rose-500/60 bg-rose-500/90 shadow-lg shadow-rose-500/40'
            : 'border-white/20 bg-[#070F1E]/70 opacity-0 group-hover:opacity-100'
        } ${wishAnim ? 'scale-125' : 'scale-100'}`}
      >
        <Heart
          className={`h-3.5 w-3.5 transition-all duration-200 ${
            wishlisted ? 'fill-white text-white' : 'text-white/80'
          }`}
        />
      </button>
      {/* The whole card is one link: clicking the image, title, price or the
          action row all navigate to the tour, so there is no separate target to
          aim for. */}
      <Link
        href={`/tours/${tour.slug}`}
        className="flex h-full cursor-pointer flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00E5FF]"
      >
        {/* Top Media Container */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
            {allImages.length > 0 ? (
              <CarouselImages
                images={allImages}
                isHovered={isHovered}
                tourId={tour.id}
                priority={priority}
              />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${getCategoryGradient(cat)}`}>
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
                  {dict.catalog.bestSeller}
                </span>
              ) : tour.isFeatured ? (
                <span className="flex items-center gap-1 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                  <Sparkles className="h-3 w-3" />
                  {dict.catalog.featured}
                </span>
              ) : tour.isNew ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {dict.catalog.isNew}
                </span>
              ) : hasDiscount ? (
                <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-400">
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

          {/* Card Body */}
          <div className="p-5">
            {/* Rating Row */}
            <div className="mb-2.5 flex items-center justify-between">
              {tour.ratingCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <RatingStars ratingAverage={tour.ratingAverage} />
                  <span className="text-xs font-bold text-white">
                    {tour.ratingAverage.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({tour.ratingCount} {dict.catalog.reviews})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00E5FF]">
                  <Sparkles className="h-3.5 w-3.5 text-[#00E5FF]" />
                  <span>{(dict.catalog as any)?.newExperience || 'New Experience'}</span>
                </div>
              )}

              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {dict.catalog.instant}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-black leading-snug text-white transition-colors group-hover:text-[#00E5FF] line-clamp-2">
              {title}
            </h3>

            {/* Description excerpt */}
            {description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer: Price & Action. No divider and no button — the entire card is
            the link, so this row is purely informational. */}
        <div className="p-5 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {dict.catalog.startingAt}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#FFD700]">
                  {price != null ? formatPrice(price, { round: true }) : formatPrice(0, { round: true })}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-500 line-through">
                    {formatPrice(tour.originalPrice!, { round: true })}
                  </span>
                )}
              </div>
            </div>

            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors duration-300 group-hover:border-[#00E5FF]/50 group-hover:text-[#00E5FF]"
            >
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
