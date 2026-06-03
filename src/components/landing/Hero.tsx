'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Search, Ship, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
  const { dict } = useLanguage();

  const heroMetrics = [
    { value: dict.hero.metrics.ratingValue, label: dict.hero.metrics.ratingLabel },
    { value: dict.hero.metrics.bookingsValue, label: dict.hero.metrics.bookingsLabel },
    { value: dict.hero.metrics.conciergeValue, label: dict.hero.metrics.conciergeLabel },
  ];

  return (
    <section className="relative overflow-hidden bg-[#070F1E] text-[#F8FAFC]">
      <Image
        src="/talago-hero-red-sea-desert.png"
        alt="Luxury Red Sea yacht and golden Hurghada desert landscape"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#070F1E]/95 via-[#070F1E]/72 to-[#070F1E]/45" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#070F1E] to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-center px-5 pb-32 pt-20 sm:px-8 lg:px-10 lg:pb-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#06B6D4] shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40">
              <Ship className="h-4 w-4" />
              {dict.hero.badge}
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
                className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#FDE68A] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[#EAB308]/45"
              >
                {dict.hero.exploreButton}
                <ArrowRight className="h-5 w-5" />
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
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10"
                >
                  <p className="text-2xl font-black text-white">{metric.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0EA5E9]/20 via-[#0B1528] to-[#EAB308]/20 p-4 shadow-2xl shadow-[#020617]/60 transition-all duration-300 ease-in-out hover:scale-[1.02]">
              <div className="aspect-[4/5] rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(248,250,252,0.20),transparent_18%),linear-gradient(155deg,rgba(14,165,233,0.55),rgba(7,15,30,0.15)_38%,rgba(234,179,8,0.45)_100%)]" />
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-[#070F1E]/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#EAB308]">
                  {dict.hero.concierge.pick}
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {dict.hero.concierge.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {dict.hero.concierge.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-24 max-w-6xl px-5 pb-16 sm:px-8 lg:px-10">
        <form className="grid gap-4 rounded-2xl border border-white/10 bg-[#0B1528]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-md md:grid-cols-[1.2fr_1fr_0.8fr_auto] md:items-center md:gap-6 md:p-6" onSubmit={(e) => e.preventDefault()}>
          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Search className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.adventureType}
            </span>
            <select className="mt-3 w-full bg-transparent text-base font-bold text-white outline-none">
              <option className="bg-[#0B1528] text-white">{dict.hero.search.all}</option>
              <option className="bg-[#0B1528] text-white">{dict.hero.search.luxuryCruise}</option>
              <option className="bg-[#0B1528] text-white">{dict.hero.search.quadSafari}</option>
              <option className="bg-[#0B1528] text-white">{dict.hero.search.deepSea}</option>
            </select>
          </label>

          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <CalendarDays className="h-4 w-4 text-[#EAB308]" />
              {dict.hero.search.preferredDate}
            </span>
            <input
              type="date"
              className="mt-3 w-full bg-transparent text-base font-bold text-white outline-none [color-scheme:dark]"
            />
          </label>

          <label className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10">
            <span className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              <Users className="h-4 w-4 text-[#06B6D4]" />
              {dict.hero.search.guests}
            </span>
            <select className="mt-3 w-full bg-transparent text-base font-bold text-white outline-none">
              <option className="bg-[#0B1528] text-white">2 Guests</option>
              <option className="bg-[#0B1528] text-white">3 Guests</option>
              <option className="bg-[#0B1528] text-white">4 Guests</option>
              <option className="bg-[#0B1528] text-white">5+ Guests</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex h-full min-h-16 items-center justify-center gap-3 rounded-2xl bg-[#EAB308] px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-[#FACC15] hover:shadow-[#EAB308]/45"
          >
            {dict.hero.search.searchButton}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  );
}
