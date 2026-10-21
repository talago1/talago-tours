'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ship,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Compass,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';

const EGYPT_DESTINATIONS = [
  'Hurghada',
  'Sharm El Sheikh',
  'Marsa Alam',
  'Luxor',
  'Aswan',
  'Cairo',
  'Alexandria',
  'El Gouna',
  'Makadi Bay',
  'Sahl Hasheesh',
  'Soma Bay',
  'Safaga',
  'Fayoum',
  'Siwa Oasis',
  'El Alamein',
];

const CATEGORIES = [
  'Sea & Snorkeling Trips',
  'Desert Safari & Quad Biking',
  'Historical & Cultural Day Tours',
  'Scuba Diving & Marine Parks',
  'Spa & Hammam Wellness',
  'Private Yacht Charters',
  'Family & Entertainment',
];

export default function NewPartnerTourPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    destination: 'Hurghada',
    category: 'Sea & Snorkeling Trips',
    durationHours: 6,
    adultPrice: 35,
    childPrice: 20,
    pickupHub: 'Hurghada / Makadi / El Gouna',
    description: '',
    highlights: '',
    inclusions: 'Hotel pickup & drop-off, Snorkel equipment, Buffet lunch, Soft drinks, English guide',
    exclusions: 'National park environmental fee ($5), Personal expenses, Professional photographer tips',
    operatorNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!form.title || !form.description) {
        throw new Error('Please fill in tour title and description.');
      }

      const res = await fetch('/api/partner/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit experience proposal');
      }

      router.push('/partner/dashboard?submitted=true');
    } catch (err: any) {
      setError(err.message || 'Error submitting tour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
          <Sparkles className="h-3.5 w-3.5" />
          Catalog Expansion Proposal
        </div>
        <h1 className="text-3xl font-black text-white">Submit New Experience Proposal</h1>
        <p className="text-sm text-slate-400">
          Provide complete itinerary, pricing, and logistical details. Our operations team reviews all submissions within 24 hours.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-10">
        {/* Core Setup */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white">1. Core Information</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Experience Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Orange Bay Island Luxury Speedboat & Snorkeling Expedition"
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Destination <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
              >
                {EGYPT_DESTINATIONS.map((dest) => (
                  <option key={dest} value={dest}>
                    {dest}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Duration */}
        <div className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-lg font-black text-white">2. Duration & Pricing Tiers</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Duration (Hours) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="72"
                required
                value={form.durationHours}
                onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Adult Price ($ USD) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="5"
                required
                value={form.adultPrice}
                onChange={(e) => setForm({ ...form, adultPrice: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Child Price ($ USD)
              </label>
              <input
                type="number"
                min="0"
                value={form.childPrice}
                onChange={(e) => setForm({ ...form, childPrice: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hotel Pickup Zones Covered
            </label>
            <input
              type="text"
              value={form.pickupHub}
              onChange={(e) => setForm({ ...form, pickupHub: e.target.value })}
              placeholder="e.g. Hurghada, Sahl Hasheesh, Makadi Bay, El Gouna"
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>
        </div>

        {/* Itinerary & Description */}
        <div className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-lg font-black text-white">3. Experience Details & Inclusions</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overview Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the journey, vessel specifications, stops, meals, and experience highlights..."
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Key Highlights (one per line)
            </label>
            <textarea
              rows={3}
              value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
              placeholder="• 2 hours relaxing on Orange Bay powdery white sands&#10;• 2 guided snorkeling stops at pristine coral reefs&#10;• Freshly prepared seafood & barbecue buffet lunch onboard"
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                What&apos;s Included
              </label>
              <textarea
                rows={3}
                value={form.inclusions}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-400">
                What&apos;s Not Included
              </label>
              <textarea
                rows={3}
                value={form.exclusions}
                onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/partner/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-3 text-sm font-black text-[#070F1E] transition hover:bg-[#00cbe2] disabled:opacity-50"
          >
            {submitting ? (
              <>Submitting Proposal...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit Experience Proposal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
