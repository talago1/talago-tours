'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  XCircle,
  Layers,
  Database
} from 'lucide-react';

interface MatchItem {
  source: string;
  sourceUrl: string;
  sourceName: string;
  destination: string;
  category: string;
  duration: string;
  priceFrom: number;
  currency: string;
  classification: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence: number;
  matchedTourSlug: string | null;
  matchedTourTitle: string | null;
  matchReasons: string[];
  suggestedAction: string;
}

interface Summary {
  A: number;
  B: number;
  C: number;
  D: number;
  E?: number;
  F: number;
}

interface InitialData {
  summary: Summary;
  totalSourceTours: number;
  totalTalagoTours: number;
  generatedAt: string;
  results: MatchItem[];
}

export default function ImportReviewClient({ initialData }: { initialData: InitialData }) {
  const [items, setItems] = useState<MatchItem[]>(initialData.results);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = items.filter((item) => {
    const matchesClass = selectedClass === 'ALL' || item.classification === selectedClass;
    const matchesSource = selectedSource === 'ALL' || item.source.toLowerCase() === selectedSource.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      item.sourceName.toLowerCase().includes(query) ||
      (item.destination && item.destination.toLowerCase().includes(query)) ||
      (item.matchedTourTitle && item.matchedTourTitle.toLowerCase().includes(query));
    return matchesClass && matchesSource && matchesSearch;
  });

  const handleAction = async (item: MatchItem, action: 'update-existing' | 'create-draft' | 'ignore') => {
    setProcessingId(item.sourceUrl);
    try {
      if (action === 'ignore') {
        setItems((prev) => prev.filter((i) => i.sourceUrl !== item.sourceUrl));
        showToast(`Ignored "${item.sourceName}"`);
        return;
      }

      const res = await fetch('/api/admin/tours/import-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, item }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      if (action === 'update-existing') {
        showToast(`Updated existing tour: ${data.tour?.slug}`);
      } else if (action === 'create-draft') {
        showToast(`Created DRAFT experience: ${data.tour?.slug} (pending review)`);
      }

      // Remove from active list
      setItems((prev) => prev.filter((i) => i.sourceUrl !== item.sourceUrl));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchUpdateA = async () => {
    const classA = items.filter((i) => i.classification === 'A');
    if (classA.length === 0) {
      alert('No Class A (Strong Match) tours remaining to reconcile.');
      return;
    }

    if (!confirm(`Are you sure you want to reconcile ${classA.length} high-confidence tours? Existing prices will NOT be overwritten.`)) {
      return;
    }

    for (const item of classA) {
      await handleAction(item, 'update-existing');
    }
    showToast(`Successfully reconciled high-confidence tours.`);
  };

  const getClassBadge = (cls: string) => {
    switch (cls) {
      case 'A':
        return <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-400">Class A · Strong Match</span>;
      case 'B':
        return <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-black text-amber-400">Class B · Likely Match</span>;
      case 'C':
        return <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-xs font-black text-[#00E5FF]">Class C · New Candidate</span>;
      case 'D':
        return <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-xs font-black text-purple-400">Class D · Destination Gap</span>;
      default:
        return <span className="rounded-full bg-slate-500/20 border border-slate-500/40 px-2.5 py-0.5 text-xs font-black text-slate-400">Class {cls}</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('marsa')) return <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">Marsa Waves</span>;
    if (s.includes('egyptgate')) return <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">Egypt Gate</span>;
    if (s.includes('albatros')) return <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">Albatros</span>;
    if (s.includes('hurghada')) return <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">Hurghada For You</span>;
    return <span className="rounded bg-slate-500/20 px-2 py-0.5 text-[10px] font-bold text-slate-300">{source}</span>;
  };

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Navigation & Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/tours"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-[#00E5FF] transition mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Tour Library
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                Master Catalog Reconciliation
              </h1>
              <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400">
                Data Quality & Consolidation
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl">
              Cross-reconcile operational information from 4 external suppliers against TALAGO&apos;s active catalog.
              Update existing tours with missing verified facts or stage new unique experiences as DRAFT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleBatchUpdateA}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-3 text-xs font-black uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/30 transition shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="h-4 w-4" />
              Reconcile All Class A ({initialData.summary.A})
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Evaluated</span>
              <Database className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-black text-white">{initialData.totalSourceTours}</p>
            <p className="text-[10px] text-slate-500 mt-1">4 external sources</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Class A</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-emerald-300">{initialData.summary.A}</p>
            <p className="text-[10px] text-emerald-500/80 mt-1">Strong Match (≥80%)</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Class B</span>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-amber-300">{initialData.summary.B}</p>
            <p className="text-[10px] text-amber-500/80 mt-1">Likely Match (60–79%)</p>
          </div>

          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] p-4">
            <div className="flex items-center justify-between text-sky-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Class C</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-[#00E5FF]">{initialData.summary.C}</p>
            <p className="text-[10px] text-sky-500/80 mt-1">New Candidate Tours</p>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-4">
            <div className="flex items-center justify-between text-purple-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Class D</span>
              <MapPin className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-purple-300">{initialData.summary.D}</p>
            <p className="text-[10px] text-purple-500/80 mt-1">Destination Gaps</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tour name, destination, or matched TALAGO tour..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#070F1E]/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#070F1E]/80 px-4 py-3 text-sm font-bold text-slate-300 outline-none focus:border-[#00E5FF]"
            >
              <option value="ALL">All Classifications</option>
              <option value="A">Class A · Strong Matches ({initialData.summary.A})</option>
              <option value="B">Class B · Likely Matches ({initialData.summary.B})</option>
              <option value="C">Class C · New Candidates ({initialData.summary.C})</option>
              <option value="D">Class D · Destination Gaps ({initialData.summary.D})</option>
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#070F1E]/80 px-4 py-3 text-sm font-bold text-slate-300 outline-none focus:border-[#00E5FF]"
            >
              <option value="ALL">All Sources</option>
              <option value="egyptgate">Egypt Gate (421)</option>
              <option value="marsawaves">Marsa Waves (178)</option>
              <option value="albatros">Albatros for Tours (185)</option>
              <option value="hurghadaforyou">Hurghada For You (55)</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>
              Showing <strong className="text-white">{filtered.length}</strong> items
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Safe reconciliation: zero price overwrites, draft-only creation, full audit log</span>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
              <Layers className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-base font-bold text-white">No tours match your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the classification or search terms.</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isWorking = processingId === item.sourceUrl;
              return (
                <article
                  key={`${item.source}-${idx}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#00E5FF]/30"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Source Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getSourceBadge(item.source)}
                        {getClassBadge(item.classification)}
                        <span className="flex items-center gap-1 text-xs text-[#00E5FF]">
                          <MapPin className="h-3 w-3" />
                          {item.destination}
                        </span>
                        {item.duration && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {item.duration}
                          </span>
                        )}
                        {item.priceFrom > 0 && (
                          <span className="text-xs font-black text-[#FFD700]">
                            {item.priceFrom} {item.currency}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-white hover:text-[#00E5FF] transition">
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                          {item.sourceName}
                          <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                        </a>
                      </h3>

                      {/* Match Information */}
                      {item.matchedTourTitle ? (
                        <div className="mt-2.5 rounded-xl border border-white/10 bg-[#070F1E]/60 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">Matched TALAGO Tour:</span>
                              <strong className="text-white">{item.matchedTourTitle}</strong>
                            </div>
                            <span className="font-mono font-bold text-emerald-400 shrink-0">
                              {item.confidence}% Match
                            </span>
                          </div>
                          {item.matchReasons.length > 0 && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Reasons: {item.matchReasons.join(' · ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500 italic">
                          No existing TALAGO experience matched. This is a potential new tour candidate.
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t border-white/5 lg:border-t-0">
                      {(item.classification === 'A' || item.classification === 'B') && item.matchedTourSlug && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleAction(item, 'update-existing')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2.5 text-xs font-black text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                          Update Existing
                        </button>
                      )}

                      {(item.classification === 'C' || item.classification === 'D') && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleAction(item, 'create-draft')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 px-4 py-2.5 text-xs font-black text-[#00E5FF] hover:bg-sky-500/30 transition disabled:opacity-50"
                        >
                          <PlusCircle className={`h-3.5 w-3.5 ${isWorking ? 'animate-spin' : ''}`} />
                          Create as Draft
                        </button>
                      )}

                      <button
                        disabled={isWorking}
                        onClick={() => handleAction(item, 'ignore')}
                        className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                        title="Dismiss from review"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Ignore
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-[#070F1E] px-5 py-3 text-sm font-bold text-emerald-300 shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
