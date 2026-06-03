'use client';

import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Star, Waves } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type TourCategory = 'Sea' | 'Safari';

interface TourCardData {
  id: string;
  titleKey: string;
  price: string;
  badgeKey: string;
  ratingAverage: number;
  ratingCount: number;
  category: TourCategory;
  durationKey: string;
  locationKey: string;
  gradientClassName: string;
}

const tours: TourCardData[] = [
  {
    id: 'vip-private-yacht-giftun',
    titleKey: 'VIP Private Yacht Cruise & Giftun Island',
    price: '$240',
    badgeKey: 'Best Seller',
    ratingAverage: 4.9,
    ratingCount: 142,
    category: 'Sea',
    durationKey: '7 hours',
    locationKey: 'Giftun Island',
    gradientClassName: 'from-[#0EA5E9] via-[#075985] to-[#070F1E]',
  },
  {
    id: 'sunset-desert-vip-quad',
    titleKey: 'Sunset Desert VIP Quad Safari & Bedouin Oasis',
    price: '$115',
    badgeKey: 'Trending',
    ratingAverage: 4.8,
    ratingCount: 98,
    category: 'Safari',
    durationKey: '5 hours',
    locationKey: 'Eastern Desert',
    gradientClassName: 'from-[#EAB308] via-[#92400E] to-[#070F1E]',
  },
  {
    id: 'dolphin-house-snorkeling-diving',
    titleKey: 'Deep Sea Dolphin House Snorkeling & Diving',
    price: '$160',
    badgeKey: 'Rare Find',
    ratingAverage: 5.0,
    ratingCount: 64,
    category: 'Sea',
    durationKey: '6 hours',
    locationKey: 'Dolphin House',
    gradientClassName: 'from-[#06B6D4] via-[#155E75] to-[#070F1E]',
  },
];

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

export default function TourCatalog() {
  const { dict } = useLanguage();
  const tabs = [dict.catalog.all, dict.catalog.sea, dict.catalog.safari];

  // Map categories for rendering
  const getLocalizedCategory = (cat: TourCategory) => {
    return cat === 'Sea' ? dict.catalog.sea : dict.catalog.safari;
  };

  return (
    <section id="explore-trips" className="bg-[#070F1E] px-5 py-20 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">
              {dict.catalog.section}
            </p>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.catalog.heading}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full border px-5 py-3 text-sm font-black transition-all duration-300 ease-in-out hover:scale-[1.02] ${tab === dict.catalog.all ? 'border-[#EAB308]/40 bg-[#EAB308] text-[#070F1E] shadow-xl shadow-[#EAB308]/25' : 'border-white/10 bg-white/5 text-slate-300 hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {tours.map((tour) => (
            <article
              key={tour.id}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10"
            >
              <div className="relative overflow-hidden">
                <div className={`aspect-[4/3] bg-gradient-to-br ${tour.gradientClassName} transition-all duration-500 ease-in-out group-hover:scale-110`}>
                  <div className="flex h-full items-end p-6">
                    <div className="rounded-2xl border border-white/10 bg-[#070F1E]/55 px-4 py-3 backdrop-blur-md">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Waves className="h-4 w-4 text-[#06B6D4]" />
                        {getLocalizedCategory(tour.category)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-5 top-5 rounded-full bg-[#EAB308] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-xl shadow-[#EAB308]/30">
                  {tour.badgeKey}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4 text-[#06B6D4]" />
                    {tour.locationKey}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="h-4 w-4 text-[#EAB308]" />
                    {tour.durationKey}
                  </div>
                </div>
                <h3 className="min-h-20 text-2xl font-black leading-tight text-white">
                  {tour.titleKey}
                </h3>
                <div className="mt-5 flex items-center gap-3">
                  <RatingStars ratingAverage={tour.ratingAverage} />
                  <span className="text-sm font-semibold text-slate-300">
                    {tour.ratingAverage.toFixed(1)} ({tour.ratingCount} {dict.catalog.reviews})
                  </span>
                </div>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                      {dict.catalog.startingAt}
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      {tour.price}
                    </p>
                  </div>
                  <Link
                    href={`/tours?experience=${tour.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308] hover:text-[#070F1E]"
                  >
                    {dict.catalog.reserveSpot}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
