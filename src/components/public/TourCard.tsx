'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import type { PublicTour } from '@/types/publicTour';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';

interface TourCardProps {
  tour: PublicTour;
  priority?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const rounded = Math.round(rating);
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i <= rounded ? 'fill-[#EAB308] text-[#EAB308]' : 'text-slate-600'}`}
      />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function TourCard({ tour, priority }: TourCardProps) {
  const [imgError, setImgError] = useState(false);
  const { language, dict } = useLanguage();
  const { formatPrice } = useCurrency();

  // Extract dynamic localized title
  const localizedTitle = tour.translations?.[language]?.title || tour.title;

  return (
    <article className="group overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10">
      <Link href={`/tours/${tour.slug}`} className="flex flex-row sm:flex-col h-full justify-between">
        <div className="relative w-32 min-w-[128px] max-w-[136px] self-stretch sm:w-full sm:min-w-0 sm:max-w-none sm:aspect-[4/3] overflow-hidden bg-white/[0.02]">
          {tour.thumbnailUrl && !imgError ? (
            <Image
              src={tour.thumbnailUrl}
              alt={localizedTitle}
              fill
              sizes="(max-width: 640px) 140px, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={priority}
              unoptimized={isSupabaseStorageImage(tour.thumbnailUrl)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0EA5E9]/10 via-[#070F1E] to-[#EAB308]/10">
              <svg className="h-8 w-8 sm:h-12 sm:w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute left-2 top-2 sm:left-4 sm:top-4 rounded-full border border-white/10 bg-[#070F1E]/85 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.18em] text-[#EAB308] backdrop-blur-md">
            {tour.destination.name}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-3 sm:p-6 min-w-0">
          <div>
            {/* Top row: Destination & Rating */}
            <div className="mb-1.5 sm:mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#06B6D4] truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {tour.destination.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 fill-[#EAB308] text-[#EAB308]" />
                <span className="text-[11px] font-bold text-white">
                  {tour.rating > 0 ? tour.rating.toFixed(1) : dict.catalog.unrated}
                </span>
              </div>
            </div>

            <h3 className="mb-1.5 sm:mb-2 line-clamp-2 text-sm sm:text-lg font-black leading-snug sm:leading-tight text-white transition-colors group-hover:text-[#06B6D4]">
              {localizedTitle}
            </h3>

            {(tour.displayExcerpt || tour.showExcerptOnCard) && tour.cardExcerpt && (
              <p className="mb-2 sm:mb-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-400 hidden sm:block">
                {tour.cardExcerpt}
              </p>
            )}

            {tour.duration && (
              <div className="mb-2 sm:mb-4 flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400">
                <Clock className="h-3 w-3 text-[#EAB308]" />
                <span>{tour.duration}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-2 sm:pt-4">
            <div>
              {tour.basePrice != null && tour.basePrice > 0 ? (
                <>
                  <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-slate-500 block">
                    {dict.catalog.startingAt}
                  </span>
                  <span className="text-base sm:text-2xl font-black text-white">
                    {formatPrice(tour.basePrice, { round: true })}
                  </span>
                </>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-amber-400 block">Price on request</span>
              )}
            </div>
            <span className="sm:hidden text-xs font-bold text-[#06B6D4]">View →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
