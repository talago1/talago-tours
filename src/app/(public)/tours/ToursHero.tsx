'use client';

import Link from 'next/link';
import { Waves, Mountain, Compass, Sparkles, Star, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { SystemSettings } from '@/types/settings';

const floatingIcons = [
  { Icon: Waves,    color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10 border-[#06B6D4]/20', top: '18%', left: '8%',  delay: '0s',    size: 'h-10 w-10' },
  { Icon: Mountain, color: 'text-[#EAB308]', bg: 'bg-[#EAB308]/10 border-[#EAB308]/20', top: '60%', left: '6%',  delay: '1.4s',  size: 'h-8  w-8'  },
  { Icon: Compass,  color: 'text-[#A78BFA]', bg: 'bg-[#A78BFA]/10 border-[#A78BFA]/20', top: '25%', right: '7%', delay: '0.7s',  size: 'h-9  w-9'  },
  { Icon: Sparkles, color: 'text-[#34D399]', bg: 'bg-[#34D399]/10 border-[#34D399]/20', top: '65%', right: '9%', delay: '2s',    size: 'h-7  w-7'  },
];

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

      {/* Animated gradient background — doubles as the scrim when a photo is
          set above, so headline text keeps its contrast either way. */}
      <div className="pointer-events-none absolute inset-0">
        {background && <div className="absolute inset-0 bg-[#070F1E]/70" />}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#06B6D4]/[0.07] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-[#EAB308]/[0.06] blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#A78BFA]/[0.04] blur-[80px] animate-pulse" style={{ animationDelay: '3s' }} />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#06B6D4 1px, transparent 1px), linear-gradient(90deg, #06B6D4 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating category icons */}
      {floatingIcons.map(({ Icon, color, bg, top, left, right, delay, size }) => (
        <div
          key={color + top}
          className="pointer-events-none absolute hidden lg:flex"
          style={{ top, left, right, animationDelay: delay }}
        >
          <div
            className={`flex items-center justify-center rounded-2xl border p-3 backdrop-blur-sm ${bg} animate-bounce`}
            style={{ animationDuration: '3.5s', animationDelay: delay }}
          >
            <Icon className={`${size} ${color}`} />
          </div>
        </div>
      ))}

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

        {/* Destination pills */}
        <div className="mt-8 flex flex-wrap gap-2">
          {['🌊 Hurghada', '🐬 Sharm El Sheikh', '🦈 Marsa Alam'].map((d) => (
            <span
              key={d}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-[#06B6D4]/30 hover:text-[#06B6D4]"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
