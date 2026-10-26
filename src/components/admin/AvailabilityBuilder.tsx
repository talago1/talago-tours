'use client';

/**
 * AvailabilityBuilder — Phase 6
 *
 * Two-panel admin UI:
 *  1. Schedule Rules (recurring day-of-week patterns + blackouts)
 *  2. Date Overrides (per-date status, capacity, price)
 *
 * Props:
 *  tourId       — required to call APIs
 *  defaultCapacity — tour.maxCapacity fallback shown in UI
 *  defaultAdultPrice — tour.adultPrice fallback shown in UI
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CloudOff,
  Lock,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailabilityStatus =
  | 'AVAILABLE'
  | 'SOLD_OUT'
  | 'CLOSED'
  | 'WEATHER_CANCELLED'
  | 'PRIVATE_EVENT'
  | 'BLACKOUT';

interface TourAvailabilityEntry {
  id: string;
  tourId: string;
  date: string; // ISO string from server
  status: AvailabilityStatus;
  capacityOverride?: number | null;
  adultPriceOverride?: number | null;
  childPriceOverride?: number | null;
  notes?: string | null;
}

interface TourScheduleRuleEntry {
  id: string;
  tourId: string;
  dayOfWeek?: number | null; // 1=Mon…7=Sun, null=all days
  isBlackout: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  departureTime?: string | null;
  notes?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday',
  5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  AVAILABLE: { label: 'Available', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle },
  SOLD_OUT: { label: 'Sold Out', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: AlertTriangle },
  CLOSED: { label: 'Closed', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10', icon: XCircle },
  WEATHER_CANCELLED: { label: 'Weather Cancel', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', icon: CloudOff },
  PRIVATE_EVENT: { label: 'Private Event', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10', icon: Lock },
  BLACKOUT: { label: 'Blackout', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', icon: XCircle },
};

const STATUSES = Object.keys(STATUS_CONFIG) as AvailabilityStatus[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(iso: string) {
  return iso.slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AvailabilityBuilderProps {
  tourId: string;
  defaultCapacity?: number;
  defaultAdultPrice?: number;
}

export default function AvailabilityBuilder({
  tourId,
  defaultCapacity = 0,
  defaultAdultPrice = 0,
}: AvailabilityBuilderProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<TourAvailabilityEntry[]>([]);
  const [scheduleRules, setScheduleRules] = useState<TourScheduleRuleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // New date override form state
  const [newDate, setNewDate] = useState('');
  const [newStatus, setNewStatus] = useState<AvailabilityStatus>('AVAILABLE');
  const [newCapacity, setNewCapacity] = useState('');
  const [newAdultPrice, setNewAdultPrice] = useState('');
  const [newChildPrice, setNewChildPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // New schedule rule form state
  const [newRuleDay, setNewRuleDay] = useState<string>('');
  const [newRuleIsBlackout, setNewRuleIsBlackout] = useState(false);
  const [newRuleFrom, setNewRuleFrom] = useState('');
  const [newRuleUntil, setNewRuleUntil] = useState('');
  const [newRuleDeparture, setNewRuleDeparture] = useState('');
  const [newRuleNotes, setNewRuleNotes] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tours/${tourId}/availability`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setAvailability(data.availability ?? []);
      setScheduleRules(data.scheduleRules ?? []);
    } catch {
      setError('Could not load availability data');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => { load(); }, [load]);

  // ── Upsert date override ──────────────────────────────────────────────────

  const handleAddOverride = async () => {
    if (!newDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tours/${tourId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          status: newStatus,
          capacityOverride: newCapacity ? parseInt(newCapacity, 10) : null,
          adultPriceOverride: newAdultPrice ? parseFloat(newAdultPrice) : null,
          childPriceOverride: newChildPrice ? parseFloat(newChildPrice) : null,
          notes: newNotes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      await load();
      setNewDate(''); setNewCapacity(''); setNewAdultPrice(''); setNewChildPrice(''); setNewNotes('');
      showToast('Date override saved');
    } catch {
      setError('Could not save override');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/tours/${tourId}/availability?id=${id}`, { method: 'DELETE' });
      await load();
      showToast('Override removed');
    } finally {
      setSaving(false);
    }
  };

  // ── Schedule rules ────────────────────────────────────────────────────────

  const handleAddRule = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tours/${tourId}/schedule-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: newRuleDay ? parseInt(newRuleDay, 10) : null,
          isBlackout: newRuleIsBlackout,
          validFrom: newRuleFrom || null,
          validUntil: newRuleUntil || null,
          departureTime: newRuleDeparture || null,
          notes: newRuleNotes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      await load();
      setNewRuleDay(''); setNewRuleIsBlackout(false); setNewRuleFrom(''); setNewRuleUntil('');
      setNewRuleDeparture(''); setNewRuleNotes('');
      showToast('Schedule rule added');
    } catch {
      setError('Could not add rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/tours/${tourId}/schedule-rules?id=${id}`, { method: 'DELETE' });
      await load();
      showToast('Rule removed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading availability…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-900/80 px-4 py-3 text-sm font-semibold text-emerald-300 backdrop-blur">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-900/20 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* ── Section 1: Schedule Rules ─────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
          <Calendar className="h-5 w-5 text-[#00E5FF]" />
          Recurring Schedule Rules
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Define which days of the week this tour runs. Leave empty = runs every day.
          Blackout rules override inclusive rules.
        </p>

        {/* Rule list */}
        <div className="mb-4 space-y-2">
          {scheduleRules.length === 0 && (
            <p className="text-sm italic text-slate-500">No schedule rules — tour runs every day by default.</p>
          )}
          {scheduleRules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                rule.isBlackout
                  ? 'border-rose-500/30 bg-rose-900/10'
                  : 'border-emerald-500/20 bg-emerald-900/10'
              }`}
            >
              <div>
                <span className={`font-semibold ${rule.isBlackout ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {rule.isBlackout ? '🚫 Blackout' : '✅ Runs'}{' '}
                </span>
                <span className="text-white">
                  {rule.dayOfWeek ? DAY_NAMES[rule.dayOfWeek] : 'Every day'}
                </span>
                {rule.departureTime && (
                  <span className="ml-2 text-sm text-slate-400">at {rule.departureTime}</span>
                )}
                {(rule.validFrom || rule.validUntil) && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({rule.validFrom ? toDateStr(rule.validFrom) : '∞'} → {rule.validUntil ? toDateStr(rule.validUntil) : '∞'})
                  </span>
                )}
                {rule.notes && <span className="ml-2 text-xs italic text-slate-500">{rule.notes}</span>}
              </div>
              <button
                onClick={() => handleDeleteRule(rule.id)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add rule form */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Add Schedule Rule
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Day of Week</label>
              <select
                value={newRuleDay}
                onChange={(e) => setNewRuleDay(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              >
                <option value="">All days</option>
                {Object.entries(DAY_NAMES).map(([val, name]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Type</label>
              <select
                value={newRuleIsBlackout ? '1' : '0'}
                onChange={(e) => setNewRuleIsBlackout(e.target.value === '1')}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              >
                <option value="0">Runs (inclusive)</option>
                <option value="1">Blackout (closed)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Departure Time</label>
              <input
                type="time"
                value={newRuleDeparture}
                onChange={(e) => setNewRuleDeparture(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Valid From</label>
              <input
                type="date"
                value={newRuleFrom}
                onChange={(e) => setNewRuleFrom(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Valid Until</label>
              <input
                type="date"
                value={newRuleUntil}
                onChange={(e) => setNewRuleUntil(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <input
              type="text"
              placeholder="Internal notes (optional)"
              value={newRuleNotes}
              onChange={(e) => setNewRuleNotes(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
            />
            <button
              onClick={handleAddRule}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-4 py-2 text-sm font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add Rule
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: Date Overrides ─────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
          <Calendar className="h-5 w-5 text-violet-400" />
          Date-Specific Overrides
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Override capacity, pricing, or status for specific dates. Falls back to tour defaults when no override is set.
          Defaults: capacity <strong className="text-white">{defaultCapacity}</strong>, adult price <strong className="text-white">${defaultAdultPrice}</strong>.
        </p>

        {/* Override list */}
        <div className="mb-4 space-y-2">
          {availability.length === 0 && (
            <p className="text-sm italic text-slate-500">No date overrides yet.</p>
          )}
          {availability.map((entry) => {
            const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.AVAILABLE;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white w-36">
                    {formatDate(entry.date)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  {entry.capacityOverride != null && (
                    <span className="text-xs text-slate-400">Cap: {entry.capacityOverride}</span>
                  )}
                  {entry.adultPriceOverride != null && (
                    <span className="text-xs text-slate-400">Adult: ${entry.adultPriceOverride}</span>
                  )}
                  {entry.childPriceOverride != null && (
                    <span className="text-xs text-slate-400">Child: ${entry.childPriceOverride}</span>
                  )}
                  {entry.notes && (
                    <span className="text-xs italic text-slate-500">{entry.notes}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteOverride(entry.id)}
                  disabled={saving}
                  className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add override form */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Add / Update Date Override
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1 block text-xs text-slate-400">Date *</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as AvailabilityStatus)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Capacity Override</label>
              <input
                type="number" min="0"
                placeholder={String(defaultCapacity)}
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Adult Price Override</label>
              <input
                type="number" min="0" step="0.01"
                placeholder={`$${defaultAdultPrice}`}
                value={newAdultPrice}
                onChange={(e) => setNewAdultPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Child Price Override</label>
              <input
                type="number" min="0" step="0.01"
                value={newChildPrice}
                onChange={(e) => setNewChildPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Notes</label>
              <input
                type="text"
                placeholder="Optional note"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0A1628] px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddOverride}
              disabled={saving || !newDate}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 px-5 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Override
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
