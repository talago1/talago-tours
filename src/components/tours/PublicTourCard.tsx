'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Star, Waves, Mountain } from 'lucide-react';
import CarouselImages from '@/components/ui/CarouselImages';

type TourCategory = 'sea' | 'snorkeling' | 'diving' | 'boat_trip' | 'safari' | 'desert' | 'adventure' | 'city';

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
  destination: { name: string; slug: string } | null;
}

function normalizeCategory(cat: string | null): TourCategory {
  if (!cat) return 'sea';
  const lower = cat.toLowerCase();
  if (lower === 'snorkeling') return 'snorkeling';
  if (lower === 'diving')     return 'diving';
  if (lower === 'boat_trip')  return 'boat_trip';
  if (lower === 'adventure')  return 'adventure';
  if (lower === 'city')       return 'city';
  if (lower === 'desert')     return 'desert';
  if (lower.includes('safari') || lower.includes('desert')) return 'safari';
  return 'sea';
}

function getGradient(category: TourCategory): string {
  return (category === 'safari' || category === 'desert')
    ? 'from-[#EAB308] via-[#92400E] to-[#070F1E]'
    : 'from-[#0EA5E9] via-[#075985] to-[#070F1E]';
}

function getBadge(rating: number): string {
  if (rating >= 4.9) return 'Exceptional';
  if (rating >= 4.7) return 'Best Seller';
  if (rating >= 4.5) return 'Trending';
  return 'Featured';
}

function RatingStars({ ratingAverage }: { ratingAverage: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < Math.round(ratingAverage) ? 'fill-[#EAB308] text-[#EAB308]' : 'text-slate-600'} transition-all duration-300 ease-in-out`}
        />
      ))}
    </div>
  );
}

export default function PublicTourCard({ tour }: { tour: TourData }) {
  const [isHovered, setIsHovered] = useState(false);

  const t = tour.translations as Record<string, { title?: string; description?: string }> | undefined;
  const title = t?.en?.title ?? 'Untitled Experience';
  const gallery = (tour.galleryImages || []).filter(Boolean) as string[];
  const allImages = [tour.coverImage, ...gallery].filter((x): x is string => typeof x === 'string' && x.length > 0);
  const price = tour.priceAdult ?? tour.adultPrice ?? tour.basePriceUSD ?? tour.basePrice;
  const duration = tour.duration || `${tour.durationHours ?? 0}h`;
  const cat = normalizeCategory(tour.category);

  return (
    <article
      className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/tours/${tour.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
          {allImages.length > 0 ? (
            <CarouselImages
              images={allImages}
              isHovered={isHovered}
              tourId={tour.id}
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${getGradient(cat)} transition-all duration-500 ease-in-out group-hover:scale-110`}>
              <div className="flex h-full items-end p-6">
                <div className="rounded-2xl border border-white/10 bg-[#070F1E]/55 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    {(cat !== 'safari' && cat !== 'desert') ? (
                      <Waves className="h-4 w-4 text-[#06B6D4]" />
                    ) : (
                      <Mountain className="h-4 w-4 text-[#EAB308]" />
                    )}
                    {(cat !== 'safari' && cat !== 'desert') ? 'Sea' : 'Safari'}
                  </div>
                </div>
              </div>
            </div>
          )}
          {allImages.length > 0 && (
            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-[#070F1E]/55 px-4 py-3 backdrop-blur-md z-10">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                {(cat !== 'safari' && cat !== 'desert') ? (
                  <Waves className="h-4 w-4 text-[#06B6D4]" />
                ) : (
                  <Mountain className="h-4 w-4 text-[#EAB308]" />
                )}
                {(cat !== 'safari' && cat !== 'desert') ? 'Sea' : 'Safari'}
              </div>
            </div>
          )}
          <div className="absolute left-5 top-5 rounded-full bg-[#EAB308] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-xl shadow-[#EAB308]/30 z-10">
            {getBadge(tour.ratingAverage)}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="h-4 w-4 text-[#06B6D4]" />
              {tour.destination?.name ?? 'Hurghada'}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="h-4 w-4 text-[#EAB308]" />
              {duration}
            </div>
          </div>

          <h3 className="min-h-20 text-2xl font-black leading-tight text-white">
            {title}
          </h3>

          {tour.displayExcerpt && tour.cardExcerpt && (
            <p className="mb-3 mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {tour.cardExcerpt}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <RatingStars ratingAverage={tour.ratingAverage} />
            {tour.ratingCount > 0 ? (
              <span className="text-sm font-semibold text-slate-300">
                {tour.ratingAverage.toFixed(1)} ({tour.ratingCount} reviews)
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-500">Unrated</span>
            )}
          </div>

          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              {price != null && (
                <>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Starting at
                  </p>
                  <p className="mt-1 text-3xl font-black text-white">
                    ${price.toFixed(0)}
                  </p>
                </>
              )}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308] hover:text-[#070F1E]">
              Reserve Spot
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
