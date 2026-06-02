'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import { VALID_TRANSITIONS } from '@/types/booking';
import StatusBadge from './StatusBadge';
import WhatsAppButton from './WhatsAppButton';
import { EllipsisVertical, CheckCircle2, XCircle, CalendarClock } from 'lucide-react';

interface BookingRowActionsProps {
  ticket: ActiveQueueTicket;
  onStatusChange: (id: string, newStatus: BookingStatus) => void;
}

const STATUS_ACTIONS: Record<BookingStatus, { label: string; next: BookingStatus; icon: typeof CheckCircle2; color: string }[]> = {
  PENDING: [
    { label: 'Confirm Booking', next: 'CONFIRMED', icon: CheckCircle2, color: 'text-emerald-400 hover:text-emerald-300' },
    { label: 'Cancel Booking', next: 'CANCELLED', icon: XCircle, color: 'text-red-400 hover:text-red-300' },
  ],
  CONFIRMED: [
    { label: 'Mark Completed', next: 'COMPLETED', icon: CalendarClock, color: 'text-blue-400 hover:text-blue-300' },
    { label: 'Cancel Booking', next: 'CANCELLED', icon: XCircle, color: 'text-red-400 hover:text-red-300' },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export default function BookingRowActions({ ticket, onStatusChange }: BookingRowActionsProps) {
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const actions = STATUS_ACTIONS[localStatus] ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleAction = useCallback(
    async (newStatus: BookingStatus) => {
      const prevStatus = localStatus;
      setLocalStatus(newStatus);
      setError(null);
      setMenuOpen(false);
      setSubmitting(newStatus);
      onStatusChange(ticket.id, newStatus);

      try {
        const res = await fetch(`/api/admin/bookings/${ticket.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to update status' }));
          throw new Error(err.error || 'Failed to update status');
        }
      } catch (err) {
        setLocalStatus(prevStatus);
        onStatusChange(ticket.id, prevStatus);
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setSubmitting(null);
      }
    },
    [ticket.id, localStatus, onStatusChange]
  );

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={localStatus} />

      {/* Sleek dark contextual action menu */}
      {actions.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={submitting !== null}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#121E36] text-slate-400 transition-all hover:border-[#00E5FF]/30 hover:text-[#00E5FF] disabled:opacity-40"
          >
            <EllipsisVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#121E36] shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="border-b border-white/5 px-4 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Change Status
                </span>
              </div>
              {actions.map((action) => {
                const Icon = action.icon;
                const isPending = submitting === action.next;
                return (
                  <button
                    key={action.next}
                    type="button"
                    onClick={() => handleAction(action.next)}
                    disabled={submitting !== null}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                  >
                    {isPending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className={`h-4 w-4 ${action.color}`} />
                    )}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <WhatsAppButton ticket={{ ...ticket, status: localStatus }} />

      {error && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}
    </div>
  );
}
