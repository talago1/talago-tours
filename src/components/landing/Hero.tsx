'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Compass,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface HeroShowcaseDestination {
  name: string;
  subtitle: string;
  image: string;
  tag: string;
  price: string;
  rating: string;
  link: string;
}

export interface HeroSearchDestination {
  slug: string;
  name: string;
  description?: string;
}

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

  /** Destinations pulled from the database, shown in the rotating 3D card. */
  showcaseDestinations?: HeroShowcaseDestination[];
  /** All destinations pulled from the database, used by the search dropdown. */
  searchDestinations?: HeroSearchDestination[];
  /** Live count of bookable tours, rendered in the card footer. */
  activeTourCount?: number;

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
  showConciergePick = false,
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
  showHeroMetrics = false,
  heroMetric1Value,
  heroMetric1Label,
  heroMetric2Value,
  heroMetric2Label,
  heroMetric3Value,
  heroMetric3Label,
  showcaseDestinations = [],
  searchDestinations = [],
  activeTourCount,
  heroTranslations,
}: HeroProps) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const [heroError, setHeroError] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // 3D Card Interactive Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const [destIndex, setDestIndex] = useState(0);

  // The admin's hand-picked experience takes over the card while enabled;
  // otherwise it rotates through the destinations loaded from the database.
  const conciergePickActive = showConciergePick && Boolean(conciergePickTitle || conciergePickImage);
  const rotatingCount = conciergePickActive ? 0 : showcaseDestinations.length;

  // Local/relative assets (notably /uploads/* from the media uploader) are served
  // same-origin, so the optimizer can resize them safely. Absolute remote URLs are
  // left unoptimized in case the host rejects server-side fetches.
  const isRemote = (url?: string) => Boolean(url && /^https?:\/\//i.test(url));

  useEffect(() => {
    if (rotatingCount <= 1) return;
    const timer = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % rotatingCount);
    }, 4500);
    return () => clearInterval(timer);
  }, [rotatingCount]);

  // Guard against the prop arriving after first paint or shrinking.
  useEffect(() => {
    setDestIndex((prev) => (rotatingCount > 0 && prev >= rotatingCount ? 0 : prev));
  }, [rotatingCount]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedDestination && selectedDestination !== 'ALL') params.set('destination', selectedDestination);
    if (selectedType && selectedType !== 'ALL') params.set('type', selectedType);
    const queryString = params.toString();
    router.push(`/tours${queryString ? `?${queryString}` : ''}`);
  };

  const currentTrans = heroTranslations?.[language] || {};
  const heroDict = dict?.hero || ({} as any);

  const finalBadge =
    currentTrans.heroBadge ||
    (language === 'en' && heroBadge ? heroBadge : undefined) ||
    heroDict.badge ||
    heroBadge ||
    'GLOBAL LUXURY EXPERIENCE MARKETPLACE';

  const finalTitle =
    currentTrans.heroTitle ||
    (language === 'en' && heroTitle ? heroTitle : undefined) ||
    heroDict.title ||
    heroTitle ||
    'Discover Extraordinary World Experiences';

  const finalTagline =
    currentTrans.heroTagline ||
    (language === 'en' && heroTagline ? heroTagline : undefined) ||
    heroDict.tagline ||
    heroTagline ||
    'Handcrafted luxury yacht charters, virgin coral reefs, desert safaris & historic wonders.';

  const finalDescription =
    currentTrans.heroDescription ||
    (language === 'en' && heroDescription ? heroDescription : undefined) ||
    heroDict.description ||
    heroDescription ||
    'Curated 5-star experiences with vetted operators, guaranteed best rates, flexible cancellation, and VIP concierge.';

  const finalPrimaryBtn =
    currentTrans.heroPrimaryBtnText ||
    (language === 'en' && heroPrimaryBtnText ? heroPrimaryBtnText : undefined) ||
    heroDict.exploreButton ||
    heroPrimaryBtnText ||
    'Explore All Experiences';

  const finalSecondaryBtn =
    currentTrans.heroSecondaryBtnText ||
    (language === 'en' && heroSecondaryBtnText ? heroSecondaryBtnText : undefined) ||
    heroDict.guestProofButton ||
    heroSecondaryBtnText ||
    'Top Destinations';

  const conciergeTitle = currentTrans.conciergePickTitle || conciergePickTitle;
  const conciergeDescription = currentTrans.conciergePickDescription || conciergePickDescription;
  const conciergeBadge = currentTrans.conciergePickBadge || conciergePickBadge;
  const conciergePrice = currentTrans.conciergePickPrice || conciergePickPrice;

  const rotatingShowcase = rotatingCount > 0 ? showcaseDestinations[destIndex] : undefined;

  const currentShowcase: HeroShowcaseDestination = conciergePickActive
    ? {
        name: conciergeTitle || heroDict.title || 'Signature Experience',
        subtitle: conciergeDescription || heroDict.tagline || '',
        image: conciergePickImage || heroBackground || '/talago-hero-red-sea-desert.png',
        tag: conciergeBadge || heroDict.concierge?.pick || heroDict.badge || '',
        price: conciergePrice || '',
        rating: '',
        link: conciergePickLink || heroPrimaryBtnLink || '/tours',
      }
    : rotatingShowcase || {
        name: heroDict.title || 'TALAGO',
        subtitle: heroDict.tagline || '',
        image: heroBackground || '/talago-hero-red-sea-desert.png',
        tag: heroDict.badge || '',
        price: '',
        rating: '',
        link: '/tours',
      };

  const heroMetrics = [
    { value: heroMetric1Value, label: heroMetric1Label },
    { value: heroMetric2Value, label: heroMetric2Label },
    { value: heroMetric3Value, label: heroMetric3Label },
  ].filter((m) => Boolean(m.value && m.label));

  return (
    <section className="relative overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      {/* Background Image / Ambient Backdrop */}
      {!heroError && (
        <Image
          src={heroBackground || '/talago-hero-red-sea-desert.png'}
          alt="Global luxury experiences and coastal landscapes"
          fill
          priority
          unoptimized={isRemote(heroBackground)}
          sizes="100vw"
          className="scale-105 object-cover object-center transition-transform duration-1000 ease-out"
          onError={() => setHeroError(true)}
        />
      )}

      {/* Cinematic Dark & Ambient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070F1E] via-[#070F1E]/90 to-[#070F1E]/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070F1E]/80 via-transparent to-[#070F1E]" />

      {/* Glowing Ambient Light Orbs */}
      <div className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-[#00E5FF]/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-10 top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[#06B6D4]/10 blur-[100px]" />

      {/* Main Container - Compact and Balanced */}
      <div className="relative mx-auto max-w-7xl px-5 pt-28 pb-16 sm:px-8 lg:px-10 lg:pt-32 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* Left Column: Global Typography & Value Proposition */}
          <div>
            {/* Global Badge */}
            {showHeroBadge && (
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#00E5FF] shadow-2xl backdrop-blur-md">
                <Globe2 className="h-3.5 w-3.5 animate-spin text-[#00E5FF] [animation-duration:12s]" />
                <span>{finalBadge}</span>
                <span className="flex h-2 w-2 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981] animate-pulse" />
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              {finalTitle}
            </h1>

            {/* Brand Tagline */}
            {showHeroTagline && finalTagline && (
              <p className="mt-3 text-lg font-medium tracking-wide text-[#FFD700] sm:text-xl lg:text-2xl">
                {finalTagline}
              </p>
            )}

            {/* Description */}
            {showHeroDescription && finalDescription && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {finalDescription}
              </p>
            )}

            {/* Key Trust Checkmarks */}
            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                {dict.hero.trust.instantConfirmation}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
                {dict.hero.trust.freeCancellation}
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FFD700]" />
                {dict.hero.trust.directRates}
              </span>
            </div>

            {/* Action Buttons */}
            {(showPrimaryBtn || showSecondaryBtn) && (
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {showPrimaryBtn && (
                  <Link
                    href={heroPrimaryBtnLink || '/tours'}
                    className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-7 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-[#070F1E] shadow-xl shadow-[#00E5FF]/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-[#00E5FF]/40"
                  >
                    <span>{finalPrimaryBtn}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}

                {showSecondaryBtn && (
                  <Link
                    href={heroSecondaryBtnLink || '/#explore-trips'}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#FFD700]/40 hover:bg-white/10"
                  >
                    <span>{finalSecondaryBtn}</span>
                  </Link>
                )}
              </div>
            )}

            {/* Admin-configured headline metrics */}
            {showHeroMetrics && heroMetrics.length > 0 && (
              <dl className="mt-8 grid max-w-xl grid-cols-1 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                {heroMetrics.map((metric) => (
                  <div key={metric.label}>
                    <dt className="text-2xl font-black tracking-tight text-[#00E5FF]">
                      {metric.value}
                    </dt>
                    <dd className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {metric.label}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Right Column: 3D Interactive Moving Showcase Card */}
          <div
            className="relative mx-auto w-full max-w-lg select-none [perspective:1200px]"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Ambient Behind Glow */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#00E5FF]/20 via-[#FFD700]/15 to-transparent blur-2xl transition-opacity duration-500 opacity-70 group-hover:opacity-100" />

            {/* 3D Tilted Glass Card Container */}
            <div
              ref={cardRef}
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovering ? 1.02 : 1}, ${isHovering ? 1.02 : 1}, 1)`,
                transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                transformStyle: 'preserve-3d',
              }}
              className="relative overflow-hidden rounded-[2.25rem] border border-white/20 bg-gradient-to-b from-white/15 via-[#0B1528]/85 to-[#070F1E]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-2xl"
            >
              {/* Dynamic Image Canvas */}
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-[1.75rem] bg-[#070F1E]">
                <Image
                  src={currentShowcase.image}
                  alt={currentShowcase.name}
                  fill
                  priority
unoptimized={isRemote(currentShowcase.image)}
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/30 to-transparent" />

                {/* 3D Floating Top Badge */}
                {currentShowcase.tag && (
                  <div
                    style={{ transform: 'translateZ(30px)' }}
                    className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-[#070F1E]/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#FFD700] shadow-xl backdrop-blur-md"
                  >
                    <Sparkles className="h-3 w-3 text-[#FFD700]" />
                    <span>{currentShowcase.tag}</span>
                  </div>
                )}

                {/* 3D Floating Price Pill */}
                {currentShowcase.price && (
                  <div
                    style={{ transform: 'translateZ(35px)' }}
                    className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#EAB308] px-3 py-1.5 text-xs font-black text-[#070F1E] shadow-xl"
                  >
                    {currentShowcase.price}
                  </div>
                )}

                {/* Dynamic Destination Info Bar */}
                <div
                  style={{ transform: 'translateZ(25px)' }}
                  className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-[#070F1E]/90 p-3.5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={currentShowcase.link} className="group/title inline-flex items-center gap-1.5">
                        <h4 className="text-base font-black text-white transition-colors group-hover/title:text-[#00E5FF]">
                          {currentShowcase.name}
                        </h4>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover/title:translate-x-0.5 group-hover/title:text-[#00E5FF]" />
                      </Link>
                      {currentShowcase.subtitle && (
                        <p className="text-xs text-slate-300">{currentShowcase.subtitle}</p>
                      )}
                    </div>
                    {currentShowcase.rating && (
                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-[#FFD700]">
                        <Star className="h-3 w-3 fill-[#FFD700]" />
                        <span>{currentShowcase.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3D Lower Metrics & Orbit Navigation */}
              <div
                style={{ transform: 'translateZ(20px)' }}
                className="mt-3.5 flex items-center justify-between px-2 pt-1"
              >
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="flex h-2 w-2 rounded-full bg-[#00E5FF] animate-ping" />
                  {typeof activeTourCount === 'number' && (
                    <span className="font-semibold">
                      {activeTourCount} {heroDict.activeExperiences || 'active experiences live'}
                    </span>
                  )}
                </div>

                {/* Interactive Slider Dots */}
                {rotatingCount > 1 && (
                  <div className="flex items-center gap-1.5">
                    {showcaseDestinations.slice(0, rotatingCount).map((dest, idx) => (
                      <button
                        key={dest.link + idx}
                        type="button"
                        onClick={() => setDestIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === destIndex ? 'w-6 bg-[#00E5FF]' : 'w-2 bg-white/20 hover:bg-white/40'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Floating Search Console */}
        <div className="mt-10 sm:mt-12">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 rounded-[2rem] border border-white/15 bg-[#0B1528]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-2xl md:grid-cols-[1.2fr_1.1fr_auto] md:items-center md:gap-4 md:p-5"
          >
            {/* 1. Destination Selector */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-[#00E5FF]" />
                {dict.hero.search.destination}
              </span>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
              >
                <option value="ALL" className="bg-[#0B1528] text-white">
                  {dict.hero.search.allDestinations}
                </option>
                {searchDestinations.map((dest) => (
                  <option key={dest.slug} value={dest.slug} className="bg-[#0B1528] text-white">
                    {dest.description || dest.name}
                  </option>
                ))}
              </select>
            </label>

            {/* 2. Adventure Category */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Compass className="h-3.5 w-3.5 text-[#FFD700]" />
                {dict.hero.search.adventureType}
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
              >
                <option value="ALL" className="bg-[#0B1528] text-white">
                  {dict.hero.search.allExperiences}
                </option>
                <option value="SEA" className="bg-[#0B1528] text-white">
                  {dict.hero.search.luxuryCruise}
                </option>
                <option value="SAFARI" className="bg-[#0B1528] text-white">
                  {dict.hero.search.quadSafari}
                </option>
                <option value="CULTURAL" className="bg-[#0B1528] text-white">
                  {dict.hero.search.cultural}
                </option>
                <option value="DIVING" className="bg-[#0B1528] text-white">
                  {dict.hero.search.deepSea}
                </option>
              </select>
            </label>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="group inline-flex h-full min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-xl shadow-[#00E5FF]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#00E5FF]/40 md:min-h-[58px]"
            >
              <span>{dict.hero.search.searchButton}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>

          {/* Quick Destination Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-400">{dict.hero.search.quickExplore}</span>
            {showcaseDestinations.map((dest) => (
              <Link
                key={dest.link}
                href={dest.link}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
              >
                {dest.name}
              </Link>
            ))}
            <Link
              href="/tours?type=SAFARI"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
            >
              Desert Safari
            </Link>
            <Link
              href="/tours?type=SNORKELING"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
            >
              Yachts & Islands
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
