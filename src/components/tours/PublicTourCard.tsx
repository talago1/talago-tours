'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import CarouselImages from '@/components/ui/CarouselImages';

import { useLanguage } from '@/context/LanguageContext';
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
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(ratingAverage || 5)
              ? 'fill-[#FFD700] text-[#FFD700]'
              : 'fill-slate-700 text-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function PublicTourCard({ tour }: { tour: PublicTourCardData }) {
  const { dict, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

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
  const isAr = (language as string) === 'ar';

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] via-[#0B1528]/60 to-[#070F1E] shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#00E5FF]/40 hover:shadow-[#00E5FF]/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/tours/${tour.slug}`} className="flex h-full flex-col justify-between">
        {/* Top Media Container */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
            {allImages.length > 0 ? (
              <CarouselImages
                images={allImages}
                isHovered={isHovered}
                tourId={tour.id}
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
                  {isAr ? 'الأكثر طلباً' : 'Best Seller'}
                </span>
              ) : tour.isFeatured ? (
                <span className="flex items-center gap-1 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? 'مميز' : 'Featured'}
                </span>
              ) : tour.isNew ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {isAr ? 'جديد' : 'New'}
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
              <div className="flex items-center gap-1.5">
                <RatingStars ratingAverage={tour.ratingAverage} />
                <span className="text-xs font-bold text-white">
                  {tour.ratingAverage > 0 ? tour.ratingAverage.toFixed(1) : '5.0'}
                </span>
                <span className="text-[11px] text-slate-500">
                  ({tour.ratingCount || 14} {dict.catalog.reviews})
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

            {/* Description excerpt */}
            {description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer: Price & Action Button */}
        <div className="p-5 pt-0">
          <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {dict.catalog.startingAt}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#FFD700]">
                  ${price != null ? price.toFixed(0) : '0'}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-slate-500 line-through">
                    ${tour.originalPrice!.toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-black text-white transition-all group-hover:border-[#00E5FF] group-hover:bg-[#00E5FF] group-hover:text-[#070F1E]">
              <span>{dict.catalog.reserveSpot}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
