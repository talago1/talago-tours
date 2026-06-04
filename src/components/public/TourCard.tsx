'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import type { PublicTour } from '@/types/publicTour';
import { useLanguage } from '@/context/LanguageContext';

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

  // Extract dynamic localized title
  const localizedTitle = tour.translations?.[language]?.title || tour.title;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10">
      <Link href={`/tours/${tour.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
          {tour.thumbnailUrl && !imgError ? (
            <Image
              src={tour.thumbnailUrl}
              alt={localizedTitle}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={priority}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0EA5E9]/10 via-[#070F1E] to-[#EAB308]/10">
              <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#070F1E]/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#EAB308] backdrop-blur-md">
            {tour.destination.name}
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-2 line-clamp-2 min-h-[3rem] text-lg font-black leading-tight text-white transition-colors group-hover:text-[#06B6D4]">
            {localizedTitle}
          </h3>

          {(tour.displayExcerpt || tour.showExcerptOnCard) && tour.cardExcerpt && (
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {tour.cardExcerpt}
            </p>
          )}

          <div className="mb-4 flex items-center gap-2">
            <StarRating rating={tour.rating} />
            <span className="text-xs font-semibold text-slate-400">
              {tour.rating > 0 ? tour.rating.toFixed(1) : dict.catalog.unrated}
            </span>
          </div>

          <div className="mb-5 flex items-center gap-4 text-xs text-slate-400">
            {tour.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#EAB308]" />
                {tour.duration}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#06B6D4]" />
              {tour.destination.name}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              {tour.basePrice != null ? (
                <>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-500 block">
                    {dict.catalog.startingAt}
                  </span>
                  <span className="text-2xl font-black text-white">
                    ${tour.basePrice.toFixed(0)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400 block">Contact us</span>
              )}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308] hover:text-[#070F1E]">
              {dict.catalog.reserveSpot}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
