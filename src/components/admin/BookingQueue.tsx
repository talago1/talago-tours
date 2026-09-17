'use client';

import React, { useState } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import BookingRowActions from './BookingRowActions';
import { ChevronDown, ChevronRight, Hotel, MapPin, Users, Hash, Plane, Bed, AlertCircle } from 'lucide-react';

interface AvailableTour {
  id: string;
  title: string;
  category: string | null;
}

interface BookingQueueProps {
  initialBookings: ActiveQueueTicket[];
  availableTours?: AvailableTour[];
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
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

function ExpandedDetails({ booking }: { booking: ActiveQueueTicket }) {
  return (
    <div className="bg-[#121E36] p-6 rounded-2xl border border-white/5 my-2 mx-4 animate-fade-in">
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Hotel className="h-3.5 w-3.5 text-[#00E5FF]" />
            Hotel Name
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.hotelName || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Hash className="h-3.5 w-3.5 text-[#FFD700]" />
            Room Number
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.roomNumber || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            Pickup Time
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.pickupTime || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5 text-purple-400" />
            Guests
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.guestCount}</p>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Logistics & Requirements</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-[#00E5FF]" />
            Pickup Directives
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.pickupDirectives || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Plane className="h-3.5 w-3.5 text-[#FFD700]" />
            Flight Numbers
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.flightNumbers || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Bed className="h-3.5 w-3.5 text-purple-400" />
            Bed Configuration
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.bedConfiguration || '—'}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            Special Requirements
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{booking.specialRequirements || '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function BookingQueue({ initialBookings, availableTours = [] }: BookingQueueProps) {
  const [bookings, setBookings] = useState<ActiveQueueTicket[]>(initialBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const handleUpdateBooking = (updated: ActiveQueueTicket) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
      {/* Desktop: Table view (≥lg) — NO overflow-hidden on container so dropdowns float free */}
      <div className="hidden rounded-xl border border-white/10 bg-[#0B1528] lg:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="w-8 px-2 py-3" />
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
                <React.Fragment key={b.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-white/[0.02]"
                    onClick={() => toggleExpand(b.id)}
                  >
                    <td className="px-2 py-3">
                      {expandedId === b.id ? (
                        <ChevronDown className="h-4 w-4 text-[#00E5FF]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-bold text-white">{b.bookingReference}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-300">{b.tourTitle}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{b.customerName}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{b.travelDate}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{b.guestCount}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">${b.totalPriceUSD.toFixed(2)}</td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-sm text-slate-400">{b.hotelName}</td>
                    <td className="px-4 py-3">
                      <BookingRowActions
                        ticket={b}
                        onStatusChange={handleStatusChange}
                        onUpdateBooking={handleUpdateBooking}
                        onDeleteBooking={handleDeleteBooking}
                      />
                    </td>
                  </tr>
                  {expandedId === b.id && (
                    <tr key={`${b.id}-expanded`}>
                      <td colSpan={9} className="bg-white/[0.01] p-0">
                        <ExpandedDetails booking={b} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
                <BookingRowActions
                  ticket={b}
                  onStatusChange={handleStatusChange}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                />
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
              <div className="border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(b.id)}
                  className="flex w-full items-center justify-between text-xs font-bold text-slate-400 hover:text-[#00E5FF] transition-colors"
                >
                  <span>View Logistics Details</span>
                  {expandedId === b.id ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                {expandedId === b.id && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-slate-500">Pickup Directives</span>
                      <span className="text-xs font-semibold text-white">{b.pickupDirectives || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-slate-500">Flight Numbers</span>
                      <span className="text-xs font-semibold text-white">{b.flightNumbers || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-slate-500">Bed Config</span>
                      <span className="text-xs font-semibold text-white">{b.bedConfiguration || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-slate-500">Special Requirements</span>
                      <span className="text-xs font-semibold text-white">{b.specialRequirements || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
