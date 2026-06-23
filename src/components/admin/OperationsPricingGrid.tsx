'use client';

import { useState, useEffect, useCallback } from 'react';

interface TourPricing {
  id: string;
  slug: string;
  translations: Record<string, { title?: string }>;
  adultPrice: number;
  childPrice: number | null;
  childMinAge: number | null;
  childMaxAge: number | null;
  infantPrice: number | null;
  infantMinAge: number | null;
  infantMaxAge: number | null;
  ageRestrictionsNotes: string | null;
}

function getTitle(t: TourPricing['translations']): string {
  return t?.en?.title || t?.de?.title || 'Untitled';
}

type PendingState = Record<string, 'saving' | 'saved' | 'error'>;

export default function OperationsPricingGrid() {
  const [tours, setTours] = useState<TourPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingState>({});
  const [edits, setEdits] = useState<Record<string, Partial<TourPricing>>>({});

  useEffect(() => {
    fetch('/api/admin/operations/pricing')
      .then((r) => r.json())
      .then((data) => { setTours(data.tours ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateField = useCallback((tourId: string, field: string, value: unknown) => {
    setEdits((prev) => ({ ...prev, [tourId]: { ...prev[tourId], [field]: value } }));
  }, []);

  const saveTour = useCallback(async (tourId: string) => {
    const pricing = edits[tourId];
    if (!pricing) return;

    setPending((prev) => ({ ...prev, [tourId]: 'saving' }));
    try {
      const res = await fetch('/api/admin/operations/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId, pricing }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTours((prev) => prev.map((t) => (t.id === tourId ? data.tour : t)));
      setEdits((prev) => { const { [tourId]: _, ...rest } = prev; return rest; });
      setPending((prev) => ({ ...prev, [tourId]: 'saved' }));
      setTimeout(() => setPending((prev) => { const { [tourId]: _, ...rest } = prev; return rest; }), 2000);
    } catch {
      setPending((prev) => ({ ...prev, [tourId]: 'error' }));
    }
  }, [edits]);

  const hasEdits = (tourId: string) => edits[tourId] && Object.keys(edits[tourId]).length > 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Pricing & Age Tiers</h2>
          <p className="text-xs text-slate-500 mt-1">Manage child and infant pricing across all tours</p>
        </div>
        <span className="text-xs text-slate-400 bg-white/5 rounded-full px-3 py-1">{tours.length} tours</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.15em] text-slate-500 border-b border-white/10">
            <tr>
              <th className="px-3 py-3 min-w-[180px]">Tour</th>
              <th className="px-3 py-3 text-center" colSpan={4}>Child</th>
              <th className="px-3 py-3 text-center" colSpan={4}>Infant</th>
              <th className="px-3 py-3"></th>
            </tr>
            <tr className="text-[10px] text-slate-600 border-b border-white/5">
              <th></th>
              <th className="px-2 py-1">Price</th>
              <th className="px-2 py-1">Min Age</th>
              <th className="px-2 py-1">Max Age</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1">Price</th>
              <th className="px-2 py-1">Min Age</th>
              <th className="px-2 py-1">Max Age</th>
              <th className="px-2 py-1"></th>
              <th className="px-2 py-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tours.map((tour) => {
              const edit = edits[tour.id] || {};
              const status = pending[tour.id];
              const dirty = hasEdits(tour.id);

              const childPrice = (edit.childPrice ?? tour.childPrice ?? 0) as number;
              const childMinAge = (edit.childMinAge ?? tour.childMinAge ?? 3) as number;
              const childMaxAge = (edit.childMaxAge ?? tour.childMaxAge ?? 11) as number;
              const infantPrice = (edit.infantPrice ?? tour.infantPrice ?? 0) as number;
              const infantMinAge = (edit.infantMinAge ?? tour.infantMinAge ?? 0) as number;
              const infantMaxAge = (edit.infantMaxAge ?? tour.infantMaxAge ?? 2) as number;

              return (
                <tr key={tour.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-3 font-medium text-white truncate max-w-[200px]" title={getTitle(tour.translations)}>
                    {getTitle(tour.translations)}
                  </td>

                  {/* Child */}
                  <td className="px-2 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={childPrice}
                      onChange={(e) => updateField(tour.id, 'childPrice', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                      placeholder="0 = disabled"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="number" min="0"
                      value={childMinAge}
                      onChange={(e) => updateField(tour.id, 'childMinAge', parseInt(e.target.value) || 0)}
                      className="w-14 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="number" min="0"
                      value={childMaxAge}
                      onChange={(e) => updateField(tour.id, 'childMaxAge', parseInt(e.target.value) || 0)}
                      className="w-14 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                  </td>
                  <td className="px-2 py-3"></td>

                  {/* Infant */}
                  <td className="px-2 py-3">
                    <input
                      type="number" step="0.01" min="0"
                      value={infantPrice}
                      onChange={(e) => updateField(tour.id, 'infantPrice', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                      placeholder="0 = disabled"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="number" min="0"
                      value={infantMinAge}
                      onChange={(e) => updateField(tour.id, 'infantMinAge', parseInt(e.target.value) || 0)}
                      className="w-14 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="number" min="0"
                      value={infantMaxAge}
                      onChange={(e) => updateField(tour.id, 'infantMaxAge', parseInt(e.target.value) || 0)}
                      className="w-14 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                  </td>
                  <td className="px-2 py-3"></td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-right">
                    {status === 'saving' && (
                      <span className="text-xs text-slate-400">Saving...</span>
                    )}
                    {status === 'saved' && (
                      <span className="text-xs text-emerald-400">Saved</span>
                    )}
                    {status === 'error' && (
                      <span className="text-xs text-red-400">Error</span>
                    )}
                    {dirty && !status && (
                      <button
                        onClick={() => saveTour(tour.id)}
                        className="text-xs font-bold bg-[#00E5FF] text-[#070F1E] px-3 py-1.5 rounded-lg hover:bg-[#00D4F0] transition-colors"
                      >
                        Save
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {tours.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-slate-500">No tours found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
