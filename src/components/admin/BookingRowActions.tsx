'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import StatusBadge from './StatusBadge';
import WhatsAppButton from './WhatsAppButton';
import EditBookingModal from './EditBookingModal';
import {
  EllipsisVertical,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Clock,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';

interface BookingRowActionsProps {
  ticket: ActiveQueueTicket;
  onStatusChange: (id: string, newStatus: BookingStatus) => void;
  onUpdateBooking?: (updated: ActiveQueueTicket) => void;
  onDeleteBooking?: (id: string) => void;
}

const ALL_STATUSES: { label: string; status: BookingStatus; icon: typeof CheckCircle2; color: string }[] = [
  { label: 'Pending', status: 'PENDING', icon: Clock, color: 'text-amber-400' },
  { label: 'Confirm', status: 'CONFIRMED', icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Completed', status: 'COMPLETED', icon: CalendarClock, color: 'text-blue-400' },
  { label: 'Cancel', status: 'CANCELLED', icon: XCircle, color: 'text-red-400' },
];

export default function BookingRowActions({
  ticket,
  onStatusChange,
  onUpdateBooking,
  onDeleteBooking,
}: BookingRowActionsProps) {
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalStatus(ticket.status);
  }, [ticket.status]);

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

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete booking #${ticket.bookingReference} for "${ticket.customerName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${ticket.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete booking' }));
        throw new Error(err.error || 'Failed to delete booking');
      }

      if (onDeleteBooking) {
        onDeleteBooking(ticket.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <StatusBadge status={localStatus} />

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          title="Edit booking"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#121E36] text-slate-400 transition-all hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>

        {/* Status Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={submitting !== null}
            title="Change status"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#121E36] text-slate-400 transition-all hover:border-[#00E5FF]/30 hover:text-[#00E5FF] disabled:opacity-40"
          >
            <EllipsisVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#121E36] shadow-2xl backdrop-blur-md">
              <div className="border-b border-white/5 px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Set Status
                </span>
              </div>
              <div className="p-1 space-y-0.5">
                {ALL_STATUSES.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = localStatus === item.status;
                  const isPending = submitting === item.status;
                  return (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => handleAction(item.status)}
                      disabled={submitting !== null}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-white/10 text-white'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                      } disabled:opacity-40`}
                    >
                      {isPending ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                      )}
                      <span>{item.label}</span>
                      {isCurrent && <span className="ml-auto text-[10px] text-slate-400">Current</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete booking permanently"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        <WhatsAppButton ticket={{ ...ticket, status: localStatus }} />

        {error && (
          <span className="text-[10px] text-red-400">{error}</span>
        )}
      </div>

      {/* Edit Booking Modal */}
      {isEditOpen && (
        <EditBookingModal
          ticket={{ ...ticket, status: localStatus }}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updated) => {
            setLocalStatus(updated.status);
            if (onUpdateBooking) {
              onUpdateBooking(updated);
            }
          }}
        />
      )}
    </>
  );
}
