'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Calendar, Zap, CloudSun, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FlexibleProtectionPage() {
  const { dict } = useLanguage();
  const fp = dict.flexibleProtection;

  const cards = [
    { title: fp.protectionCard1Title, desc: fp.protectionCard1Desc, icon: ShieldCheck, color: 'text-emerald-400' },
    { title: fp.protectionCard2Title, desc: fp.protectionCard2Desc, icon: Calendar, color: 'text-[#00E5FF]' },
    { title: fp.protectionCard3Title, desc: fp.protectionCard3Desc, icon: Zap, color: 'text-[#FFD700]' },
    { title: fp.protectionCard4Title, desc: fp.protectionCard4Desc, icon: CloudSun, color: 'text-violet-300' },
  ];

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,215,0,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#FFD700]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#FFD700]">
            {fp.badge}
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white lg:text-7xl">
            {fp.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {fp.description}
          </p>
        </div>
      </section>

      {/* Hero Banner */}
      <section className="mx-auto max-w-6xl px-6 -mt-12">
        <div className="rounded-3xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/10 via-[#0B1528] to-[#0B1528] p-8 text-center shadow-2xl shadow-black/20 lg:p-12">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#FFD700]" />
          <h2 className="text-3xl font-black text-white lg:text-4xl">{fp.heroTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400">{fp.heroDesc}</p>
        </div>
      </section>

      {/* Protection Cards */}
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <h3 className="mb-3 text-xl font-black text-white">{card.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{card.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full bg-[#FFD700] px-8 py-4 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02]"
          >
            {dict.catalog.heading}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Terms Note */}
        <div className="mt-12 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 text-center">
          <p className="text-xs leading-5 text-slate-500">{fp.termsNote}</p>
        </div>
      </div>
    </main>
  );
}
