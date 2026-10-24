'use client';

import Link from 'next/link';
import { Star, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { SystemSettings } from '@/types/settings';

interface ToursHeroProps {
  totalCount: number;
  banners: SystemSettings['banners'];
}

export default function ToursHero({ totalCount, banners }: ToursHeroProps) {
  const { dict } = useLanguage();

  // Admin overrides win; each one falls back to the translated default so an
  // empty setting never blanks out the hero.
  const background = banners.toursHeroBackground?.trim();
  const badge = banners.toursHeroBadge?.trim() || dict.catalog.pageBadge;
  const title = banners.toursHeroTitle?.trim() || dict.catalog.pageTitle;
  const description = banners.toursHeroDescription?.trim() || dict.catalog.pageDesc;
  const buttonText = banners.toursHeroBtnText?.trim() || dict.catalog.browseAll;
  const ratingValue = banners.toursHeroRatingValue?.trim() || '4.9/5';
  const ratingLabel = banners.toursHeroRatingLabel?.trim() || dict.catalog.verifiedGuests;

  return (
    <div className="relative overflow-hidden bg-[#070F1E] pb-10 pt-24 lg:pb-14 lg:pt-32">
      {/* Admin-uploaded background, if set */}
      {background && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${background})` }}
        />
      )}

      {/* A restrained scrim keeps an optional admin image readable. */}
      <div className="pointer-events-none absolute inset-0">
        {background && <div className="absolute inset-0 bg-[#070F1E]/70" />}
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Top label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/25 bg-[#06B6D4]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#06B6D4]">
            <Star className="h-3.5 w-3.5 fill-[#06B6D4]" />
            {badge}
          </span>
          {totalCount > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
              {dict.catalog.xAvailable.replace('{total}', String(totalCount))}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-white lg:text-7xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 lg:text-lg">
          {description}
        </p>

        {/* CTA row */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="#catalog"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#06B6D4]/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-[#06B6D4]/40"
          >
            {buttonText}
            <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1" />
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {['#06B6D4', '#EAB308', '#A78BFA'].map((c) => (
                <div key={c} className="h-8 w-8 rounded-full border-2 border-[#070F1E] flex items-center justify-center" style={{ backgroundColor: c + '20', borderColor: c + '40' }}>
                  <Star className="h-3 w-3" style={{ color: c }} />
                </div>
              ))}
            </div>
            <span>
              <strong className="font-black text-white">{ratingValue}</strong> · {ratingLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
