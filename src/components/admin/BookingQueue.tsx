'use client';

import React, { useState, useMemo } from 'react';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import BookingRowActions from './BookingRowActions';
import BookingInvoiceModal from './BookingInvoiceModal';
import {
  ChevronDown,
  ChevronRight,
  Hotel,
  MapPin,
  Users,
  Hash,
  Clock,
  DollarSign,
  MessageCircle,
  CreditCard,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  FileText,
  CheckSquare,
  Square,
  RefreshCw,
  Calendar,
  X,
  ArrowUpDown,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

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
      <td className="w-10 px-3 py-3">
        <div className="h-4 w-4 rounded bg-white/5" />
      </td>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/5" />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="h-6 w-16 rounded bg-white/5" />
      </td>
    </tr>
  );
}

function ExpandedDetails({ booking }: { booking: ActiveQueueTicket }) {
  const cleanPhone = (booking.customerPhone || '').replace(/[^0-9]/g, '');
  const cashDue = booking.amountDueOnArrival ?? (booking.paymentScheme === 'FULL' ? 0 : Math.max(0, booking.totalPriceUSD - (booking.amountPaidOnline ?? 0)));
  const paidOnline = booking.amountPaidOnline ?? (booking.paymentScheme === 'FULL' ? booking.totalPriceUSD : 0);

  return (
    <div className="border-t border-white/5 bg-[#070F1E] px-6 py-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hotel & Room Logistics */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Hotel className="h-3.5 w-3.5 text-[#00E5FF]" />
                Hotel & Room
              </span>
              {booking.roomNumber ? (
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-[#00E5FF] border border-[#00E5FF]/20">
                  Room {booking.roomNumber}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">No room #</span>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-white truncate" title={booking.hotelName || booking.pickupLocationName || 'No hotel specified'}>
              {booking.hotelName || booking.pickupLocationName || 'Direct / No hotel specified'}
            </p>
            {booking.pickupType && booking.pickupType !== 'HOTEL' && (
              <span className="mt-1 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/20">
                Mode: {booking.pickupType.replace('_', ' ')}
              </span>
            )}
            {booking.zoneName && (
              <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-500" />
                Zone: <span className="text-slate-300 font-medium">{booking.zoneName}</span>
              </p>
            )}
          </div>
          {booking.pickupDirectives && (
            <p className="mt-2 text-[11px] text-slate-400 border-t border-white/5 pt-2">
              Note: {booking.pickupDirectives}
            </p>
          )}
        </div>

        {/* Excursion Pickup Time & Party */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Pickup Schedule
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Users className="h-3 w-3" />
                {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg font-bold text-amber-400">
                {booking.pickupTime || 'TBD'}
              </span>
              <span className="text-xs text-slate-400">
                ({booking.travelDate ? new Date(booking.travelDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'})
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 border-t border-white/5 pt-2">
            <span>Adults: <strong className="text-white">{booking.adultsCount ?? booking.guestCount}</strong></span>
            <span>Children: <strong className="text-white">{booking.childrenCount ?? 0}</strong></span>
            {!!booking.infantsCount && <span>Infants: <strong className="text-white">{booking.infantsCount}</strong></span>}
          </div>
        </div>

        {/* Financials & Cash to Collect on Arrival */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Payment Breakdown
              </span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                {booking.paymentScheme || 'ARRIVAL'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Price:</span>
              <span className="text-sm font-semibold text-white">${booking.totalPriceUSD}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Paid Online:</span>
              <span className="text-slate-300 font-medium">${paidOnline}</span>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Cash Due at Pickup:</span>
            <span className="text-base font-bold text-amber-300">${cashDue}</span>
          </div>
        </div>

        {/* Guest Contact & WhatsApp Quick Action */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                Guest Direct Contact
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white truncate">{booking.customerName}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{booking.customerPhone}</p>
            {booking.customerEmail && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{booking.customerEmail}</p>
            )}
          </div>
          <div className="mt-3">
            {cleanPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello ${booking.customerName}, regarding your booking ${booking.bookingReference} for ${booking.tourTitle} on ${booking.travelDate || ''}: Your pickup is scheduled for ${booking.pickupTime || 'lobby'}. Cash balance due: $${cashDue}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                Chat on WhatsApp
              </a>
            ) : (
              <span className="text-xs text-slate-500 italic">No phone provided</span>
            )}
          </div>
        </div>
      </div>

      {booking.specialRequirements && (
        <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.01] px-4 py-2 text-xs flex items-center gap-2 text-slate-300">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span><strong className="text-white">Special Requirements:</strong> {booking.specialRequirements}</span>
        </div>
      )}

      {/* Dynamic Add-ons & Custom Booking Answers */}
      {((Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0) ||
        (booking.bookingAnswers && typeof booking.bookingAnswers === 'object' && Object.keys(booking.bookingAnswers).length > 0)) && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/5 pt-3">
          {Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Selected Add-ons & Upgrades
              </span>
              <div className="space-y-1.5">
                {booking.selectedAddons.map((addon: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="font-medium text-white">
                      {addon.title} {addon.quantity > 1 ? `(×${addon.quantity})` : ''}
                    </span>
                    <span className="font-bold text-amber-400">+${addon.total ?? addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.bookingAnswers && typeof booking.bookingAnswers === 'object' && Object.keys(booking.bookingAnswers).length > 0 && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-3.5 w-3.5 text-[#00E5FF]" />
                Customer Question Answers
              </span>
              <div className="space-y-1.5">
                {Object.entries(booking.bookingAnswers).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-slate-400 capitalize">{k.replace(/^question_/, '').replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-white">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingQueue({ initialBookings, availableTours = [] }: BookingQueueProps) {
  const [bookings, setBookings] = useState<ActiveQueueTicket[]>(initialBookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Invoice Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Extract distinct months from bookings for quick filtering
  const distinctMonths = useMemo(() => {
    const months = new Set<string>();
    bookings.forEach((b) => {
      if (b.travelDate && b.travelDate.length >= 7) {
        months.add(b.travelDate.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [bookings]);

  // Extract distinct categories
  const distinctCategories = useMemo(() => {
    const cats = new Set<string>();
    bookings.forEach((b) => {
      if (b.category) cats.add(b.category.toLowerCase());
    });
    availableTours.forEach((t) => {
      if (t.category) cats.add(t.category.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [bookings, availableTours]);

  // Filtered bookings calculation
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = b.customerName?.toLowerCase().includes(query);
        const matchesPhone = b.customerPhone?.toLowerCase().includes(query);
        const matchesEmail = b.customerEmail?.toLowerCase().includes(query);
        const matchesRef = b.bookingReference?.toLowerCase().includes(query);
        const matchesHotel = b.hotelName?.toLowerCase().includes(query);
        const matchesTour = b.tourTitle?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesRef && !matchesHotel && !matchesTour) {
          return false;
        }
      }

      // Tour filter
      if (selectedTourId !== 'ALL' && b.tourId !== selectedTourId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && (b.category?.toLowerCase() !== selectedCategory.toLowerCase())) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) {
        return false;
      }

      // Month filter (YYYY-MM)
      if (selectedMonth !== 'ALL') {
        if (!b.travelDate || !b.travelDate.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Custom date range
      if (startDate && b.travelDate < startDate) {
        return false;
      }
      if (endDate && b.travelDate > endDate) {
        return false;
      }

      return true;
    });
  }, [bookings, searchQuery, selectedTourId, selectedCategory, selectedStatus, selectedMonth, startDate, endDate]);

  // Quick statistics for filtered set
  const stats = useMemo(() => {
    const count = filteredBookings.length;
    const pax = filteredBookings.reduce((sum, b) => sum + (b.guestCount || 0), 0);
    const revenue = filteredBookings.reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0);
    const paidOnline = filteredBookings.reduce((sum, b) => sum + (b.amountPaidOnline || 0), 0);
    const dueArrival = filteredBookings.reduce((sum, b) => sum + (b.amountDueOnArrival || 0), 0);
    return { count, pax, revenue, paidOnline, dueArrival };
  }, [filteredBookings]);

  // Multi-select handlers
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.size === filteredBookings.length && filteredBookings.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map((b) => b.id)));
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTourId('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedMonth('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedIds(new Set());
  };

  // Status and Single Row Handlers
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Bulk Delete Selected Bookings
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} selected booking(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }

      const idsToDelete = new Set(selectedIds);
      setBookings((prev) => prev.filter((b) => !idsToDelete.has(b.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
      alert(err.message || 'Failed to delete selected bookings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete All Filtered Bookings
  const handleDeleteAllFiltered = async () => {
    if (filteredBookings.length === 0) return;
    const count = filteredBookings.length;
    const filterDesc = [
      selectedTourId !== 'ALL' ? `Tour: ${availableTours.find(t => t.id === selectedTourId)?.title || selectedTourId}` : '',
      selectedMonth !== 'ALL' ? `Month: ${selectedMonth}` : '',
      startDate || endDate ? `Dates: ${startDate || 'start'} to ${endDate || 'end'}` : '',
      selectedStatus !== 'ALL' ? `Status: ${selectedStatus}` : '',
    ].filter(Boolean).join(' | ') || 'All visible bookings';

    const confirmed = window.confirm(
      `⚠️ CAUTION: You are about to permanently delete all ${count} booking(s) matching the current filter:\n\n[ ${filterDesc} ]\n\nTotal value: $${stats.revenue.toFixed(2)} USD.\n\nAre you sure you want to delete all of them?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const targetIds = filteredBookings.map((b) => b.id);
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }

      const idsToDelete = new Set(targetIds);
      setBookings((prev) => prev.filter((b) => !idsToDelete.has(b.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Filtered delete failed:', err);
      alert(err.message || 'Failed to delete filtered bookings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format filter label for the Invoice Header
  const invoiceFilterDescription = useMemo(() => {
    if (selectedIds.size > 0) {
      return `${selectedIds.size} Selected Reservation(s)`;
    }
    const parts: string[] = [];
    if (selectedTourId !== 'ALL') {
      const t = availableTours.find((x) => x.id === selectedTourId);
      parts.push(`Tour: ${t?.title || selectedTourId}`);
    }
    if (selectedCategory !== 'ALL') {
      parts.push(`Category: ${selectedCategory.toUpperCase()}`);
    }
    if (selectedMonth !== 'ALL') {
      parts.push(`Month: ${selectedMonth}`);
    }
    if (startDate || endDate) {
      parts.push(`Dates: ${startDate || 'From start'} to ${endDate || 'Present'}`);
    }
    if (selectedStatus !== 'ALL') {
      parts.push(`Status: ${selectedStatus}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'All Current Bookings';
  }, [selectedIds, selectedTourId, selectedCategory, selectedMonth, startDate, endDate, selectedStatus, availableTours]);

  // Which bookings to feed to the Invoice Modal
  const invoiceBookings = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredBookings.filter((b) => selectedIds.has(b.id));
    }
    return filteredBookings;
  }, [selectedIds, filteredBookings]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedTourId !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedMonth !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{stats.count}</span>
            <span className="text-[10px] text-slate-500">of {bookings.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF]">Total Travelers</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#00E5FF]">{stats.pax}</span>
            <span className="text-[10px] text-slate-400">Pax</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Total Revenue</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">${stats.revenue.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">USD</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Paid Online</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">${stats.paidOnline.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">Collected</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Due Cash on Arrival</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">${stats.dueArrival.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">To Collect</span>
          </div>
        </div>
      </div>

      {/* 2. Advanced Filtering Controls Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-5 shadow-2xl space-y-4">
        {/* Row 1: Search, Tour, Category, Status */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, phone, ref, hotel..."
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00E5FF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tour Dropdown */}
          <div>
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Tours ({availableTours.length})</option>
              {availableTours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Categories</option>
              {distinctCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Filters & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Month Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
                className="bg-transparent text-xs text-white outline-none"
              >
                <option value="ALL" className="bg-[#070F1E]">All Months</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m} className="bg-[#070F1E]">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className="rounded-xl border border-white/10 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00E5FF]"
                title="From Date"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className="rounded-xl border border-white/10 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00E5FF]"
                title="To Date"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Action Buttons: Invoice Generation & Bulk Delete */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Generate Invoice / Statement Button */}
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-3.5 py-2 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF] hover:text-[#070F1E]"
            >
              <FileText className="h-4 w-4" />
              <span>
                {selectedIds.size > 0
                  ? `Invoice (${selectedIds.size} Selected)`
                  : `Invoice / Statement (${filteredBookings.length})`}
              </span>
            </button>

            {/* Delete Selected Button */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 px-3.5 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Delete All Filtered Button (shown if filter is active and nothing is explicitly selected) */}
            {hasActiveFilters && selectedIds.size === 0 && filteredBookings.length > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAllFiltered}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete All Filtered ({filteredBookings.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bookings Table (Desktop) */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-white">No matching bookings found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search or date filter parameters.</p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#00E5FF] hover:bg-white/10"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="hidden rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="w-10 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="flex items-center justify-center text-slate-400 hover:text-white"
                    title={selectedIds.size === filteredBookings.length ? 'Deselect All' : 'Select All Filtered'}
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredBookings.length ? (
                      <CheckSquare className="h-4 w-4 text-[#00E5FF]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tour</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Guests</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Due Cash</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Hotel</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredBookings.map((b) => {
                const isSelected = selectedIds.has(b.id);
                return (
                  <React.Fragment key={b.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#00E5FF]/5' : 'hover:bg-white/[0.02]'
                      }`}
                      onClick={() => toggleExpand(b.id)}
                    >
                      {/* Checkbox Column */}
                      <td className="px-4 py-3" onClick={(e) => toggleSelect(b.id, e)}>
                        <button
                          type="button"
                          className={`flex items-center justify-center rounded transition-colors ${
                            isSelected ? 'text-[#00E5FF]' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>

                      {/* Expand Arrow Column */}
                      <td className="px-2 py-3">
                        {expandedId === b.id ? (
                          <ChevronDown className="h-4 w-4 text-[#00E5FF]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </td>

                      {/* Booking Reference */}
                      <td className="px-4 py-3 text-sm font-mono font-bold text-white whitespace-nowrap">
                        {b.bookingReference}
                      </td>

                      {/* Tour Title & Category */}
                      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-300">
                        <div className="truncate font-medium">{b.tourTitle}</div>
                        {b.category && (
                          <span className="text-[10px] uppercase text-[#00E5FF]">{b.category}</span>
                        )}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <div className="font-semibold text-white">{b.customerName}</div>
                        <div className="text-xs text-slate-400">{b.customerPhone}</div>
                      </td>

                      {/* Travel Date */}
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {b.travelDate}
                      </td>

                      {/* Guests */}
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span className="font-bold text-white">{b.guestCount}</span> Pax
                      </td>

                      {/* Total Price */}
                      <td className="px-4 py-3 text-sm font-bold text-white whitespace-nowrap">
                        ${b.totalPriceUSD.toFixed(2)}
                      </td>

                      {/* Due on Arrival */}
                      <td className="px-4 py-3 text-sm font-semibold text-amber-400 whitespace-nowrap">
                        ${(b.amountDueOnArrival || 0).toFixed(2)}
                      </td>

                      {/* Hotel */}
                      <td className="max-w-[140px] truncate px-4 py-3 text-sm text-slate-400">
                        {b.hotelName || '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 font-bold uppercase tracking-wider text-[10px] ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : b.status === 'COMPLETED'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : b.status === 'CANCELLED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <BookingRowActions
                          ticket={b}
                          onStatusChange={handleStatusChange}
                          onUpdateBooking={handleUpdateBooking}
                          onDeleteBooking={handleDeleteBooking}
                        />
                      </td>
                    </tr>

                    {/* Expandable Logistics Details */}
                    {expandedId === b.id && (
                      <tr key={`${b.id}-expanded`}>
                        <td colSpan={12} className="bg-white/[0.01] p-0">
                          <ExpandedDetails booking={b} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Mobile Cards View (<lg) */}
      <div className="space-y-4 lg:hidden">
        {filteredBookings.map((b) => {
          const isSelected = selectedIds.has(b.id);
          return (
            <div
              key={b.id}
              className={`space-y-3 rounded-2xl border p-4 transition-colors ${
                isSelected
                  ? 'border-[#00E5FF] bg-[#00E5FF]/5'
                  : 'border-white/10 bg-[#0B1528]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(b.id, e)}
                    className={isSelected ? 'text-[#00E5FF]' : 'text-slate-500'}
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                  <span className="font-mono text-sm font-bold text-[#00E5FF]">{b.bookingReference}</span>
                </div>

                <BookingRowActions
                  ticket={b}
                  onStatusChange={handleStatusChange}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Tour</span>
                  <p className="truncate font-medium text-white">{b.tourTitle}</p>
                </div>
                <div>
                  <span className="text-slate-500">Customer</span>
                  <p className="font-medium text-white">{b.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date</span>
                  <p className="text-slate-300">{b.travelDate}</p>
                </div>
                <div>
                  <span className="text-slate-500">Guests</span>
                  <p className="text-slate-300">{b.guestCount} Pax</p>
                </div>
                <div>
                  <span className="text-slate-500">Total Price</span>
                  <p className="font-bold text-white">${b.totalPriceUSD.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Due Cash</span>
                  <p className="font-bold text-amber-400">${(b.amountDueOnArrival || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(b.id)}
                  className="flex w-full items-center justify-between text-xs font-bold text-slate-400 hover:text-[#00E5FF] transition-colors"
                >
                  <span>View Details & Logistics</span>
                  {expandedId === b.id ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
                {expandedId === b.id && (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-slate-500">Hotel / Room</span>
                      <span className="font-semibold text-white">{b.hotelName} (Rm: {b.roomNumber || '—'})</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-slate-500">Pickup Directives</span>
                      <span className="font-semibold text-white">{b.pickupDirectives || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-slate-500">Flight Numbers</span>
                      <span className="font-semibold text-white">{b.flightNumbers || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Invoice & Statement Modal */}
      <BookingInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        bookings={invoiceBookings}
        filterLabel={invoiceFilterDescription}
      />
    </div>
  );
}
