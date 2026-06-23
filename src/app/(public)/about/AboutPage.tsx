'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChefHat, ShieldCheck, Ship, Users, Compass } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface AboutPageProps {
  aboutPhilosophyImage?: string;
}

export default function AboutPage({ aboutPhilosophyImage }: AboutPageProps) {
  const { dict } = useLanguage();
  const [imageError, setImageError] = useState(false);

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0EA5E9/10,transparent_50%),radial-gradient(circle_at_70%_70%,#EAB308/10,transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#06B6D4]">
              <Compass className="h-3.5 w-3.5" />
              {dict.about.badge}
            </span>
            <h1 className="mt-8 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              {dict.about.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl max-w-3xl mx-auto">
              {dict.about.intro}
            </p>
          </div>
        </div>
      </section>

      {/* Brand Story and Philosophy */}
      <section className="py-16 border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {dict.about.philosophy.title}
              </h2>
              <p className="text-base leading-8 text-slate-400">
                {dict.about.philosophy.p1}
              </p>
              <p className="text-base leading-8 text-slate-400">
                {dict.about.philosophy.p2}
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#0EA5E9]/20 via-[#070F1E] to-[#EAB308]/20 p-2 shadow-2xl shadow-[#020617]/50">
              {aboutPhilosophyImage && !imageError ? (
                <img
                  src={aboutPhilosophyImage}
                  alt=""
                  className="h-full w-full rounded-[2rem] object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="h-full w-full rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(248,250,252,0.1),transparent_40%),linear-gradient(135deg,rgba(14,165,233,0.3),rgba(7,15,30,0.5)_60%,rgba(234,179,8,0.2)_100%)] flex items-center justify-center">
                <Ship className="h-20 w-20 text-[#06B6D4]/30" />
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Elite Fleet Section */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {dict.about.fleet.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <article className="group rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-8 shadow-2xl shadow-black/20 hover:border-[#06B6D4]/30 hover:shadow-[#06B6D4]/5 transition-all duration-300">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4]">
                <Ship className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black text-white">{dict.about.fleet.yacht}</h3>
              <p className="mt-4 text-base leading-7 text-slate-400">{dict.about.fleet.yachtDesc}</p>
            </article>

            <article className="group rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-8 shadow-2xl shadow-black/20 hover:border-[#EAB308]/30 hover:shadow-[#EAB308]/5 transition-all duration-300">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAB308]/10 text-[#EAB308]">
                <Compass className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-black text-white">{dict.about.fleet.atv}</h3>
              <p className="mt-4 text-base leading-7 text-slate-400">{dict.about.fleet.atvDesc}</p>
            </article>
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-20 border-t border-white/5 bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              {dict.about.trust.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white">{dict.about.trust.captains}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{dict.about.trust.captainsDesc}</p>
            </div>

            <div className="text-center p-6">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white">{dict.bento.cards.captains.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{dict.bento.cards.captains.description}</p>
            </div>

            <div className="text-center p-6">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20">
                <ChefHat className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white">{dict.about.trust.hospitality}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{dict.about.trust.hospitalityDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
