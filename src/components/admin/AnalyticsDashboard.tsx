'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { ExecutiveDashboardStats, TourPerformanceItem } from '@/types/analytics';
import AnalyticsTimeFilters from './AnalyticsTimeFilters';

const CHANNEL_LABELS: Record<string, string> = {
  VIATOR: 'Viator',
  GETYOURGUIDE: 'GetYourGuide',
  WHATSAPP: 'WhatsApp',
  HOTEL_DIRECT: 'Hotel Direct',
  WEBSITE: 'Website',
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 h-3 w-24 animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-7 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
    </div>
  );
}

function MetricCard({
  label,
  primaryValue,
  secondaryValue,
  accent = false,
  badge,
}: {
  label: string;
  primaryValue: string;
  secondaryValue?: string;
  accent?: boolean;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {badge && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            {badge}
          </span>
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-[#FF5B00]' : 'text-gray-900'}`}>
        {primaryValue}
      </p>
      {secondaryValue && (
        <p className="mt-0.5 text-sm text-gray-500">{secondaryValue}</p>
      )}
    </div>
  );
}

function ChannelBar({
  label,
  count,
  revenue,
  percentage,
}: {
  label: string;
  count: number;
  revenue: string;
  percentage: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} booking{count !== 1 ? 's' : ''} — {revenue}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#00473F] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<ExecutiveDashboardStats | null>(null);
  const [tourPerformance, setTourPerformance] = useState<TourPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState<string | null>(null);
  const [tourFilter, setTourFilter] = useState('');

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, toursRes] = await Promise.all([
        fetch(`/api/admin/analytics/summary?period=${p}`),
        fetch(`/api/admin/analytics/tours?period=${p}`),
      ]);

      if (!summaryRes.ok) {
        const body = await summaryRes.json().catch(() => null);
        throw new Error(body?.error || `Summary HTTP ${summaryRes.status}`);
      }

      const summaryJson: ExecutiveDashboardStats = await summaryRes.json();
      setData(summaryJson);

      if (toursRes.ok) {
        const toursJson: TourPerformanceItem[] = await toursRes.json();
        setTourPerformance(toursJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const totalBookings = data?.channelBreakdown.reduce((s, c) => s + c._count, 0) ?? 0;

  const filteredTours = useMemo(() => {
    if (!tourFilter.trim()) return tourPerformance;
    const q = tourFilter.toLowerCase();
    return tourPerformance.filter(
      (t) => t.tourTitle.toLowerCase().includes(q) || t.tourSlug.toLowerCase().includes(q)
    );
  }, [tourPerformance, tourFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Executive revenue metrics, verified transactions, and per-tour conversion tracking.
          </p>
        </div>
        <AnalyticsTimeFilters current={period} onChange={setPeriod} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : data ? (
          <>
            <MetricCard
              label="Gross Revenue"
              primaryValue={`$${data.grossRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              secondaryValue={
                data.onlineCapturedRevenueUSD != null && data.onlineCapturedRevenueUSD > 0
                  ? `Online captured: $${data.onlineCapturedRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : `EGP ${data.grossRevenueEGP.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              }
              badge={data.onlineCapturedRevenueUSD != null && data.onlineCapturedRevenueUSD > 0 ? 'Verified Tx' : undefined}
            />
            <MetricCard
              label="Net Profit Margin"
              primaryValue={`$${data.netMarginUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              secondaryValue={`EGP ${data.netMarginEGP.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            />
            <MetricCard
              label="Total Passengers"
              primaryValue={String(data.passengerCount)}
            />
            <MetricCard
              label="Top Tour"
              primaryValue={data.topTourTitle}
              accent
            />
          </>
        ) : null}
      </div>

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
              Channel Attribution
            </h2>
            <div className="space-y-4">
              {data.channelBreakdown.map((ch) => (
                <ChannelBar
                  key={ch.channel}
                  label={CHANNEL_LABELS[ch.channel] || ch.channel}
                  count={ch._count}
                  revenue={`$${ch.totalRevenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  percentage={totalBookings > 0 ? (ch._count / totalBookings) * 100 : 0}
                />
              ))}
            </div>
          </section>

          <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                  Tour Performance Report (TAL-A2)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Leads, confirmed bookings, conversion rate, and revenue by tour.
                </p>
              </div>
              <input
                type="text"
                placeholder="Filter by tour title..."
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                className="w-full sm:w-56 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-[#00473F] focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="py-2.5 pr-3 font-semibold">Tour</th>
                    <th className="py-2.5 pr-3 font-semibold text-center">Leads</th>
                    <th className="py-2.5 pr-3 font-semibold text-center">Bookings</th>
                    <th className="py-2.5 pr-3 font-semibold text-center">Conversion</th>
                    <th className="py-2.5 pr-3 font-semibold text-right">Revenue</th>
                    <th className="py-2.5 text-right font-semibold">Pax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTours.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No tour activity recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredTours.slice(0, 15).map((t) => (
                      <tr key={t.tourId} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 pr-3 font-medium text-gray-900 max-w-[220px] truncate">
                          <Link
                            href={`/admin/tours/${t.tourId}`}
                            className="hover:text-[#00473F] hover:underline"
                            title={t.tourTitle}
                          >
                            {t.tourTitle}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 text-center text-gray-600">{t.leadsCount}</td>
                        <td className="py-2.5 pr-3 text-center font-medium text-gray-900">
                          {t.confirmedBookingsCount}
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              t.conversionRate >= 20
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.conversionRate >= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {t.conversionRate}%
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">
                          ${t.revenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right text-gray-500">{t.passengerCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredTours.length > 15 && (
              <p className="mt-3 text-right text-[11px] text-gray-400">
                Showing top 15 of {filteredTours.length} active tours.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
