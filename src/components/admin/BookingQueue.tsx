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
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />
      ))}
      <div className="h-8 bg-gray-200 rounded w-32" />
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
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">No bookings yet</h3>
        <p className="text-sm text-gray-500">Bookings will appear here once customers start booking tours.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: Table view (≥lg) */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialBookings.length === 0 ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-800">{b.bookingReference}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate">{b.tourTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{b.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.travelDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.guestCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">${b.totalPriceUSD.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{b.hotelName}</td>
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
      <div className="lg:hidden space-y-4">
        {initialBookings.length === 0 ? (
          [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-semibold text-gray-800">{b.bookingReference}</span>
                <BookingRowActions ticket={b} onStatusChange={handleStatusChange} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Tour</span>
                  <p className="text-gray-800 truncate">{b.tourTitle}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Customer</span>
                  <p className="text-gray-800">{b.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Date</span>
                  <p className="text-gray-600">{b.travelDate}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Guests</span>
                  <p className="text-gray-600">{b.guestCount}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Total</span>
                  <p className="text-gray-800 font-medium">${b.totalPriceUSD.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Hotel</span>
                  <p className="text-gray-600 truncate">{b.hotelName}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
