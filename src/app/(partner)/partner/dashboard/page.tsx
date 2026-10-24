'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ship,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  Compass,
} from 'lucide-react';

interface PartnerTour {
  id: string;
  title: string;
  destination: string;
  category: string;
  adultPrice: number;
  durationHours: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  createdAt: string;
}

export default function PartnerDashboardPage() {
  const [tours, setTours] = useState<PartnerTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTours() {
      try {
        const res = await fetch('/api/partner/tours');
        if (res.ok) {
          const data = await res.json();
          setTours(data.tours || []);
        }
      } catch (err) {
        console.error('Error fetching partner tours:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTours();
  }, []);

  const counts = {
    total: tours.length,
    approved: tours.filter((t) => t.status === 'APPROVED').length,
    pending: tours.filter((t) => t.status === 'PENDING_REVIEW').length,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0B1528] via-[#0F1E38] to-[#070F1E] p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
            <Sparkles className="h-3.5 w-3.5" />
            Supplier Collaboration Hub
          </div>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            Welcome to the TALAGO Partner Portal
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Expand your booking reach across 8 international markets. Publish your authentic Egyptian travel experiences, manage inventory, and receive direct guest bookings.
          </p>

          <div className="pt-2">
            <Link
              href="/partner/tours/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00E5FF] px-5 py-3 text-sm font-black text-[#070F1E] transition hover:bg-[#00cbe2] hover:shadow-lg hover:shadow-[#00E5FF]/20"
            >
              <PlusCircle className="h-4 w-4" />
              Submit New Experience
            </Link>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#00E5FF]/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Submitted Tours</span>
            <FileText className="h-4 w-4 text-[#00E5FF]" />
          </div>
          <div className="mt-2 text-3xl font-black text-white">{counts.total}</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live & Active</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-300">{counts.approved}</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-300">{counts.pending}</div>
        </div>
      </div>

      {/* Submitted Tours Section */}
      <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h2 className="text-xl font-black text-white">Your Proposed Experiences</h2>
            <p className="text-xs text-slate-400">
              Experiences submitted through this portal are verified by TALAGO operations before publication.
            </p>
          </div>

          <Link
            href="/partner/tours/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            Submit another <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading your experiences...</div>
          ) : tours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ship className="h-12 w-12 text-slate-600" />
              <h3 className="mt-3 text-base font-bold text-white">No experiences submitted yet</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                You haven&apos;t submitted any tour proposals yet. Get started by publishing your first package.
              </p>
              <Link
                href="/partner/tours/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Create Tour Proposal
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {tours.map((tour) => (
                <div key={tour.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{tour.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          tour.status === 'APPROVED'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {tour.status === 'APPROVED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {tour.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Compass className="h-3 w-3 text-slate-500" />
                        {tour.destination}
                      </span>
                      <span>•</span>
                      <span>{tour.category}</span>
                      <span>•</span>
                      <span>{tour.durationHours} hours</span>
                      <span>•</span>
                      <span className="font-bold text-[#00E5FF]">${tour.adultPrice} / person</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Submitted on {new Date(tour.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guidelines & Quality Standards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-[#0B1528]/60 p-6 space-y-2">
          <div className="text-sm font-black text-white">1. Authentic Photography</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload genuine, high-resolution photos of your boats, vehicles, and destinations. Avoid heavily watermarked stock images.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B1528]/60 p-6 space-y-2">
          <div className="text-sm font-black text-white">2. Transparent Inclusions</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clearly indicate what is included (hotel transfers, buffet lunch, snorkeling gear, national park fees) to minimize guest inquiries.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B1528]/60 p-6 space-y-2">
          <div className="text-sm font-black text-white">3. Punctual Dispatch</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maintain high guest review scores by honoring scheduled hotel pickup windows and providing professional multilingual tour guides.
          </p>
        </div>
      </div>
    </div>
  );
}
