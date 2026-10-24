'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Percent,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency: string;
  minBookingValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [minBookingValue, setMinBookingValue] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setIsSubmitting(true);

      try {
        const res = await fetch('/api/admin/campaigns/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: parseFloat(discountValue),
            currency,
            minBookingValue: parseFloat(minBookingValue || '0'),
            maxUses: parseInt(maxUses, 10),
            expiresAt: new Date(expiresAt + 'T23:59:59Z').toISOString(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to create campaign');
        }

        setCampaigns((prev) => [data.data, ...prev]);
        setShowModal(false);

        // Reset form
        setCode('');
        setDiscountType('PERCENTAGE');
        setDiscountValue('');
        setMinBookingValue('');
        setMaxUses('100');
        setExpiresAt('');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    },
    [code, discountType, discountValue, currency, minBookingValue, maxUses, expiresAt]
  );

  const handleToggleActive = useCallback(async (id: string, current: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data.data } : c)));
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this campaign?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleCopyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCopyUrl = (c: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://talago-tours.com';
    const url = `${origin}/tours?promo=${encodeURIComponent(c)}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(c);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // KPIs
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => {
    const isExpired = new Date() > new Date(c.expiresAt);
    const isFullyUsed = c.usedCount >= c.maxUses;
    return c.isActive && !isExpired && !isFullyUsed;
  }).length;
  const totalRedemptions = campaigns.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            <Link href="/admin" className="hover:text-[#06B6D4] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#EAB308]">Marketing & Campaigns</span>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">
                Growth Engine
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-5xl">
                Promo Code Campaigns
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Launch voucher discounts, flash sales, partner affiliate codes, and track redemption metrics in real time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#EAB308] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-xl shadow-[#EAB308]/20 transition-all hover:bg-[#FFE55C]"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0B1528] px-5 py-3 text-sm font-black text-slate-200 transition-all hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Total Codes
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#00E5FF]">
                <Tag className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-white">{totalCampaigns}</p>
            <p className="mt-1 text-xs text-slate-500">Configured campaigns</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Active & Live
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-400">{activeCampaigns}</p>
            <p className="mt-1 text-xs text-slate-500">Ready to redeem at checkout</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Total Redemptions
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAB308]/10 text-[#EAB308]">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-[#FFD700]">{totalRedemptions}</p>
            <p className="mt-1 text-xs text-slate-500">Bookings with applied promo</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Shareable Links
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                <Share2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-base font-black text-white">1-Click Auto Apply</p>
            <p className="mt-1 text-xs text-slate-400">Links embed code into checkout</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Campaigns Table */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-[#070F1E] text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Discount Value</th>
                  <th className="px-6 py-4">Min Order</th>
                  <th className="px-6 py-4">Redemptions</th>
                  <th className="px-6 py-4">Valid Until</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                        <span>Loading campaign inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                      No promo campaigns found. Click &quot;Create Campaign&quot; to launch your first code.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const isExpired = new Date() > new Date(c.expiresAt);
                    const isFullyUsed = c.usedCount >= c.maxUses;
                    const isEffectivelyActive = c.isActive && !isExpired && !isFullyUsed;

                    const displayStatus = !c.isActive
                      ? 'DEACTIVATED'
                      : isExpired
                      ? 'EXPIRED'
                      : isFullyUsed
                      ? 'EXHAUSTED'
                      : 'ACTIVE';

                    const usagePercentage = Math.min(100, Math.round((c.usedCount / c.maxUses) * 100));
                    const isActioning = actionLoading === c.id;

                    return (
                      <tr
                        key={c.id}
                        className={`text-slate-300 transition-colors hover:bg-white/[0.02] ${
                          isActioning ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1.5 font-mono text-sm font-black text-[#00E5FF] uppercase tracking-wider">
                              {c.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(c.code)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === c.code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(c.code)}
                              className="rounded-lg p-1.5 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                              title="Copy shareable direct promo link"
                            >
                              {copiedUrl === c.code ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Share2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {c.discountType === 'PERCENTAGE' ? (
                            <span className="text-[#FFD700] text-base">{c.discountValue}% OFF</span>
                          ) : (
                            <span className="text-[#FFD700] text-base">
                              {c.currency} {c.discountValue} OFF
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {c.minBookingValue > 0 ? (
                            `${c.currency} ${c.minBookingValue}`
                          ) : (
                            <span className="italic text-slate-600">No minimum</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-slate-400">
                              <span>{c.usedCount} used</span>
                              <span>{c.maxUses} max</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  usagePercentage >= 100
                                    ? 'bg-red-500'
                                    : usagePercentage >= 75
                                    ? 'bg-[#EAB308]'
                                    : 'bg-[#00E5FF]'
                                }`}
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                          {new Date(c.expiresAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                              isEffectivelyActive
                                ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                                : displayStatus === 'DEACTIVATED'
                                ? 'bg-slate-700/30 text-slate-400 border border-white/10'
                                : 'bg-red-400/10 text-red-300 border border-red-400/20'
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(c.id, c.isActive)}
                              disabled={isActioning}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              {c.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              disabled={isActioning}
                              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500 hover:text-[#070F1E] transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#EAB308]" />
                Launch New Promo Campaign
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormError(null);
                }}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20, VIPGIFT, TALAGO15"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 font-mono text-sm uppercase text-[#00E5FF] outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15 for 15%' : 'e.g. 25 for $25'}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Min Booking Spend ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={minBookingValue}
                    onChange={(e) => setMinBookingValue(e.target.value)}
                    placeholder="0 (No minimum)"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Maximum Uses *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  required
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#EAB308] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:bg-[#FFE55C] disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Activate Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
