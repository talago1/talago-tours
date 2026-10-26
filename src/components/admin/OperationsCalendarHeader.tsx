'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthDays(year: number, month: number) {
  const days = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  return { days, firstDay };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type DepartureInfo = {
  totalPassengers: number;
  status: 'OPEN' | 'SELLING_FAST' | 'SOLD_OUT' | 'OVERBOOKED';
};

function getCapacityDotClass(status?: DepartureInfo['status'], isActive?: boolean): string {
  if (isActive) return 'bg-white ring-1 ring-white/50';
  switch (status) {
    case 'OVERBOOKED':
    case 'SOLD_OUT':
      return 'bg-rose-500 shadow-sm shadow-rose-500/50';
    case 'SELLING_FAST':
      return 'bg-amber-500 shadow-sm shadow-amber-500/50';
    case 'OPEN':
    default:
      return 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
  }
}

export default function OperationsCalendarHeader({ currentDate }: { currentDate?: string } = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [departureDates, setDepartureDates] = useState<Set<string>>(new Set());
  const [departures, setDepartures] = useState<Record<string, DepartureInfo>>({});

  const fetchDepartures = useCallback(async (year: number, month: number) => {
    try {
      const res = await fetch(`/api/admin/operations/departures?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setDepartureDates(new Set(data.dates || []));
        setDepartures(data.departures || {});
      }
    } catch {
      // silently fail — badges are non-critical
    }
  }, []);

  useEffect(() => {
    fetchDepartures(viewYear, viewMonth);
  }, [viewYear, viewMonth, fetchDepartures]);

  const onDateSelect = useCallback(
    (date: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('date', date);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else { setViewMonth((m) => m - 1); }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else { setViewMonth((m) => m + 1); }
  }, [viewMonth]);

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  if (viewMode === 'week') {
    const weekDays = getWeekDays(new Date(currentDate || todayStr));
    return (
      <div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">&larr;</button>
          <div className="flex gap-1 flex-1 overflow-x-auto">
            {weekDays.map((d) => {
              const ds = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
              const isActive = ds === currentDate;
              const hasDeparture = departureDates.has(ds);
              const depInfo = departures[ds];
              return (
                <button
                  key={ds}
                  onClick={() => onDateSelect(ds)}
                  title={depInfo ? `${depInfo.totalPassengers} passengers • ${depInfo.status}` : undefined}
                  className={`flex flex-col items-center rounded-lg px-3 py-2 text-sm transition-colors flex-1 ${
                    isActive ? 'bg-[#00473F] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs uppercase">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}</span>
                  <span className="text-lg font-bold">{d.getDate()}</span>
                  {hasDeparture && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${getCapacityDotClass(depInfo?.status, isActive)}`} />
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={nextMonth} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">&rarr;</button>
          <button onClick={() => setViewMode('month')} className="ml-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">Month</button>
        </div>
        <div className="mt-3 flex items-center justify-end gap-4 text-[11px] text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open (&lt;80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Selling Fast (≥80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Sold Out / Full
          </span>
        </div>
      </div>
    );
  }

  const { days, firstDay } = getMonthDays(viewYear, viewMonth);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">&larr;</button>
          <h2 className="text-base font-semibold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
          <button onClick={nextMonth} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">&rarr;</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDateSelect(todayStr)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Today</button>
          <button onClick={() => setViewMode('week')} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">Week</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium uppercase text-gray-500">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const ds = formatDate(viewYear, viewMonth, day);
          const isActive = ds === currentDate;
          const isToday = ds === todayStr;
          const hasDeparture = departureDates.has(ds);
          const depInfo = departures[ds];
          return (
            <button
              key={ds}
              onClick={() => onDateSelect(ds)}
              title={depInfo ? `${depInfo.totalPassengers} passengers • ${depInfo.status}` : undefined}
              className={`relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                isActive ? 'bg-[#00473F] text-white font-bold' : isToday ? 'border border-[#00473F]/30 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
              {hasDeparture && (
                <span
                  className={`absolute top-1 right-1 h-2 w-2 rounded-full ${getCapacityDotClass(depInfo?.status, isActive)}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-4 text-[11px] text-gray-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open (&lt;80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Selling Fast (≥80%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Sold Out / Full
        </span>
      </div>
    </div>
  );
}
