'use client';

import { useState, useEffect, useCallback } from 'react';

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

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [minBookingValue, setMinBookingValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
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
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
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
      setMaxUses('');
      setExpiresAt('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [code, discountType, discountValue, currency, minBookingValue, maxUses, expiresAt]);

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
      // silently fail — user can retry
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silently fail — user can retry
    } finally {
      setActionLoading(null);
    }
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="mb-2 text-sm text-gray-500">
            <a href="/admin" className="hover:text-gray-700">Dashboard</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Campaigns</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Promo Code Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount campaigns. Codes are automatically uppercased.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#FF5B00] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E55200]"
        >
          + Create Campaign
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF5B00]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Discount</th>
                <th className="px-6 py-3 font-semibold">Min Spend</th>
                <th className="px-6 py-3 font-semibold">Usage / Limit</th>
                <th className="px-6 py-3 font-semibold">Expires</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No promo code campaigns yet. Click &quot;Create Campaign&quot; to get started.
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
                    <tr key={c.id} className={`hover:bg-gray-50 ${isActioning ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 uppercase tracking-wide">
                        {c.code}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {c.discountType === 'PERCENTAGE'
                          ? <span className="text-[#FF5B00]">{c.discountValue}% off</span>
                          : <span className="text-[#FF5B00]">{c.currency} {c.discountValue} off</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.minBookingValue > 0
                          ? `${c.currency} ${c.minBookingValue}`
                          : <span className="text-gray-400 italic">None</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-40">
                          <div className="flex justify-between text-xs font-medium text-gray-500">
                            <span>{c.usedCount} used</span>
                            <span>{c.maxUses} max</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                usagePercentage >= 100
                                  ? 'bg-red-500'
                                  : usagePercentage >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-[#FF5B00]'
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(c.expiresAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isEffectivelyActive
                              ? 'bg-[#00473F]/10 text-[#00473F]'
                              : displayStatus === 'DEACTIVATED'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(c.id, c.isActive)}
                            disabled={isActioning}
                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={isActioning}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Promo Campaign</h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); setFormError(null); }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="promoCode"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                />
                <p className="mt-1 text-xs text-gray-400">Letters, numbers, hyphens, underscores only</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={discountType === 'PERCENTAGE' ? 100 : undefined}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 100'}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="minBookingValue" className="block text-sm font-medium text-gray-700">
                    Min Booking Spend
                  </label>
                  <input
                    id="minBookingValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minBookingValue}
                    onChange={(e) => setMinBookingValue(e.target.value)}
                    placeholder="0 = no minimum"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
                    Max Uses <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="maxUses"
                    type="number"
                    min="1"
                    required
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="e.g. 500"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  />
                </div>

                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="expiresAt"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#FF5B00] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E55200] disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
