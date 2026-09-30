'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  Users,
  Compass,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
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
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState('2');

  // 3D Card Interactive Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Rotating showcase destination index for the 3D card
  const showcaseDestinations = [
    {
      name: 'Hurghada & Giftun Islands',
      subtitle: 'Luxury Yachts & Coral Reefs',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=80',
      tag: 'Yacht Charters',
      price: 'From $45',
      rating: '4.98',
      link: '/destinations/hurghada',
    },
    {
      name: 'Sharm El Sheikh & Ras Mohamed',
      subtitle: 'World-Class Diving & Mount Sinai',
      image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1000&q=80',
      tag: 'Diving Sanctuary',
      price: 'From $42',
      rating: '4.96',
      link: '/destinations/sharm-el-sheikh',
    },
    {
      name: 'Marsa Alam & Sataya Reef',
      subtitle: 'Dugongs, Sea Turtles & Wild Dolphins',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&q=80',
      tag: 'Eco Paradise',
      price: 'From $38',
      rating: '5.0',
      link: '/destinations/marsa-alam',
    },
    {
      name: 'Luxor & Valley of the Kings',
      subtitle: 'Pharaonic Wonders & Karnak Temples',
      image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1000&q=80',
      tag: 'Historic Wonders',
      price: 'From $95',
      rating: '4.99',
      link: '/tours?category=cultural',
    },
  ];

  const [destIndex, setDestIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % showcaseDestinations.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [showcaseDestinations.length]);

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
    if (selectedType && selectedType !== 'ALL') params.set('category', selectedType);
    if (selectedDate) params.set('date', selectedDate);
    if (selectedGuests) params.set('guests', selectedGuests);
    const queryString = params.toString();
    router.push(`/tours${queryString ? `?${queryString}` : ''}`);
  };

  const currentTrans = heroTranslations?.[language] || {};
  const isAr = (language as string) === 'ar';
  const heroDict = dict?.hero || ({} as any);

  const finalBadge =
    currentTrans.heroBadge ||
    (language === 'en' && heroBadge ? heroBadge : undefined) ||
    heroDict.badge ||
    heroBadge ||
    (isAr ? 'منصة التجارب السياحية العالمية الفاخرة' : 'GLOBAL LUXURY EXPERIENCE MARKETPLACE');

  const finalTitle =
    currentTrans.heroTitle ||
    (language === 'en' && heroTitle ? heroTitle : undefined) ||
    heroDict.title ||
    heroTitle ||
    (isAr ? 'اكتشف تجارب استثنائية حول العالم' : 'Discover Extraordinary World Experiences');

  const finalTagline =
    currentTrans.heroTagline ||
    (language === 'en' && heroTagline ? heroTagline : undefined) ||
    heroDict.tagline ||
    heroTagline ||
    (isAr
      ? 'رحلات يخوت خاصة، سفاري في قلب الصحراء، وكنوز أسطورية خالدة.'
      : 'Handcrafted luxury yacht charters, virgin coral reefs, desert safaris & historic wonders.');

  const finalDescription =
    currentTrans.heroDescription ||
    (language === 'en' && heroDescription ? heroDescription : undefined) ||
    heroDict.description ||
    heroDescription ||
    (isAr
      ? 'احجز أكثر من 40+ تجربة سياحية معتمدة بأعلى معايير الرفاهية والأمان والتأكيد الفوري.'
      : 'Curated 5-star experiences with vetted operators, guaranteed best rates, flexible cancellation, and VIP concierge.');

  const finalPrimaryBtn =
    currentTrans.heroPrimaryBtnText ||
    (language === 'en' && heroPrimaryBtnText ? heroPrimaryBtnText : undefined) ||
    heroDict.exploreButton ||
    heroPrimaryBtnText ||
    (isAr ? 'استكشف كافة التجارب' : 'Explore All Experiences');

  const finalSecondaryBtn =
    currentTrans.heroSecondaryBtnText ||
    (language === 'en' && heroSecondaryBtnText ? heroSecondaryBtnText : undefined) ||
    heroDict.guestProofButton ||
    heroSecondaryBtnText ||
    (isAr ? 'أفضل الوجهات' : 'Top Destinations');

  const currentShowcase = showcaseDestinations[destIndex];

  return (
    <section className="relative overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      {/* Background Image / Ambient Backdrop */}
      {!heroError && (
        <Image
          src={heroBackground || '/talago-hero-red-sea-desert.png'}
          alt="Global luxury experiences and coastal landscapes"
          fill
          priority
          unoptimized={!!heroBackground}
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
                {isAr ? 'تأكيد فوري للحجز' : 'Instant Confirmation'}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
                {isAr ? 'إلغاء مجاني حتى 24 ساعة' : 'Free Cancellation'}
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#FFD700]" />
                {isAr ? 'أفضل الأسعار المباشرة' : 'Direct Best Rates'}
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
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/30 to-transparent" />

                {/* 3D Floating Top Badge */}
                <div
                  style={{ transform: 'translateZ(30px)' }}
                  className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-[#070F1E]/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#FFD700] shadow-xl backdrop-blur-md"
                >
                  <Sparkles className="h-3 w-3 text-[#FFD700]" />
                  <span>{currentShowcase.tag}</span>
                </div>

                {/* 3D Floating Price Pill */}
                <div
                  style={{ transform: 'translateZ(35px)' }}
                  className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#EAB308] px-3 py-1.5 text-xs font-black text-[#070F1E] shadow-xl"
                >
                  {currentShowcase.price}
                </div>

                {/* Dynamic Destination Info Bar */}
                <div
                  style={{ transform: 'translateZ(25px)' }}
                  className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/10 bg-[#070F1E]/90 p-3.5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-white">{currentShowcase.name}</h4>
                      <p className="text-xs text-slate-300">{currentShowcase.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-[#FFD700]">
                      <Star className="h-3 w-3 fill-[#FFD700]" />
                      <span>{currentShowcase.rating}</span>
                    </div>
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
                  <span className="font-semibold">{isAr ? '43+ تجربة حية جاهزة للحجز' : '43+ Active Experiences Live'}</span>
                </div>

                {/* Interactive Slider Dots */}
                <div className="flex items-center gap-1.5">
                  {showcaseDestinations.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDestIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === destIndex ? 'w-6 bg-[#00E5FF]' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Floating Search Console */}
        <div className="mt-10 sm:mt-12">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 rounded-[2rem] border border-white/15 bg-[#0B1528]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-2xl md:grid-cols-[1.2fr_1.1fr_0.9fr_0.8fr_auto] md:items-center md:gap-4 md:p-5"
          >
            {/* 1. Destination Selector */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-[#00E5FF]" />
                {isAr ? 'الوجهة' : 'Destination'}
              </span>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
              >
                <option value="ALL" className="bg-[#0B1528] text-white">
                  {isAr ? 'جميع الوجهات (مصر والبحر الأحمر)' : 'All Destinations (Red Sea & Egypt)'}
                </option>
                <option value="hurghada" className="bg-[#0B1528] text-white">
                  {isAr ? 'الغردقة وجزر الجفتون' : 'Hurghada & Giftun Islands'}
                </option>
                <option value="sharm-el-sheikh" className="bg-[#0B1528] text-white">
                  {isAr ? 'شرم الشيخ ورأس محمد' : 'Sharm El Sheikh & Ras Mohamed'}
                </option>
                <option value="marsa-alam" className="bg-[#0B1528] text-white">
                  {isAr ? 'مرسى علم وشعاب سطايح' : 'Marsa Alam & Sataya Reef'}
                </option>
                <option value="luxor" className="bg-[#0B1528] text-white">
                  {isAr ? 'الأقصر ومعابد النيل' : 'Luxor & Ancient Thebes'}
                </option>
                <option value="cairo" className="bg-[#0B1528] text-white">
                  {isAr ? 'القاهرة والأهرامات' : 'Cairo & Pyramids'}
                </option>
              </select>
            </label>

            {/* 2. Adventure Category */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Compass className="h-3.5 w-3.5 text-[#FFD700]" />
                {isAr ? 'نوع التجربة' : 'Experience Type'}
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
              >
                <option value="ALL" className="bg-[#0B1528] text-white">
                  {isAr ? 'كافة التجارب' : 'All Experiences'}
                </option>
                <option value="Sea" className="bg-[#0B1528] text-white">
                  {isAr ? 'رحلات بحرية ويخوت' : 'Yachts, Islands & Reefs'}
                </option>
                <option value="Safari" className="bg-[#0B1528] text-white">
                  {isAr ? 'سفاري صحراوي وكواد' : 'Desert Quad Safari & Bedouin'}
                </option>
                <option value="Cultural" className="bg-[#0B1528] text-white">
                  {isAr ? 'معالم أثرية وتاريخية' : 'Historic Wonders & Temples'}
                </option>
                <option value="Diving" className="bg-[#0B1528] text-white">
                  {isAr ? 'غوص محترفين ومبتدئين' : 'Scuba Diving Expeditions'}
                </option>
              </select>
            </label>

            {/* 3. Preferred Date */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5 text-[#00E5FF]" />
                {isAr ? 'التاريخ' : 'Date'}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark]"
              />
            </label>

            {/* 4. Guests */}
            <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <Users className="h-3.5 w-3.5 text-[#FFD700]" />
                {isAr ? 'الضيوف' : 'Guests'}
              </span>
              <select
                value={selectedGuests}
                onChange={(e) => setSelectedGuests(e.target.value)}
                className="mt-1.5 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
              >
                <option value="1" className="bg-[#0B1528] text-white">1 Guest</option>
                <option value="2" className="bg-[#0B1528] text-white">2 Guests</option>
                <option value="3" className="bg-[#0B1528] text-white">3 Guests</option>
                <option value="4" className="bg-[#0B1528] text-white">4 Guests</option>
                <option value="5" className="bg-[#0B1528] text-white">5+ Guests</option>
              </select>
            </label>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="group inline-flex h-full min-h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-xl shadow-[#00E5FF]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#00E5FF]/40 md:min-h-[58px]"
            >
              <span>{isAr ? 'بحث' : 'Search'}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>

          {/* Quick Destination Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-400">
              {isAr ? 'وجهات سريعة:' : 'Quick Explore:'}
            </span>
            <Link
              href="/destinations/hurghada"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
            >
              Hurghada
            </Link>
            <Link
              href="/destinations/sharm-el-sheikh"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
            >
              Sharm El Sheikh
            </Link>
            <Link
              href="/destinations/marsa-alam"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#FFD700]/40 hover:bg-[#FFD700]/10 hover:text-[#FFD700]"
            >
              Marsa Alam
            </Link>
            <Link
              href="/tours?category=Safari"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
            >
              Desert Safari
            </Link>
            <Link
              href="/tours?category=Sea"
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
