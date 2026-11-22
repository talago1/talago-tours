'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';

export interface DayAvailability {
  status: string;
  remaining: number;
  adultPrice?: number | null;
  childPrice?: number | null;
}

export interface BookingCalendarProps {
  tourId: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string, availability?: DayAvailability) => void;
  cutoffHours?: number;
  basePriceUSD?: number;
  className?: string;
  compact?: boolean;
}

export default function BookingCalendar({
  tourId,
  selectedDate,
  onSelectDate,
  cutoffHours = 12,
  basePriceUSD = 0,
  className = '',
  compact = false,
}: BookingCalendarProps) {
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();

  // Initialize view date based on selectedDate or today
  const initialViewDate = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m] = selectedDate.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, 1));
    }
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }, [selectedDate]);

  const [viewDate, setViewDate] = useState<Date>(initialViewDate);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, DayAvailability>>({});
  const [loading, setLoading] = useState(false);

  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth(); // 0-indexed

  // Format month string: YYYY-MM
  const monthKey = useMemo(() => {
    const mm = String(month + 1).padStart(2, '0');
    return `${year}-${mm}`;
  }, [year, month]);

  // Minimum allowed date calculation based on cutoffHours
  const minSelectableDateStr = useMemo(() => {
    const minTime = Date.now() + Math.max(cutoffHours, 1) * 3600000;
    const d = new Date(minTime);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }, [cutoffHours]);

  // Fetch month availability
  useEffect(() => {
    if (!tourId) return;
    let isCancelled = false;
    setLoading(true);

    fetch(`/api/public/tours/${tourId}/availability?month=${monthKey}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, DayAvailability>) => {
        if (!isCancelled) {
          setAvailabilityMap(data || {});
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAvailabilityMap({});
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [tourId, monthKey]);

  // Month navigation bounds
  const isPrevDisabled = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return viewDate <= currentMonthStart;
  }, [viewDate]);

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    setViewDate(new Date(Date.UTC(year, month - 1, 1)));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(Date.UTC(year, month + 1, 1)));
  };

  // Month & Day localized labels
  const monthName = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language || 'en', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(viewDate);
    } catch {
      return viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
  }, [viewDate, language]);

  const weekDays = useMemo(() => {
    // Generate weekday headers Monday-Sunday
    const days: string[] = [];
    const base = new Date(Date.UTC(2026, 0, 5)); // A Monday
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      try {
        days.push(new Intl.DateTimeFormat(language || 'en', { weekday: 'short', timeZone: 'UTC' }).format(d));
      } catch {
        days.push(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]);
      }
    }
    return days;
  }, [language]);

  // Calendar grid calculation
  const calendarCells = useMemo(() => {
    // Day of week for 1st of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
    // Normalize to Monday = 0, Sunday = 6
    const offset = (firstDayOfWeek + 6) % 7;

    // Number of days in current month
    const totalDaysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      disabled: boolean;
      isSoldOut: boolean;
      isAvailable: boolean;
      price?: number;
      remaining?: number;
    }> = [];

    // Empty offset cells before month starts
    for (let i = 0; i < offset; i++) {
      cells.push({
        dateStr: `empty-${i}`,
        dayNum: 0,
        isCurrentMonth: false,
        disabled: true,
        isSoldOut: false,
        isAvailable: false,
      });
    }

    // Days of the month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const dateStr = `${monthKey}-${dd}`;
      const isPastCutoff = dateStr < minSelectableDateStr;

      const avail = availabilityMap[dateStr];
      const isSoldOut = avail?.status === 'SOLD_OUT' || (avail && avail.remaining === 0);
      const isClosed = avail?.status === 'CLOSED' || avail?.status === 'UNAVAILABLE';
      const isAvailable = !isPastCutoff && !isSoldOut && !isClosed;
      const disabled = isPastCutoff || isSoldOut || isClosed;

      const price = avail?.adultPrice ?? (basePriceUSD > 0 ? basePriceUSD : undefined);

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        disabled,
        isSoldOut: !isPastCutoff && isSoldOut,
        isAvailable,
        price,
        remaining: avail?.remaining,
      });
    }

    return cells;
  }, [year, month, monthKey, minSelectableDateStr, availabilityMap, basePriceUSD]);

  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0B1528]/95 p-4 shadow-xl backdrop-blur-md select-none ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#00E5FF]" />
          <span className="text-sm font-black text-white capitalize">{monthName}</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((wd, i) => (
          <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1">
            {wd}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return <div key={`empty-${idx}`} className="h-12 w-full" />;
          }

          const isSelected = selectedDate === cell.dateStr;

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={cell.disabled}
              onClick={() => {
                if (!cell.disabled) {
                  onSelectDate(cell.dateStr, availabilityMap[cell.dateStr]);
                }
              }}
              className={`group relative flex flex-col items-center justify-center rounded-xl p-1 transition-all text-center ${
                compact ? 'h-11' : 'h-13'
              } ${
                isSelected
                  ? 'bg-gradient-to-b from-[#00E5FF]/25 to-[#00B4D8]/20 border-2 border-[#00E5FF] shadow-lg shadow-[#00E5FF]/20 text-white ring-2 ring-[#00E5FF]/30'
                  : cell.disabled
                  ? cell.isSoldOut
                    ? 'bg-rose-950/20 border border-rose-500/20 text-slate-500 cursor-not-allowed'
                    : 'bg-white/[0.02] border border-transparent text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-white/[0.04] border border-white/10 text-slate-200 hover:border-[#00E5FF]/60 hover:bg-white/[0.08] hover:text-white cursor-pointer active:scale-95'
              }`}
            >
              {/* Day Number */}
              <span
                className={`text-xs font-bold leading-none ${
                  isSelected ? 'text-[#00E5FF] font-black' : cell.disabled ? 'text-slate-500' : 'text-white'
                }`}
              >
                {cell.dayNum}
              </span>

              {/* Price or Sold Out Label */}
              {cell.isSoldOut ? (
                <span className="mt-0.5 text-[9px] font-semibold text-rose-400 leading-none">Sold</span>
              ) : cell.price !== undefined && !cell.disabled ? (
                <span
                  className={`mt-0.5 text-[10px] font-bold leading-none ${
                    isSelected ? 'text-white' : 'text-[#FF5B00] group-hover:text-[#FF7A29]'
                  }`}
                >
                  {formatPrice(cell.price, { round: true })}
                </span>
              ) : null}

              {/* Scarcity indicator dot */}
              {cell.remaining !== undefined && cell.remaining > 0 && cell.remaining <= 5 && !cell.disabled && (
                <span
                  className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"
                  title={`${cell.remaining} spots left`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-[#00E5FF] bg-[#00E5FF]/30" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500/60" />
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
}
