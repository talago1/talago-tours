'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ManifestResponse, DailyTourManifest, ManifestItem } from '@/types/manifest';

const CHANNEL_LABELS: Record<string, string> = {
  VIATOR: 'Via',
  GETYOURGUIDE: 'GYG',
  WHATSAPP: 'WA',
  HOTEL_DIRECT: 'HD',
  WEBSITE: 'Web',
};

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function SkeletonTable() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-8 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ManifestRow({ item }: { item: ManifestItem }) {
  return (
    <tr className="border-b border-gray-100 print:border-gray-300 last:border-0">
      <td className="py-2 pr-3 text-sm text-gray-900">{item.passengerName}</td>
      <td className="py-2 pr-3 text-sm text-gray-600">{item.hotelName}</td>
      <td className="py-2 pr-3 text-sm text-gray-600">{item.roomNumber || '—'}</td>
      <td className="py-2 pr-3 text-sm text-gray-900">{item.paxCount}</td>
      <td className="py-2 pr-3 text-sm">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
            item.paymentStatus === 'PAID'
              ? 'bg-emerald-100 text-emerald-700'
              : item.paymentStatus === 'PROCESSING'
                ? 'bg-amber-100 text-amber-700'
                : item.paymentStatus === 'FAILED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-500'
          }`}
        >
          {item.paymentStatus || '—'}
        </span>
      </td>
      <td className="py-2 pr-3 text-sm text-gray-600">
        <span className="text-xs font-medium uppercase text-gray-500">
          {CHANNEL_LABELS[item.channel] || item.channel}
        </span>
      </td>
      <td className="py-2 text-sm">
        {item.isCheckedIn ? (
          <span className="text-emerald-600 font-medium">Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        )}
      </td>
    </tr>
  );
}

export default function DailyManifestSheet() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const [data, setData] = useState<ManifestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchManifest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/operations/manifest?date=${selectedDate}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json: ManifestResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manifest');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const uniqueTypes = useMemo(() => {
    if (!data) return [];
    const types = new Set(data.groups.map((g) => g.tourType));
    return Array.from(types);
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    let groups = data.groups;

    if (typeFilter !== 'all') {
      groups = groups.filter((g) => g.tourType === typeFilter);
    }

    if (!searchQuery.trim()) return groups;

    const q = searchQuery.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        manifestItems: g.manifestItems.filter(
          (item) =>
            item.passengerName.toLowerCase().includes(q) ||
            item.hotelName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.manifestItems.length > 0);
  }, [data, searchQuery, typeFilter]);

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-gray-900 print:text-black">Daily Manifest</h1>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 print:hidden"
        >
          Print
        </button>
      </div>

      <div className="flex items-center gap-3 print:hidden">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by passenger or hotel name..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#00473F] focus:outline-none"
          />
        </div>

        {uniqueTypes.length > 1 && (
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setTypeFilter('all')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            {uniqueTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'SHARED' ? 'Shared' : 'Private'}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 print:hidden">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchManifest}
            className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading && <SkeletonTable />}

      {!loading && !error && data && filteredGroups.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700">
            {searchQuery || typeFilter !== 'all'
              ? 'No matching bookings'
              : 'No bookings for this date'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Select a different date from the calendar.'}
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <div>
          <p className="mb-4 text-sm text-gray-500 print:text-black">
            {formatDate(selectedDate)} &mdash; {data.totalBookings} booking{data.totalBookings !== 1 ? 's' : ''},{' '}
            {data.totalPassengers} passenger{data.totalPassengers !== 1 ? 's' : ''}
          </p>

          <div className="space-y-6 print:space-y-4">
            {filteredGroups.map((group) => (
              <section
                key={group.tourId}
                className="rounded-xl border border-gray-200 bg-white shadow-sm print:shadow-none print:border-gray-300 print:break-inside-avoid"
              >
                <div className="border-b border-gray-100 px-4 py-3 print:border-gray-300">
                  <h2 className="text-sm font-bold text-gray-900 print:text-black">
                    {group.tourTitle}
                  </h2>
                  <p className="text-xs text-gray-500 print:text-gray-700">
                    {group.tourType === 'SHARED' ? 'Shared Tour' : 'Private Tour'} &mdash;{' '}
                    {group.manifestItems.length} booking{group.manifestItems.length !== 1 ? 's' : ''},{' '}
                    {group.totalPassengers} passenger{group.totalPassengers !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left print:text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 print:border-gray-300">
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Passenger</th>
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Hotel</th>
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Room</th>
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Pax</th>
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Payment</th>
                        <th className="py-2 pr-3 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">Ch</th>
                        <th className="py-2 text-xs font-medium uppercase tracking-wide text-gray-500 print:text-gray-700">In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.manifestItems.map((item) => (
                        <ManifestRow key={item.bookingId} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
