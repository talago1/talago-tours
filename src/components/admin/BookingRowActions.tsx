'use client';

import { useState, useCallback } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import { VALID_TRANSITIONS } from '@/types/booking';
import StatusBadge from './StatusBadge';
import WhatsAppButton from './WhatsAppButton';
import type { CheckoutError } from '@/types/booking';

interface BookingRowActionsProps {
  ticket: ActiveQueueTicket;
  onStatusChange: (id: string, newStatus: BookingStatus) => void;
}

export default function BookingRowActions({ ticket, onStatusChange }: BookingRowActionsProps) {
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [error, setError] = useState<string | null>(null);

  const allowed = VALID_TRANSITIONS[localStatus];

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as BookingStatus;
      const prevStatus = localStatus;

      setLocalStatus(newStatus);
      setError(null);
      onStatusChange(ticket.id, newStatus);

      try {
        const res = await fetch(`/api/admin/bookings/${ticket.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          const err: CheckoutError = await res.json();
          throw new Error(err.error || 'Failed to update status');
        }
      } catch (err) {
        setLocalStatus(prevStatus);
        onStatusChange(ticket.id, prevStatus);
        setError(err instanceof Error ? err.message : 'Update failed');
      }
    },
    [ticket.id, localStatus, onStatusChange]
  );

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={localStatus} />
      {allowed.length > 0 && (
        <select
          value=""
          onChange={handleChange}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF5B00]/50"
        >
          <option value="" disabled>Change...</option>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      <WhatsAppButton ticket={{ ...ticket, status: localStatus }} />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
