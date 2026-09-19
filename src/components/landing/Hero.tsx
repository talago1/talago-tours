'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Search, Sparkles, Users, Ship } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface HeroProps {
  heroBackground?: string;
  conciergePickImage?: string;
  conciergePickTitle?: string;
  conciergePickDescription?: string;
  conciergePickBadge?: string;
  conciergePickPrice?: string;
  conciergePickLink?: string;
  showConciergePick?: boolean;

  heroBadge?: string;
  heroTitle?: string;
  heroTagline?: string;
  heroDescription?: string;
  showHeroBadge?: boolean;
  showHeroTagline?: boolean;
  showHeroDescription?: boolean;

  heroPrimaryBtnText?: string;
  heroPrimaryBtnLink?: string;
  showPrimaryBtn?: boolean;
  heroSecondaryBtnText?: string;
  heroSecondaryBtnLink?: string;
  showSecondaryBtn?: boolean;

  showHeroMetrics?: boolean;
  heroMetric1Value?: string;
  heroMetric1Label?: string;
  heroMetric2Value?: string;
  heroMetric2Label?: string;
  heroMetric3Value?: string;
  heroMetric3Label?: string;

  heroTranslations?: Record<string, any>;
}

export default function Hero({
  heroBackground,
  conciergePickImage,
  conciergePickTitle,
  conciergePickDescription,
  conciergePickBadge,
  conciergePickPrice,
  conciergePickLink,
  showConciergePick = true,

  heroBadge,
  heroTitle,
  heroTagline,
  heroDescription,
  showHeroBadge = true,
  showHeroTagline = true,
  showHeroDescription = true,

  heroPrimaryBtnText,
  heroPrimaryBtnLink = '/tours',
  showPrimaryBtn = true,
  heroSecondaryBtnText,
  heroSecondaryBtnLink = '/#verified-reviews',
  showSecondaryBtn = true,

  showHeroMetrics = true,
  heroMetric1Value,
  heroMetric1Label,
  heroMetric2Value,
  heroMetric2Label,
  heroMetric3Value,
  heroMetric3Label,

  heroTranslations,
}: HeroProps) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const [heroError, setHeroError] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState('2');

  const heroMetrics = [
    {
      value: heroMetric1Value || dict.hero.metrics.ratingValue,
      label: heroMetric1Label || dict.hero.metrics.ratingLabel,
    },
    {
      value: heroMetric2Value || dict.hero.metrics.bookingsValue,
      label: heroMetric2Label || dict.hero.metrics.bookingsLabel,
    },
    {
      value: heroMetric3Value || dict.hero.metrics.conciergeValue,
      label: heroMetric3Label || dict.hero.metrics.conciergeLabel,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedType && selectedType !== 'ALL') params.set('type', selectedType);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedGuests) params.set('guests', selectedGuests);
    const queryString = params.toString();
    router.push(`/tours${queryString ? `?${queryString}` : ''}`);
  };

  const currentTrans = heroTranslations?.[language] || {};

  const finalBadge =
    currentTrans.heroBadge ||
    (language === 'en' ? heroBadge : undefined) ||
    heroBadge ||
    dict.hero.badge;

  const finalTitle =
    currentTrans.heroTitle ||
    (language === 'en' ? heroTitle : undefined) ||
    heroTitle ||
    dict.hero.title;

  const finalTagline =
    currentTrans.heroTagline ||
    (language === 'en' ? heroTagline : undefined) ||
    heroTagline ||
    dict.hero.tagline;

  const finalDescription =
    currentTrans.heroDescription ||
    (language === 'en' ? heroDescription : undefined) ||
    heroDescription ||
    dict.hero.description;

  const finalPrimaryBtn =
    currentTrans.heroPrimaryBtnText ||
    (language === 'en' ? heroPrimaryBtnText : undefined) ||
    heroPrimaryBtnText ||
    dict.hero.exploreButton;

  const finalSecondaryBtn =
    currentTrans.heroSecondaryBtnText ||
    (language === 'en' ? heroSecondaryBtnText : undefined) ||
    heroSecondaryBtnText ||
    dict.hero.guestProofButton;

  const cardBadge =
    currentTrans.conciergePickBadge ||
    (language === 'en' ? conciergePickBadge : undefined) ||
    conciergePickBadge ||
    dict.hero.concierge?.pick ||
    'CONCIERGE PICK';

  const cardTitle =
    currentTrans.conciergePickTitle ||
    (language === 'en' ? conciergePickTitle : undefined) ||
    conciergePickTitle ||
    dict.hero.concierge?.title ||
    'Private yacht sunrise to Giftun Island';

  const cardDesc =
    currentTrans.conciergePickDescription ||
    (language === 'en' ? conciergePickDescription : undefined) ||
    conciergePickDescription ||
    dict.hero.concierge?.description ||
    'Champagne breakfast, reef snorkel guide, and flexible return timing.';

  const cardPrice =
    currentTrans.conciergePickPrice ||
    (language === 'en' ? conciergePickPrice : undefined) ||
    conciergePickPrice ||
    'VIP All-Inclusive';

  const cardLink = conciergePickLink || '/tours';

  return (
    <section className="relative overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      {/* Dynamic Background Image */}
      {!heroError && (
        <Image
          src={heroBackground || '/talago-hero-red-sea-desert.png'}
          alt="Luxury Red Sea yacht and golden Hurghada desert landscape"
          fill
          priority
          unoptimized={!!heroBackground}
          className="scale-105 object-cover object-center transition-transform duration-1000 ease-out"
          onError={() => setHeroError(true)}
        />
      )}

      {/* Cinematic Dark & Colored Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070F1E]/95 via-[#070F1E]/80 to-[#070F1E]/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070F1E]/85 via-transparent to-[#070F1E]" />

      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-[#06B6D4]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-1/4 h-96 w-96 rounded-full bg-[#EAB308]/15 blur-3xl" />

      {/* Main Content Area */}
      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-center px-5 pb-32 pt-24 sm:px-8 lg:px-10 lg:pb-36 lg:pt-32">
        <div
          className={`grid items-center gap-12 ${
            showConciergePick ? 'lg:grid-cols-[1.12fr_0.88fr]' : 'mx-auto max-w-4xl text-center'
          }`}
        >
          {/* Left / Center Column: Typography & CTAs */}
          <div className={!showConciergePick ? 'flex flex-col items-center' : ''}>
            {/* Top Badge */}
            {showHeroBadge && finalBadge && (
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#06B6D4] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-[#06B6D4]/40">
                <Ship className="h-3.5 w-3.5 animate-pulse text-[#06B6D4]" />
                <span>{finalBadge}</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#00E5FF] shadow-sm shadow-[#00E5FF]" />
              </div>
            )}

            {/* Main Title */}
            {finalTitle && (
              <h1 className="text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
                {finalTitle}
              </h1>
            )}

            {/* Brand Tagline */}
            {showHeroTagline && finalTagline && (
              <p
                className="mt-4 text-2xl font-light italic tracking-wide text-[#EAB308] sm:text-3xl lg:text-4xl"
                style={{ fontStyle: 'italic', letterSpacing: '0.02em' }}
              >
                {finalTagline}
              </p>
            )}

            {/* Description */}
            {showHeroDescription && finalDescription && (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {finalDescription}
              </p>
            )}

            {/* Action Buttons */}
            {(showPrimaryBtn || showSecondaryBtn) && (
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {showPrimaryBtn && (
                  <Link
                    href={heroPrimaryBtnLink || '/tours'}
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#FDE68A] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/30 transition-all duration-300 hover:scale-105 hover:shadow-[#EAB308]/50"
                  >
                    <span>{heroPrimaryBtnText || dict.hero.exploreButton}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
                {showSecondaryBtn && (
                  <Link
                    href={heroSecondaryBtnLink || '/#verified-reviews'}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]"
                  >
                    <span>{heroSecondaryBtnText || dict.hero.guestProofButton}</span>
                  </Link>
                )}
              </div>
            )}

            {/* Trust Metrics */}
            {showHeroMetrics && (
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 sm:gap-4">
                {heroMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10 sm:p-4"
                  >
                    <p className="text-xl font-black text-white transition-colors group-hover:text-[#EAB308] sm:text-2xl">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-xs">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Featured Tour / Concierge Pick Card */}
          {showConciergePick && (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <Link
                href={cardLink}
                className="group relative block rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-white/10 via-[#0B1528]/80 to-[#070F1E]/95 p-3.5 shadow-2xl shadow-black/70 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-[#EAB308]/40 hover:shadow-[#EAB308]/20 sm:p-4"
              >
                {/* Image Container with Ambient Glow */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#070F1E]">
                  {conciergePickImage ? (
                    <img
                      src={conciergePickImage}
                      alt={cardTitle}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src="/talago-hero-red-sea-desert.png"
                      alt={cardTitle}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}

                  {/* Gradient to make bottom overlay ultra readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/40 to-transparent" />

                  {/* Top Floating Badges */}
                  <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#070F1E]/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#EAB308] shadow-lg backdrop-blur-md">
                      <Sparkles className="h-3 w-3 text-[#EAB308]" />
                      {cardBadge}
                    </span>

                    {cardPrice && (
                      <span className="rounded-full bg-gradient-to-r from-[#EAB308] to-[#FACC15] px-3.5 py-1.5 text-[11px] font-black tracking-wide text-[#070F1E] shadow-lg">
                        {cardPrice}
                      </span>
                    )}
                  </div>

                  {/* Bottom Card Content Box */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[#070F1E]/85 p-4 shadow-2xl backdrop-blur-xl transition-all group-hover:border-[#EAB308]/30">
                    <p className="text-lg font-black leading-snug text-white transition-colors group-hover:text-[#EAB308] sm:text-xl">
                      {cardTitle}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
                      {cardDesc}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] font-black uppercase tracking-wider text-[#EAB308]">
                      <span>Book Experience</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAB308] text-[#070F1E] transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Floating Interactive Search Bar */}
      <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-5 pb-16 sm:px-8 lg:px-10">
        <form
          className="grid gap-4 rounded-3xl border border-white/15 bg-[#0B1528]/95 p-5 shadow-2xl shadow-black/70 backdrop-blur-2xl md:grid-cols-[1.2fr_1fr_0.8fr_auto] md:items-center md:gap-6 md:p-6"
          onSubmit={handleSearchSubmit}
        >
          {/* Adventure Type */}
          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Search className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.adventureType}
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="ALL" className="bg-[#0B1528] text-white">
                {dict.hero.search.all}
              </option>
              <option value="BOAT_TRIP" className="bg-[#0B1528] text-white">
                {dict.hero.search.luxuryCruise}
              </option>
              <option value="SAFARI" className="bg-[#0B1528] text-white">
                {dict.hero.search.quadSafari}
              </option>
              <option value="SNORKELING" className="bg-[#0B1528] text-white">
                {dict.hero.search.deepSea}
              </option>
            </select>
          </label>

          {/* Preferred Date */}
          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10">
            <span className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <CalendarDays className="h-4 w-4 text-[#EAB308]" />
              {dict.hero.search.preferredDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark]"
            />
          </label>

          {/* Guests */}
          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Users className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.guests}
            </span>
            <select
              value={selectedGuests}
              onChange={(e) => setSelectedGuests(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="1" className="bg-[#0B1528] text-white">
                1 Guest
              </option>
              <option value="2" className="bg-[#0B1528] text-white">
                2 Guests
              </option>
              <option value="3" className="bg-[#0B1528] text-white">
                3 Guests
              </option>
              <option value="4" className="bg-[#0B1528] text-white">
                4 Guests
              </option>
              <option value="5" className="bg-[#0B1528] text-white">
                5+ Guests
              </option>
            </select>
          </label>

          {/* Search Button */}
          <button
            type="submit"
            className="group inline-flex h-full min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#EAB308] to-[#FACC15] px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-[#EAB308]/45 md:min-h-16"
          >
            <span>{dict.hero.search.searchButton}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </section>
  );
}
