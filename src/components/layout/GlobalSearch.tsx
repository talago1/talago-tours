'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface SearchResult {
  id: string;
  type: 'tour' | 'destination';
  title: string;
  subtitle?: string;
  href: string;
  price?: number;
}

export default function GlobalSearch() {
  const { dict } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/public/tours?search=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const tours: SearchResult[] = (data.tours || data.items || []).map((t: any) => {
        const titleEn =
          t.title ||
          (typeof t.translations === 'object' && t.translations !== null
            ? (t.translations as any)?.en?.title
            : null) ||
          'Tour';
        const destName = t.destination?.name || '';
        return {
          id: t.id,
          type: 'tour' as const,
          title: titleEn,
          subtitle: destName ? `${destName} · ${t.durationHours ? `${t.durationHours}h` : ''}` : undefined,
          href: `/tours/${t.slug}`,
          price: t.adultPrice || t.basePriceUSD || t.basePrice,
        };
      });
      setResults(tours);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      router.push(`/tours?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl p-2 text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
        aria-label="Search"
        title="Search tours &amp; destinations"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-[360px] rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/60 backdrop-blur-xl sm:w-[420px]">
          {/* Search Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <Search className={`h-4 w-4 shrink-0 transition-colors ${loading ? 'text-[#00E5FF] animate-pulse' : 'text-slate-500'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search tours, destinations…"
              className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* Results */}
          {query.trim().length > 0 && (
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {loading && results.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-slate-400">No results for <span className="text-white font-medium">&ldquo;{query}&rdquo;</span></p>
                  <p className="mt-1 text-xs text-slate-500">Try a different keyword or browse all tours</p>
                </div>
              ) : (
                <>
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                        {r.type === 'destination' ? <MapPin className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{r.title}</p>
                        {r.subtitle && <p className="truncate text-xs text-slate-500">{r.subtitle}</p>}
                      </div>
                      {r.price != null && r.price > 0 && (
                        <span className="shrink-0 text-xs font-bold text-[#00E5FF]">
                          ${r.price}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Footer action */}
          {query.trim().length >= 2 && (
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <button
                type="button"
                onClick={handleSubmit as any}
                className="flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span>See all results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Empty state suggestion */}
          {query.trim().length === 0 && (
            <div className="px-4 py-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Quick links</p>
              <div className="flex flex-wrap gap-1.5">
                {['Snorkeling', 'Hurghada', 'Diving', 'Safari', 'Sharm El Sheikh'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleChange(s)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-[#00E5FF]/30 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
