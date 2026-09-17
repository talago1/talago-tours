'use client';

import React from 'react';
import type { ActiveQueueTicket } from '@/types/booking';
import { X, Printer, Download, DollarSign, Users, Calendar, ShieldCheck, CheckCircle2, Clock, Ban } from 'lucide-react';

interface BookingInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: ActiveQueueTicket[];
  filterLabel?: string;
}

export default function BookingInvoiceModal({
  isOpen,
  onClose,
  bookings,
  filterLabel,
}: BookingInvoiceModalProps) {
  if (!isOpen) return null;

  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalGuests = bookings.reduce((sum, b) => sum + (b.guestCount || 0), 0);
  const totalAdults = bookings.reduce((sum, b) => sum + (b.adultsCount || 0), 0);
  const totalChildren = bookings.reduce((sum, b) => sum + (b.childrenCount || 0), 0);
  const totalAmount = bookings.reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0);
  const totalPaidOnline = bookings.reduce((sum, b) => sum + (b.amountPaidOnline || 0), 0);
  const totalDueArrival = bookings.reduce((sum, b) => sum + (b.amountDueOnArrival || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Booking Reference',
      'Travel Date',
      'Customer Name',
      'Phone (WhatsApp)',
      'Email',
      'Hotel',
      'Room Number',
      'Tour Title',
      'Category',
      'Total Guests',
      'Adults',
      'Children',
      'Total Price (USD)',
      'Paid Online (USD)',
      'Due on Arrival (USD)',
      'Status',
      'Pickup Time',
    ];

    const rows = bookings.map((b) => [
      `"${b.bookingReference}"`,
      `"${b.travelDate}"`,
      `"${b.customerName.replace(/"/g, '""')}"`,
      `"${b.customerPhone}"`,
      `"${b.customerEmail || ''}"`,
      `"${(b.hotelName || '').replace(/"/g, '""')}"`,
      `"${b.roomNumber || ''}"`,
      `"${b.tourTitle.replace(/"/g, '""')}"`,
      `"${b.category || ''}"`,
      b.guestCount,
      b.adultsCount || 0,
      b.childrenCount || 0,
      b.totalPriceUSD,
      b.amountPaidOnline || 0,
      b.amountDueOnArrival || 0,
      `"${b.status}"`,
      `"${b.pickupTime || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `talago-invoice-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0B1528] text-white shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:p-6 print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-[#00E5FF] animate-pulse" />
            <h2 className="text-lg font-bold text-white">Booking Statement & Billing Invoice</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-4 py-2 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF] hover:text-[#070F1E]"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div id="printable-invoice" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/10 pb-6 print:border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-widest text-[#00E5FF] print:text-sky-600">TALAGO</span>
                <span className="text-xs uppercase tracking-widest text-slate-400 print:text-gray-500">Luxury Tours & Safaris</span>
              </div>
              <p className="mt-1 text-xs text-slate-400 print:text-gray-600">
                Red Sea Governorate, Egypt | concierge@talago-tours.com
              </p>
              {filterLabel && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-2.5 py-1 text-[11px] font-semibold text-[#00E5FF] print:border-gray-300 print:bg-gray-100 print:text-gray-700">
                  <Calendar className="h-3 w-3" />
                  <span>Scope: {filterLabel}</span>
                </div>
              )}
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400 print:text-gray-500">Official Statement</p>
              <p className="text-xl font-bold font-mono text-white print:text-black">{invoiceNumber}</p>
              <p className="text-xs text-slate-400 print:text-gray-600">Date Issued: {issueDate}</p>
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 print:border-gray-200 print:bg-gray-50">
              <p className="text-[11px] font-medium text-slate-400 print:text-gray-600">Total Bookings</p>
              <p className="mt-1 text-xl font-black text-white print:text-black">{bookings.length}</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">Verified reservations</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 print:border-gray-200 print:bg-gray-50">
              <p className="text-[11px] font-medium text-slate-400 print:text-gray-600">Total Travelers</p>
              <p className="mt-1 text-xl font-black text-[#00E5FF] print:text-sky-700">{totalGuests} Pax</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">{totalAdults} Adults, {totalChildren} Children</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 print:border-gray-200 print:bg-gray-50">
              <p className="text-[11px] font-medium text-slate-400 print:text-gray-600">Online Paid</p>
              <p className="mt-1 text-xl font-black text-emerald-400 print:text-emerald-700">${totalPaidOnline.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">Confirmed transactions</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 print:border-gray-200 print:bg-gray-50">
              <p className="text-[11px] font-medium text-slate-400 print:text-gray-600">Due On Arrival (Cash)</p>
              <p className="mt-1 text-xl font-black text-amber-400 print:text-amber-700">${totalDueArrival.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500 print:text-gray-500">To collect upon pickup</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 print:border-gray-300">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/5 font-semibold text-slate-300 print:bg-gray-100 print:text-gray-800 print:border-gray-300">
                <tr>
                  <th className="px-3 py-2.5">Ref #</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Guest & WhatsApp</th>
                  <th className="px-3 py-2.5">Hotel / Room</th>
                  <th className="px-3 py-2.5">Tour Title</th>
                  <th className="px-3 py-2.5 text-center">Pax</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5 text-right">Online</th>
                  <th className="px-3 py-2.5 text-right">Due Cash</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                    <td className="px-3 py-2.5 font-mono font-bold text-white print:text-black">
                      {b.bookingReference}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-300 print:text-gray-700">
                      {b.travelDate}
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 print:text-gray-900">
                      <div className="font-semibold">{b.customerName}</div>
                      <div className="text-[11px] text-slate-400 print:text-gray-500">{b.customerPhone}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 print:text-gray-700">
                      <div>{b.hotelName || '—'}</div>
                      {b.roomNumber && <div className="text-[11px] text-slate-400 print:text-gray-500">Rm: {b.roomNumber}</div>}
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px] truncate text-slate-300 print:text-gray-800" title={b.tourTitle}>
                      <div className="font-medium truncate">{b.tourTitle}</div>
                      {b.category && <span className="text-[10px] text-[#00E5FF] print:text-sky-600 uppercase">{b.category}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-white print:text-black">
                      {b.guestCount}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-white print:text-black">
                      ${b.totalPriceUSD.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-emerald-400 print:text-emerald-700">
                      ${(b.amountPaidOnline || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-amber-400 print:text-amber-700">
                      ${(b.amountDueOnArrival || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
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
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-white/20 bg-white/5 font-bold text-white print:border-gray-400 print:bg-gray-100 print:text-black">
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-right uppercase tracking-wider">
                    Total Statement Summary:
                  </td>
                  <td className="px-3 py-3 text-center">{totalGuests}</td>
                  <td className="px-3 py-3 text-right text-[#00E5FF] print:text-sky-700">${totalAmount.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-emerald-400 print:text-emerald-700">${totalPaidOnline.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right text-amber-400 print:text-amber-700">${totalDueArrival.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-slate-500 border-t border-white/5 pt-4 print:text-gray-500 print:border-gray-200">
            <p>Generated automatically by TALAGO Tours Operations & Concierge System.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
