'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Search, Ship, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  heroBackground?: string;
  conciergePickImage?: string;
  conciergePickTitle?: string;
  conciergePickDescription?: string;
}

export default function Hero({ heroBackground, conciergePickImage, conciergePickTitle, conciergePickDescription }: HeroProps) {
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
    if (selectedType && selectedType !== 'ALL') {
      params.set('type', selectedType);
    }
    if (selectedDate) {
      params.set('date', selectedDate);
    }
    if (selectedGuests) {
      params.set('guests', selectedGuests);
    }
    const queryString = params.toString();
    router.push(`/tours${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <section className="relative overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/30 via-[#070F1E]/80 to-[#EAB308]/20" />
      {!heroError && (
        <Image
          src={heroBackground || '/talago-hero-red-sea-desert.png'}
          alt="Luxury Red Sea yacht and golden Hurghada desert landscape"
          fill
          priority
          unoptimized={!!heroBackground}
          className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
          onError={() => setHeroError(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070F1E]/95 via-[#070F1E]/72 to-[#070F1E]/45" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#070F1E] to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-center px-5 pb-32 pt-20 sm:px-8 lg:px-10 lg:pb-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#06B6D4] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40">
              <Ship className="h-4 w-4 animate-pulse" />
              <span>{dict.hero.badge}</span>
              <span className="flex h-2 w-2 rounded-full bg-[#00E5FF] shadow-sm shadow-[#00E5FF]" />
            </div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              {dict.hero.title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              {dict.hero.description}
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/tours"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#FDE68A] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[#EAB308]/45"
              >
                {dict.hero.exploreButton}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/#verified-reviews"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]"
              >
                {dict.hero.guestProofButton}
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-[1.03] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10"
                >
                  <p className="text-2xl font-black text-white group-hover:text-[#EAB308] transition-colors">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0EA5E9]/20 via-[#0B1528] to-[#EAB308]/20 p-4 shadow-2xl shadow-[#020617]/60 transition-all duration-500 ease-in-out hover:scale-[1.02]">
              <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden">
                {conciergePickImage ? (
                  <img src={conciergePickImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(248,250,252,0.20),transparent_18%),linear-gradient(155deg,rgba(14,165,233,0.55),rgba(7,15,30,0.15)_38%,rgba(234,179,8,0.45)_100%)]" />
                )}
              </div>
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-[#070F1E]/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#EAB308]">
                  <Sparkles className="h-3.5 w-3.5 text-[#EAB308]" />
                  {dict.hero.concierge.pick}
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {conciergePickTitle || dict.hero.concierge.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {conciergePickDescription || dict.hero.concierge.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-5 pb-16 sm:px-8 lg:px-10">
        <form
          className="grid gap-4 rounded-3xl border border-white/15 bg-[#0B1528]/95 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl md:grid-cols-[1.2fr_1fr_0.8fr_auto] md:items-center md:gap-6 md:p-6"
          onSubmit={handleSearchSubmit}
        >
          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Search className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.adventureType}
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-base font-bold text-white outline-none"
            >
              <option value="ALL" className="bg-[#0B1528] text-white">{dict.hero.search.all}</option>
              <option value="BOAT_TRIP" className="bg-[#0B1528] text-white">{dict.hero.search.luxuryCruise}</option>
              <option value="SAFARI" className="bg-[#0B1528] text-white">{dict.hero.search.quadSafari}</option>
              <option value="SNORKELING" className="bg-[#0B1528] text-white">{dict.hero.search.deepSea}</option>
            </select>
          </label>

          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <CalendarDays className="h-4 w-4 text-[#EAB308]" />
              {dict.hero.search.preferredDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-base font-bold text-white outline-none [color-scheme:dark]"
            />
          </label>

          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Users className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.guests}
            </span>
            <select
              value={selectedGuests}
              onChange={(e) => setSelectedGuests(e.target.value)}
              className="mt-3 w-full cursor-pointer bg-transparent text-base font-bold text-white outline-none"
            >
              <option value="1" className="bg-[#0B1528] text-white">1 Guest</option>
              <option value="2" className="bg-[#0B1528] text-white">2 Guests</option>
              <option value="3" className="bg-[#0B1528] text-white">3 Guests</option>
              <option value="4" className="bg-[#0B1528] text-white">4 Guests</option>
              <option value="5" className="bg-[#0B1528] text-white">5+ Guests</option>
            </select>
          </label>

          <button
            type="submit"
            className="group inline-flex h-full min-h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#EAB308] to-[#FACC15] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-[#EAB308]/45"
          >
            {dict.hero.search.searchButton}
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </section>
  );
}

