'use client';

import { useState } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import BookingRowActions from './BookingRowActions';

interface BookingQueueProps {
  initialBookings: ActiveQueueTicket[];
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/5" />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="h-8 w-24 rounded bg-white/5" />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-[#0B1528] p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 w-3/4 rounded bg-white/5" />
      ))}
      <div className="h-8 w-32 rounded bg-white/5" />
    </div>
  );
}

export default function BookingQueue({ initialBookings }: BookingQueueProps) {
  const [bookings, setBookings] = useState<ActiveQueueTicket[]>(initialBookings);

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  if (bookings.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <svg className="h-8 w-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-bold text-white">No bookings yet</h3>
        <p className="text-sm text-slate-500">Bookings will appear here once customers start booking tours.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: Table view (≥lg) */}
      <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-[#0B1528] lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Tour</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Guests</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Hotel</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {initialBookings.length === 0 ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm font-mono font-bold text-white">{b.bookingReference}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-300">{b.tourTitle}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{b.customerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{b.travelDate}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{b.guestCount}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">${b.totalPriceUSD.toFixed(2)}</td>
                  <td className="max-w-[150px] truncate px-4 py-3 text-sm text-slate-400">{b.hotelName}</td>
                  <td className="px-4 py-3">
                    <BookingRowActions ticket={b} onStatusChange={handleStatusChange} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card view (<lg) */}
      <div className="space-y-4 lg:hidden">
        {initialBookings.length === 0 ? (
          [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="space-y-3 rounded-xl border border-white/10 bg-[#0B1528] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-[#00E5FF]">{b.bookingReference}</span>
                <BookingRowActions ticket={b} onStatusChange={handleStatusChange} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Tour</span>
                  <p className="truncate text-white">{b.tourTitle}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Customer</span>
                  <p className="text-white">{b.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Date</span>
                  <p className="text-slate-400">{b.travelDate}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Guests</span>
                  <p className="text-slate-400">{b.guestCount}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total</span>
                  <p className="font-bold text-white">${b.totalPriceUSD.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Hotel</span>
                  <p className="truncate text-slate-400">{b.hotelName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
