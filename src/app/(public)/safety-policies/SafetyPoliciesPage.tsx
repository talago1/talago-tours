'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Anchor, LifeBuoy, HeartPulse, Shield, BadgeCheck, Clock } from 'lucide-react';

export default function SafetyPoliciesPage() {
  const { dict } = useLanguage();
  const s = dict.safety;

  const metrics = [
    { value: s.metricCaptains, label: s.metricCaptainsLabel, icon: Anchor },
    { value: s.metricGear, label: s.metricGearLabel, icon: BadgeCheck },
    { value: s.metricResponse, label: s.metricResponseLabel, icon: Clock },
    { value: s.metricInsurance, label: s.metricInsuranceLabel, icon: Shield },
  ];

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-emerald-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-emerald-400">
            {s.badge}
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white lg:text-7xl">
            {s.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {s.description}
          </p>
        </div>
      </section>

      {/* Metric Blocks */}
      <section className="mx-auto max-w-6xl px-6 -mt-12">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 text-center shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30"
              >
                <Icon className="mx-auto mb-3 h-6 w-6 text-emerald-400" />
                <p className="text-3xl font-black text-white">{metric.value}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{metric.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Content Blocks */}
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-8">
          {/* Certified Captains */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:border-emerald-400/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10">
                <Anchor className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-black text-white">{s.certifiedCaptains}</h2>
                <p className="text-sm leading-7 text-slate-400">{s.certifiedCaptainsDesc}</p>
              </div>
            </div>
          </div>

          {/* Safety Gear */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:border-[#00E5FF]/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                <LifeBuoy className="h-8 w-8 text-[#00E5FF]" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-black text-white">{s.safetyGear}</h2>
                <p className="text-sm leading-7 text-slate-400">{s.safetyGearDesc}</p>
              </div>
            </div>
          </div>

          {/* Emergency Response */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:border-red-400/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-400/10">
                <HeartPulse className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-black text-white">{s.emergencyResponse}</h2>
                <p className="text-sm leading-7 text-slate-400">{s.emergencyResponseDesc}</p>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20 transition-all duration-300 hover:border-[#FFD700]/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                <ShieldCheck className="h-8 w-8 text-[#FFD700]" />
              </div>
              <div>
                <h2 className="mb-3 text-2xl font-black text-white">{s.insurance}</h2>
                <p className="text-sm leading-7 text-slate-400">{s.insuranceDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4 text-center">
          <ShieldCheck className="h-8 w-8 text-emerald-400" />
          <p className="text-sm text-slate-500">
            TALAGO is fully licensed and insured. All operations comply with Egyptian tourism authority
            regulations and international safety standards.
          </p>
        </div>
      </div>
    </main>
  );
}
