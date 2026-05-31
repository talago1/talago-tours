'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ExecutiveDashboardStats } from '@/types/analytics';
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
}: {
  label: string;
  primaryValue: string;
  secondaryValue?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
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
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/summary?period=${p}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json: ExecutiveDashboardStats = await res.json();
      setData(json);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
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
              secondaryValue={`EGP ${data.grossRevenueEGP.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
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
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
      )}
    </div>
  );
}
