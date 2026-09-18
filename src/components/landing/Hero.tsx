'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Search, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  heroBackground?: string;
  conciergePickImage?: string;
  conciergePickTitle?: string;
  conciergePickDescription?: string;
}

export default function Hero({ heroBackground }: HeroProps) {
  const router = useRouter();
  const { dict } = useLanguage();
  const [heroError, setHeroError] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGuests, setSelectedGuests] = useState('2');

  const heroMetrics = [
    { value: dict.hero.metrics.ratingValue, label: dict.hero.metrics.ratingLabel },
    { value: dict.hero.metrics.bookingsValue, label: dict.hero.metrics.bookingsLabel },
    { value: dict.hero.metrics.conciergeValue, label: dict.hero.metrics.conciergeLabel },
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

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      {/* Background Image */}
      {!heroError && (
        <Image
          src={heroBackground || '/talago-hero-red-sea-desert.png'}
          alt="Luxury Red Sea yacht and golden Hurghada desert landscape"
          fill
          priority
          unoptimized={!!heroBackground}
          className="object-cover object-center scale-105"
          onError={() => setHeroError(true)}
        />
      )}

      {/* Dark overlay — strong at top, lighter at center */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070F1E]/90 via-[#070F1E]/65 to-[#070F1E]/90" />
      {/* Subtle color tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/10 via-transparent to-[#EAB308]/10" />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#070F1E] to-transparent" />

      {/* ── MAIN CONTENT ── */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-5 pb-48 pt-28 text-center sm:px-8">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#06B6D4] backdrop-blur-md">
          <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#06B6D4]" />
          {dict.hero.badge}
        </div>

        {/* Title */}
        <h1 className="max-w-4xl text-5xl font-black leading-[1.0] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {dict.hero.title}
        </h1>

        {/* Gold divider */}
        <div className="my-6 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#EAB308]/60" />
          <span className="h-1 w-1 rounded-full bg-[#EAB308]" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#EAB308]/60" />
        </div>

        {/* Tagline — the hero of the hero */}
        {dict.hero.tagline && (
          <p className="text-3xl font-light italic text-[#EAB308] sm:text-4xl md:text-5xl">
            {dict.hero.tagline}
          </p>
        )}

        {/* Description */}
        <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          {dict.hero.description}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/tours"
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#FDE68A] px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/30 transition-all duration-300 hover:scale-[1.04] hover:shadow-[#EAB308]/50"
          >
            {dict.hero.exploreButton}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/#verified-reviews"
            className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]"
          >
            {dict.hero.guestProofButton}
          </Link>
        </div>

        {/* Metrics strip */}
        <div className="mt-12 flex items-center justify-center divide-x divide-white/10">
          {heroMetrics.map((m, i) => (
            <div key={i} className="px-8 text-center first:pl-0 last:pr-0">
              <p className="text-2xl font-black text-white">{m.value}</p>
              <p className="mt-0.5 text-xs text-slate-500 uppercase tracking-widest">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-5xl px-5 pb-8 sm:px-8">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl md:grid-cols-[1fr_1fr_0.7fr_auto] md:items-center md:gap-4 md:p-5"
        >
          {/* Type */}
          <label className="block cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#06B6D4]/30">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Search className="h-3.5 w-3.5 text-[#06B6D4]" />
              {dict.hero.search.adventureType}
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-2 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="ALL" className="bg-[#0B1528]">{dict.hero.search.all}</option>
              <option value="BOAT_TRIP" className="bg-[#0B1528]">{dict.hero.search.luxuryCruise}</option>
              <option value="SAFARI" className="bg-[#0B1528]">{dict.hero.search.quadSafari}</option>
              <option value="SNORKELING" className="bg-[#0B1528]">{dict.hero.search.deepSea}</option>
            </select>
          </label>

          {/* Date */}
          <label className="block cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#EAB308]/30">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-[#EAB308]" />
              {dict.hero.search.preferredDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark]"
            />
          </label>

          {/* Guests */}
          <label className="block cursor-pointer rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:border-[#06B6D4]/30">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <Users className="h-3.5 w-3.5 text-[#06B6D4]" />
              {dict.hero.search.guests}
            </span>
            <select
              value={selectedGuests}
              onChange={(e) => setSelectedGuests(e.target.value)}
              className="mt-2 w-full cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="1" className="bg-[#0B1528]">1 Guest</option>
              <option value="2" className="bg-[#0B1528]">2 Guests</option>
              <option value="3" className="bg-[#0B1528]">3 Guests</option>
              <option value="4" className="bg-[#0B1528]">4 Guests</option>
              <option value="5" className="bg-[#0B1528]">5+ Guests</option>
            </select>
          </label>

          {/* Search button */}
          <button
            type="submit"
            className="group flex h-full min-h-[64px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#EAB308] to-[#FACC15] px-6 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-lg shadow-[#EAB308]/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-[#EAB308]/40"
          >
            {dict.hero.search.searchButton}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      </div>
    </section>
  );
}
