'use client';

import { useLanguage } from '@/context/LanguageContext';
import {
  Ship,
  Compass,
  MessageSquare,
  Sparkles,
  Anchor,
  Sun,
  Star,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ConciergeHelpPage() {
  const { dict } = useLanguage();
  const c = dict.concierge;

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,215,0,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#FFD700]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#FFD700]">
            {c.badge}
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white lg:text-7xl">
            {c.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {c.description}
          </p>
        </div>
      </section>

      {/* Private Yacht Charters */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF]/40">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
              <Anchor className="h-7 w-7 text-[#00E5FF]" />
            </div>
            <h2 className="mb-3 text-2xl font-black text-white">{c.privateChartersTitle}</h2>
            <p className="mb-5 text-sm leading-6 text-slate-400">{c.privateChartersDesc}</p>
            <div className="space-y-2">
              {c.charterFeatures.split(',').map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                  <span>{feat.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#FFD700]/40">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD700]/10">
              <Sun className="h-7 w-7 text-[#FFD700]" />
            </div>
            <h2 className="mb-3 text-2xl font-black text-white">{c.luxurySafariTitle}</h2>
            <p className="mb-5 text-sm leading-6 text-slate-400">{c.luxurySafariDesc}</p>
            <div className="space-y-2">
              {c.safariFeatures.split(',').map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
                  <span>{feat.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Concierge Chat Section */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-[#00E5FF]/5 to-transparent p-8 shadow-2xl shadow-black/20 lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10">
                <MessageSquare className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="mb-3 text-2xl font-black text-white">{c.conciergeChatTitle}</h2>
              <p className="mb-6 text-sm leading-6 text-slate-400">{c.conciergeChatDesc}</p>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-black text-white transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                {c.conciergeChatButton}
              </a>
            </div>
            <div className="flex justify-center">
              <div className="rounded-3xl border border-white/10 bg-[#070F1E]/60 p-6 text-center">
                <Star className="mx-auto mb-3 h-8 w-8 text-[#FFD700]" />
                <p className="text-lg font-black text-white">4.9/5</p>
                <p className="text-xs text-slate-500">Guest Satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-black text-white lg:text-4xl">{c.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">{c.ctaDesc}</p>
          <Link
            href="/support"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FFD700] px-8 py-4 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02]"
          >
            {c.ctaButton}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
