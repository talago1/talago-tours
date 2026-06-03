'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Scale, CalendarX, RotateCcw, CloudSun, FileText, AlertTriangle } from 'lucide-react';

export default function BookingTermsPage() {
  const { dict } = useLanguage();
  const bt = dict.bookingTerms;

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,229,255,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#00E5FF]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            {bt.badge}
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white lg:text-7xl">
            {bt.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {bt.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-20">
        <div className="space-y-8">
          {/* Cancellation */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-400/10">
                <CalendarX className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-black text-white">{bt.cancellationTitle}</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-400">{bt.cancellationDesc}</p>
            <div className="space-y-3">
              {[
                { label: bt.cancellationFull, color: 'text-emerald-400' },
                { label: bt.cancellationHalf, color: 'text-[#FFD700]' },
                { label: bt.cancellationNone, color: 'text-red-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#070F1E]/50 px-5 py-4">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.color}`} />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modifications */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                <RotateCcw className="h-5 w-5 text-[#00E5FF]" />
              </div>
              <h2 className="text-xl font-black text-white">{bt.modificationTitle}</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-400">{bt.modificationDesc}</p>
            <ul className="space-y-3">
              {[bt.modificationFree, bt.modificationFee, bt.modificationName].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Refund */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                <RotateCcw className="h-5 w-5 text-[#FFD700]" />
              </div>
              <h2 className="text-xl font-black text-white">{bt.refundTitle}</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-400">{bt.refundDesc}</p>
            <ul className="space-y-3">
              {[bt.refundTiming, bt.refundMethod, bt.refundPartial].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-xs text-emerald-400">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Weather */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                <CloudSun className="h-5 w-5 text-violet-300" />
              </div>
              <h2 className="text-xl font-black text-white">{bt.weatherTitle}</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-400">{bt.weatherDesc}</p>
            <ul className="space-y-3">
              {[bt.weatherReschedule, bt.weatherSafety].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00E5FF]/10 text-xs text-[#00E5FF]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5">
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <p className="text-xs leading-5 text-slate-500">
            These terms are governed by Egyptian law. TALAGO reserves the right to update these terms at any time.
            Guests will be notified of material changes prior to their scheduled departure.
          </p>
        </div>
      </div>
    </main>
  );
}
