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
  Mail,
  Send,
  Users,
  AlertCircle,
  Loader2,
  ShoppingCart,
  RotateCcw,
  Clock,
  Phone,
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
  const [activeTab, setActiveTab] = useState<'codes' | 'newsletter' | 'recovery'>('codes');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Promo code form states
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

  // Newsletter blast states
  const [blastSubject, setBlastSubject] = useState('');
  const [blastBody, setBlastBody] = useState('');
  const [blastPromoCode, setBlastPromoCode] = useState('');
  const [blastPromoDiscount, setBlastPromoDiscount] = useState('');
  const [blastSending, setBlastSending] = useState(false);
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number; total: number; errors?: string[] } | null>(null);
  const [blastError, setBlastError] = useState<string | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Abandoned recovery states
  const [recoveryStats, setRecoveryStats] = useState<{
    total: number;
    recovered: number;
    pendingReminder: number;
    sentReminder: number;
    recoveryRate: number;
  } | null>(null);
  const [abandonedList, setAbandonedList] = useState<any[]>([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [triggeringRecovery, setTriggeringRecovery] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

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

  const fetchRecoveryData = useCallback(async () => {
    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/admin/abandoned-checkouts');
      if (res.ok) {
        const data = await res.json();
        setRecoveryStats(data.stats);
        setAbandonedList(data.checkouts || []);
      }
    } catch {
      // non-fatal
    } finally {
      setRecoveryLoading(false);
    }
  }, []);

  const handleTriggerRecovery = async () => {
    setTriggeringRecovery(true);
    setRecoveryNotice(null);
    try {
      const res = await fetch('/api/admin/abandoned-checkouts', { method: 'POST' });
      const data = await res.json();
      setRecoveryNotice(data.message || 'Recovery run completed.');
      await fetchRecoveryData();
    } catch {
      setRecoveryNotice('Failed to trigger recovery run.');
    } finally {
      setTriggeringRecovery(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchRecoveryData();
    // Fetch subscriber count for the newsletter tab
    fetch('/api/admin/newsletter/blast')
      .then((r) => r.json())
      .then((d) => setSubscriberCount(d.activeSubscribers ?? null))
      .catch(() => {});
  }, [fetchCampaigns, fetchRecoveryData]);

  const handleBlast = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setBlastError(null);
    setBlastResult(null);
    setBlastSending(true);
    try {
      const res = await fetch('/api/admin/newsletter/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: blastSubject,
          html: blastBody,
          promoCode: blastPromoCode || undefined,
          promoDiscount: blastPromoDiscount || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send newsletter');
      setBlastResult(data);
    } catch (err) {
      setBlastError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBlastSending(false);
    }
  }, [blastSubject, blastBody, blastPromoCode, blastPromoDiscount]);

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

        {/* Tab Switcher */}
        <div className="mb-8 flex gap-2 border-b border-white/10 pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'codes'
                ? 'border-b-2 border-[#EAB308] text-[#EAB308]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
            Promo Codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('newsletter')}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'newsletter'
                ? 'border-b-2 border-[#06B6D4] text-[#06B6D4]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" />
            Newsletter Blast
            {subscriberCount !== null && (
              <span className="ml-1 rounded-full bg-[#06B6D4]/20 px-2 py-0.5 text-[10px] font-black text-[#06B6D4]">
                {subscriberCount} subs
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'recovery'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart Recovery
            {recoveryStats?.pendingReminder ? (
              <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300">
                {recoveryStats.pendingReminder} pending
              </span>
            ) : null}
          </button>
        </div>

        {/* Newsletter Blast Panel */}
        {activeTab === 'newsletter' && (
          <div className="mb-8 space-y-6">
            {/* Stats */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#06B6D4]/20 bg-[#06B6D4]/5 px-6 py-4">
              <Users className="h-8 w-8 text-[#06B6D4] shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#06B6D4]">Active Subscribers</p>
                <p className="text-3xl font-black text-white">{subscriberCount ?? '—'}</p>
                <p className="text-xs text-slate-500">Opted-in newsletter subscribers who will receive this blast</p>
              </div>
            </div>

            {/* Result banner */}
            {blastResult && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-black text-emerald-300">
                  ✓ Newsletter sent — {blastResult.sent} delivered, {blastResult.failed} failed out of {blastResult.total}
                </p>
                {blastResult.errors && blastResult.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red-300">
                    {blastResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                )}
              </div>
            )}
            {blastError && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{blastError}</p>
              </div>
            )}

            {/* Compose form */}
            <form onSubmit={handleBlast} className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 space-y-5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#06B6D4]" />
                Compose Newsletter
              </h3>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={blastSubject}
                  onChange={(e) => setBlastSubject(e.target.value)}
                  placeholder="e.g. Exclusive Flash Sale — 20% Off All Egypt Tours This Weekend"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Body (HTML or plain text) *
                </label>
                <textarea
                  required
                  minLength={20}
                  rows={8}
                  value={blastBody}
                  onChange={(e) => setBlastBody(e.target.value)}
                  placeholder={"<h2>Explore Egypt like never before</h2>\n<p>We have incredible new tours just for you...</p>"}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4] resize-y"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Supports HTML. Your content will be wrapped in the TALAGO branded email template automatically.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">Optional: Attach Promo Code</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={blastPromoCode}
                      onChange={(e) => setBlastPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SUMMER20"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 font-mono text-sm uppercase text-[#00E5FF] outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Discount Label</label>
                    <input
                      type="text"
                      value={blastPromoDiscount}
                      onChange={(e) => setBlastPromoDiscount(e.target.value)}
                      placeholder="e.g. 20% off all tours"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
                    />
                  </div>
                </div>
                {blastPromoCode && (
                  <p className="text-[11px] text-slate-500">
                    A styled promo block with a 1-click auto-apply link will be embedded in the email body.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <p className="text-xs text-slate-500">
                  {subscriberCount !== null ? `Will be sent to ${subscriberCount} subscribers.` : 'Loading subscriber count...'}
                </p>
                <button
                  type="submit"
                  disabled={blastSending || !blastSubject || !blastBody}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#06B6D4] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:bg-[#22D3EE] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {blastSending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send Newsletter</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Abandoned Cart Recovery Panel */}
        {activeTab === 'recovery' && (
          <div className="mb-8 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Total Abandoned</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-amber-400">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-white">{recoveryStats?.total ?? '—'}</p>
                <p className="mt-1 text-xs text-slate-500">Uncompleted checkout sessions</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Recovered Rate</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-emerald-400">{recoveryStats?.recoveryRate ?? 0}%</p>
                <p className="mt-1 text-xs text-slate-500">{recoveryStats?.recovered ?? 0} bookings recovered</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Reminders Sent</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                    <Send className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-[#00E5FF]">{recoveryStats?.sentReminder ?? '—'}</p>
                <p className="mt-1 text-xs text-slate-500">Dispatched via Email &amp; WhatsApp</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending Follow-up</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-amber-400">{recoveryStats?.pendingReminder ?? '—'}</p>
                <p className="mt-1 text-xs text-slate-500">Awaiting automated recovery</p>
              </div>
            </div>

            {/* Notice / Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-emerald-400" />
                  Automated Cart Recovery Engine
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-xl">
                  Dispatches branded recovery emails with direct resume links and WhatsApp reminders to leads older than 30 minutes. Runs automatically via cron, or trigger manually below.
                </p>
                {recoveryNotice && (
                  <p className="mt-2 text-xs font-bold text-emerald-300">✓ {recoveryNotice}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleTriggerRecovery}
                disabled={triggeringRecovery}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 shrink-0"
              >
                {triggeringRecovery ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Send className="h-4 w-4" /> Run Recovery Now</>
                )}
              </button>
            </div>

            {/* Recent Abandoned Sessions Table */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h4 className="text-sm font-black text-white">Recent Abandoned Checkouts</h4>
                <button
                  type="button"
                  onClick={fetchRecoveryData}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${recoveryLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-[#070F1E] text-xs uppercase tracking-[0.18em] text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Tour Experience</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Travel Date</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {recoveryLoading && abandonedList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                            <span>Loading abandoned checkouts...</span>
                          </div>
                        </td>
                      </tr>
                    ) : abandonedList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          No abandoned checkouts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      abandonedList.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 font-bold text-white">
                            {entry.name}
                            <span className="block text-xs font-normal text-slate-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-200">
                            {entry.tourTitle || entry.tourId}
                            <span className="block text-xs text-slate-500">{entry.guestCount} guest(s)</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">
                            <div>{entry.phone}</div>
                            {entry.email && <div className="text-slate-500">{entry.email}</div>}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-300">
                            {entry.travelDate || '—'}
                          </td>
                          <td className="px-6 py-4">
                            {entry.isRecovered ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" /> Recovered
                              </span>
                            ) : entry.reminderSent ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-2.5 py-1 text-xs font-bold text-[#00E5FF]">
                                <Send className="h-3 w-3" /> Reminder Sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                                <Clock className="h-3 w-3" /> Pending Follow-up
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* KPI Summary Cards — shown only on codes tab */}
        {activeTab === 'codes' && (
          <>
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
          </>
        )}
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
