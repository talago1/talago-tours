'use client';

import React, { useState } from 'react';
import { X, Loader2, Save, Calendar, User, Phone, Mail, Hotel, Hash, Clock, DollarSign, AlertCircle } from 'lucide-react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

interface EditBookingModalProps {
  ticket: ActiveQueueTicket;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: ActiveQueueTicket) => void;
}

export default function EditBookingModal({
  ticket,
  isOpen,
  onClose,
  onSaved,
}: EditBookingModalProps) {
  const [customerName, setCustomerName] = useState(ticket.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(ticket.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(ticket.customerEmail || '');
  const [travelDate, setTravelDate] = useState(ticket.travelDate || '');
  const [adultsCount, setAdultsCount] = useState(ticket.adultsCount ?? ticket.guestCount ?? 1);
  const [childrenCount, setChildrenCount] = useState(ticket.childrenCount ?? 0);
  const [infantsCount, setInfantsCount] = useState(ticket.infantsCount ?? 0);
  const [totalPriceUSD, setTotalPriceUSD] = useState(ticket.totalPriceUSD || 0);
  const [hotelName, setHotelName] = useState(ticket.hotelName || '');
  const [roomNumber, setRoomNumber] = useState(ticket.roomNumber || '');
  const [pickupTime, setPickupTime] = useState(ticket.pickupTime || '');
  const [pickupDirectives, setPickupDirectives] = useState(ticket.pickupDirectives || '');
  const [specialRequirements, setSpecialRequirements] = useState(ticket.specialRequirements || '');
  const [status, setStatus] = useState<BookingStatus>(ticket.status);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const totalGuests = Number(adultsCount) + Number(childrenCount) + Number(infantsCount);

    try {
      const res = await fetch(`/api/admin/bookings/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          travelDate,
          guestCount: totalGuests,
          adultsCount: Number(adultsCount),
          childrenCount: Number(childrenCount),
          infantsCount: Number(infantsCount),
          totalPriceUSD: Number(totalPriceUSD),
          hotelName,
          roomNumber,
          pickupTime,
          pickupDirectives,
          specialRequirements,
          status,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to update booking');
      }

      const data = await res.json();
      const updatedBooking = data.booking;

      const updatedTicket: ActiveQueueTicket = {
        ...ticket,
        customerName: updatedBooking.customerName,
        customerPhone: updatedBooking.customerPhone,
        customerEmail: updatedBooking.customerEmail,
        travelDate: updatedBooking.travelDate ? String(updatedBooking.travelDate).split('T')[0] : travelDate,
        guestCount: updatedBooking.guestCount,
        adultsCount: updatedBooking.adultsCount,
        childrenCount: updatedBooking.childrenCount,
        infantsCount: updatedBooking.infantsCount,
        totalPriceUSD: Number(updatedBooking.totalPriceUSD),
        hotelName: updatedBooking.hotelName,
        roomNumber: updatedBooking.roomNumber,
        pickupTime: updatedBooking.selectedPickupTime || pickupTime,
        pickupDirectives: updatedBooking.pickupDirectives,
        specialRequirements: updatedBooking.specialRequirements,
        status: updatedBooking.status as BookingStatus,
      };

      onSaved(updatedTicket);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">Edit Booking</span>
              <span className="font-mono text-sm font-bold text-slate-400">#{ticket.bookingReference}</span>
            </div>
            <h2 className="mt-1 text-lg font-black text-white">{ticket.tourTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Status & Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#00E5FF]"
              >
                <option value="PENDING" className="bg-[#0B1528] text-amber-400">PENDING</option>
                <option value="CONFIRMED" className="bg-[#0B1528] text-emerald-400">CONFIRMED</option>
                <option value="COMPLETED" className="bg-[#0B1528] text-blue-400">COMPLETED</option>
                <option value="CANCELLED" className="bg-[#0B1528] text-red-400">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
                Travel Date
              </label>
              <input
                type="date"
                required
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <User className="h-3.5 w-3.5 text-[#00E5FF]" />
                Lead Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                Phone
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Mail className="h-3.5 w-3.5 text-purple-400" />
                Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Guests Breakdown & Price */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Adults</label>
              <input
                type="number"
                min="1"
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Children</label>
              <input
                type="number"
                min="0"
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Infants</label>
              <input
                type="number"
                min="0"
                value={infantsCount}
                onChange={(e) => setInfantsCount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <DollarSign className="h-3.5 w-3.5 text-[#FFD700]" />
                Total USD
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalPriceUSD}
                onChange={(e) => setTotalPriceUSD(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Hotel & Logistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Hotel className="h-3.5 w-3.5 text-[#00E5FF]" />
                Hotel Name
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Hash className="h-3.5 w-3.5 text-[#FFD700]" />
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Pickup Time
              </label>
              <input
                type="text"
                placeholder="e.g. 08:30 AM"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {/* Directives & Special requirements */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Pickup Directives</label>
              <input
                type="text"
                placeholder="e.g. Main gate, wait by fountain"
                value={pickupDirectives}
                onChange={(e) => setPickupDirectives(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Special Requirements</label>
              <input
                type="text"
                placeholder="e.g. Vegetarian meals, child seat"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#00E5FF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-2.5 text-sm font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
