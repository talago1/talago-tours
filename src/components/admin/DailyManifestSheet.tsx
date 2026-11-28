'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QrCode, Printer, Copy, Check, Search, ChevronRight, Users, Building2 } from 'lucide-react';
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

function buildWhatsAppManifestText(group: DailyTourManifest, dateStr: string): string {
  const lines: string[] = [
    `*${group.tourTitle}*`,
    `Date: ${dateStr} | Total Pax: ${group.totalPassengers} (${group.manifestItems.length} bookings)`,
    '────────────────────',
  ];

  group.manifestItems.forEach((item, idx) => {
    const room = item.roomNumber ? ` (Rm ${item.roomNumber})` : '';
    const time = item.pickupTime ? ` @ ${item.pickupTime}` : '';
    const pay = item.paymentStatus === 'PAID' ? 'PAID' : item.paymentStatus || 'DUE';
    const check = item.isCheckedIn ? ' ✓' : '';
    lines.push(
      `${idx + 1}. *${item.passengerName}* (${item.paxCount} pax)${time}${check}\n   ${item.hotelName}${room} · [${pay}]`
    );
  });

  return lines.join('\n');
}

function SkeletonTable() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 animate-pulse">
          <div className="mb-3 h-5 w-48 rounded bg-white/10" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-9 rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentPill({ status }: { status: string | null }) {
  const style =
    status === 'PAID'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800'
      : status === 'PROCESSING'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 print:bg-amber-100 print:text-amber-800'
        : status === 'FAILED'
          ? 'bg-red-500/15 text-red-300 border-red-500/30 print:bg-red-100 print:text-red-800'
          : 'bg-white/5 text-slate-300 border-white/10 print:bg-gray-100 print:text-gray-700';

  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${style}`}>
      {status || 'DUE'}
    </span>
  );
}

function ManifestRow({ item }: { item: ManifestItem }) {
  return (
    <tr className="border-b border-white/5 print:border-gray-300 last:border-0 hover:bg-white/[0.02]">
      <td className="px-4 py-2.5 text-sm font-medium text-white print:text-black">{item.passengerName}</td>
      <td className="px-4 py-2.5 text-sm text-slate-300 print:text-gray-700">{item.hotelName}</td>
      <td className="px-4 py-2.5 text-sm font-mono text-slate-300 print:text-gray-700">{item.roomNumber || '—'}</td>
      <td className="px-4 py-2.5 text-sm font-semibold text-white print:text-black">{item.paxCount}</td>
      <td className="px-4 py-2.5 text-sm">
        <PaymentPill status={item.paymentStatus} />
      </td>
      <td className="px-4 py-2.5 text-xs font-medium uppercase text-slate-400 print:text-gray-600">
        {CHANNEL_LABELS[item.channel] || item.channel}
      </td>
      <td className="px-4 py-2.5 text-sm">
        {item.isCheckedIn ? (
          <span className="text-emerald-400 print:text-emerald-700 font-semibold">Yes</span>
        ) : (
          <span className="text-slate-500 print:text-gray-400">No</span>
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
  const [copiedTourId, setCopiedTourId] = useState<string | null>(null);

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

  const handleCopyGroup = async (group: DailyTourManifest) => {
    try {
      const text = buildWhatsAppManifestText(group, selectedDate);
      await navigator.clipboard.writeText(text);
      setCopiedTourId(group.tourId);
      setTimeout(() => setCopiedTourId((curr) => (curr === group.tourId ? null : curr)), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold text-white">Daily Manifest</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/operations/scan"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1.5 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Scan QR</span>
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by passenger or hotel name..."
            className="w-full rounded-xl border border-white/10 bg-[#0B1528] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
          />
        </div>

        {uniqueTypes.length > 1 && (
          <div className="flex gap-1 rounded-xl border border-white/10 bg-[#0B1528] p-1 self-start">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                typeFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {uniqueTypes.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  typeFilter === t ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'SHARED' ? 'Shared' : 'Private'}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 print:hidden">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={fetchManifest}
            className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {loading && <SkeletonTable />}

      {!loading && !error && data && filteredGroups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1528]/60 p-10 text-center">
          <h3 className="text-base font-semibold text-white">
            {searchQuery || typeFilter !== 'all'
              ? 'No matching bookings'
              : 'No bookings for this date'}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Select a different date from the calendar.'}
          </p>
        </div>
      )}

      {!loading && !error && data && (
        <div>
          <p className="mb-4 text-xs text-slate-400 print:text-black">
            {formatDate(selectedDate)} &mdash; {data.totalBookings} booking{data.totalBookings !== 1 ? 's' : ''},{' '}
            {data.totalPassengers} passenger{data.totalPassengers !== 1 ? 's' : ''}
          </p>

          <div className="space-y-5 print:space-y-4">
            {filteredGroups.map((group) => (
              <section
                key={group.tourId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1528] print:bg-white print:border-gray-300 print:break-inside-avoid"
              >
                <div className="border-b border-white/10 px-4 py-3 print:border-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-white print:text-black">
                        {group.tourTitle}
                      </h2>
                      {group.capacityStatus === 'OVERBOOKED' && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">OVERBOOKED</span>
                      )}
                      {group.capacityStatus === 'SOLD_OUT' && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">SOLD OUT</span>
                      )}
                      {group.capacityStatus === 'SELLING_FAST' && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">SELLING FAST</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 print:text-gray-700 mt-0.5">
                      {group.tourType === 'SHARED' ? 'Shared Tour' : 'Private Tour'} &mdash;{' '}
                      {group.manifestItems.length} booking{group.manifestItems.length !== 1 ? 's' : ''},{' '}
                      {group.totalPassengers} passenger{group.totalPassengers !== 1 ? 's' : ''}
                      {group.maxCapacity ? ` (${group.availableSpots} of ${group.maxCapacity} spots left)` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 print:hidden shrink-0">
                    {group.maxCapacity ? (
                      <div className="w-28 hidden lg:block mr-1">
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>{group.totalPassengers}/{group.maxCapacity}</span>
                          <span>{group.capacityPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (group.capacityPercent ?? 0) >= 100
                                ? 'bg-red-500'
                                : (group.capacityPercent ?? 0) >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, group.capacityPercent ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleCopyGroup(group)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                        copiedTourId === group.tourId
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {copiedTourId === group.tourId ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy WhatsApp</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/admin/operations/dispatch?tourId=${group.tourId}&date=${selectedDate}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-2.5 py-1.5 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition"
                    >
                      <span>Dispatch</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Mobile Cards (<md) */}
                <div className="divide-y divide-white/5 md:hidden print:hidden">
                  {group.manifestItems.map((item) => (
                    <div key={item.bookingId} className="p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white truncate">{item.passengerName}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <PaymentPill status={item.paymentStatus} />
                          <span className={`text-[11px] font-semibold ${item.isCheckedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {item.isCheckedIn ? 'Checked in' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <Building2 className="h-3 w-3 text-[#00E5FF] shrink-0" />
                          <span className="truncate">{item.hotelName}</span>
                          {item.roomNumber && <span className="font-mono text-slate-400">#{item.roomNumber}</span>}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-white shrink-0">
                          <Users className="h-3 w-3 text-amber-400" />
                          {item.paxCount} pax
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Print Table */}
                <div className="hidden md:block print:block overflow-x-auto">
                  <table className="w-full text-left print:text-xs">
                    <thead>
                      <tr className="border-b border-white/10 print:border-gray-300">
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Passenger</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Hotel</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Room</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Pax</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Payment</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">Ch</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-slate-400 print:text-gray-700">In</th>
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
