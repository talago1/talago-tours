'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Ship,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Building2,
  Award,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const EXPERIENCE_CATEGORIES = [
  'Boat & Yacht Charters',
  'Scuba Diving & Snorkeling',
  'Desert Safari & Quad Biking',
  'Historical & Cultural Guided Tours',
  'Private VIP & Luxury Transport',
  'Wellness & Spa Retreats',
  'Adventure & Extreme Sports',
  'Multi-Day Expeditions',
];

export default function PartnersPage() {
  const { dict } = useLanguage();
  const [formState, setFormState] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    category: EXPERIENCE_CATEGORIES[0],
    website: '',
    fleetSize: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070F1E] text-white">
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-28 lg:px-10 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,229,255,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-[#00E5FF]">
            <Globe className="h-3.5 w-3.5" />
            Global Supplier Network
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
            Partner with <span className="bg-gradient-to-r from-[#00E5FF] to-[#FFD700] bg-clip-text text-transparent">TALAGO</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            List your tours, yacht charters, and curated activities on our world-class marketplace. Connect with high-value international travelers, scale your bookings, and enjoy seamless operations.
          </p>
        </div>
      </section>

      {/* ─── Value Pillars ─── */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-white">Worldwide Exposure</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Reach travelers from over 40+ countries booking tours in 8 major languages with localized currency support.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD700]/10 text-[#FFD700]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-white">Zero Upfront Cost</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Free listing and marketing. We only earn a modest commission when confirmed bookings are delivered to your business.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-white">Instant E-Tickets &amp; QR</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Digital passenger manifests, automated voucher issuance, and mobile QR scanning for your dispatch team at the dock or hotel.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-black text-white">Dedicated Concierge</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Direct B2B concierge channel on WhatsApp for real-time dispatch, schedule adjustments, and VIP customer handling.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Application Form Section ─── */}
      <section className="mx-auto max-w-4xl px-5 pb-24 lg:px-10">
        <div className="rounded-[2.5rem] border border-white/15 bg-gradient-to-b from-[#0B1528] to-[#070F1E] p-8 shadow-2xl shadow-black/60 sm:p-12">
          {submitted ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white">Application Received!</h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                Thank you for applying to join the TALAGO Global Supplier Network. Our operator onboarding team will review your credentials and contact you within 24–48 hours.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/"
                  className="rounded-full bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] transition-all hover:scale-105"
                >
                  Return to Homepage
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="rounded-full border border-white/10 px-6 py-3 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Supplier Onboarding</span>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Apply to Become a Certified Supplier</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Fill in your company details below. Licensed tour operators, dive centers, boat owners, and activity suppliers worldwide are welcome.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Company / Agency Name *
                    </span>
                    <input
                      type="text"
                      required
                      value={formState.companyName}
                      onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                      placeholder="e.g. Red Sea Marine Charters"
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Contact Person &amp; Title *
                    </span>
                    <input
                      type="text"
                      required
                      value={formState.contactName}
                      onChange={(e) => setFormState({ ...formState, contactName: e.target.value })}
                      placeholder="e.g. Karim Hassan, Operations Manager"
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Official Email *
                    </span>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="partner@yourcompany.com"
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Phone / WhatsApp (with country code) *
                    </span>
                    <input
                      type="tel"
                      required
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      placeholder="+20 102 000 0000"
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Country *
                    </span>
                    <input
                      type="text"
                      required
                      value={formState.country}
                      onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                      placeholder="e.g. Egypt, UAE, Turkey..."
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      City / Base *
                    </span>
                    <input
                      type="text"
                      required
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      placeholder="e.g. Hurghada, Dubai, Cairo"
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Primary Category
                    </span>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    >
                      {EXPERIENCE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#0B1528] text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Website or Social Page
                    </span>
                    <input
                      type="url"
                      value={formState.website}
                      onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                      Fleet / Tour Capacity
                    </span>
                    <input
                      type="text"
                      value={formState.fleetSize}
                      onChange={(e) => setFormState({ ...formState, fleetSize: e.target.value })}
                      placeholder="e.g. 4 yachts, 20 quad bikes..."
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-300">
                    Tell us about your tours &amp; services
                  </span>
                  <textarea
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Describe your signature experiences, operating seasons, and any licensing or safety certifications..."
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#00E5FF]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-4 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-xl shadow-[#00E5FF]/20 transition-all hover:scale-[1.01] hover:shadow-[#00E5FF]/40 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Submit Partner Application</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
