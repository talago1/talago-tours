'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  DollarSign,
  Filter,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface BulkBookingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: string;
  initialMonth?: string;
  initialDateBasis?: 'travelDate' | 'createdAt';
  initialStatus?: string;
  initialTourId?: string;
  onCompleted: () => void;
}

interface BulkPreviewData {
  totalMatching: number;
  filters: {
    year: string;
    month: string;
    dateBasis: 'travelDate' | 'createdAt';
    status: string;
    tourId?: string;
  };
  statusCounts: {
    CONFIRMED: number;
    PENDING: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  financialSummary: {
    totalAmountUSD: number;
    paidOnlineUSD: number;
    dueOnArrivalUSD: number;
    financialRecordsToRetain: number;
    eligibleForHardDelete: number;
  };
  associatedTours: Array<{ id: string; title: string; count: number }>;
  uniqueCustomersCount: number;
}

const MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = ['ALL', '2026', '2025', '2024'];

export default function BulkBookingManagementModal({
  isOpen,
  onClose,
  initialYear = '2026',
  initialMonth = 'ALL',
  initialDateBasis = 'travelDate',
  initialStatus = 'ALL',
  initialTourId = 'ALL',
  onCompleted,
}: BulkBookingManagementModalProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [dateBasis, setDateBasis] = useState<'travelDate' | 'createdAt'>(initialDateBasis);
  const [status, setStatus] = useState(initialStatus);
  const [tourId, setTourId] = useState(initialTourId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BulkPreviewData | null>(null);

  const [actionType, setActionType] = useState<'ARCHIVE' | 'DELETE'>('ARCHIVE');
  const [confirmationInput, setConfirmationInput] = useState('');

  // Fetch preview whenever filters change
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      year,
      month,
      dateBasis,
      status,
      tourId,
    });

    fetch(`/api/admin/bookings/bulk?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch bulk preview.');
        return res.json();
      })
      .then((data: BulkPreviewData) => {
        setPreviewData(data);
      })
      .catch((err: any) => setError(err.message || 'Error loading preview.'))
      .finally(() => setLoading(false));
  }, [isOpen, year, month, dateBasis, status, tourId]);

  if (!isOpen) return null;

  const totalMatching = previewData?.totalMatching || 0;
  const expectedDeleteConfirm = `DELETE ${totalMatching} BOOKINGS`;

  const handleExecute = async () => {
    if (totalMatching === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        action: actionType === 'ARCHIVE' ? 'ARCHIVE_STATUS' : 'PERMANENT_DELETE',
        year,
        month,
        dateBasis,
        status,
        tourId,
      };

      if (actionType === 'DELETE') {
        payload.confirmationText = confirmationInput;
      }

      const res = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute bulk operation.');
      }

      alert(data.message || 'Bulk operation completed.');
      onCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during bulk operation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Month-Based Bulk Booking Management</h3>
              <p className="text-xs text-slate-400">
                Filter and manage reservations across the entire dataset with statutory financial safeguards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Filter Controls Bar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#00E5FF] mb-3 block">
              1. Define Filter Scope:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Date Basis Toggle */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Date Basis</label>
                <select
                  value={dateBasis}
                  onChange={(e) => setDateBasis(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none focus:border-[#00E5FF]"
                >
                  <option value="travelDate">Travel / Departure Date</option>
                  <option value="createdAt">Booking Creation Date</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none focus:border-[#00E5FF]"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y === 'ALL' ? 'All Years' : y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none focus:border-[#00E5FF]"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none focus:border-[#00E5FF]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit & Dataset Breakdown */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-[#00E5FF] mb-2" />
              <p className="text-xs">Calculating full dataset matching criteria...</p>
            </div>
          ) : previewData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  2. Dataset Impact Preview:
                </span>
                <span className="rounded-full bg-[#00E5FF]/10 px-3 py-0.5 text-xs font-bold text-[#00E5FF] border border-[#00E5FF]/20">
                  {totalMatching} Matching Reservation(s)
                </span>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Bookings</span>
                  <span className="text-2xl font-black text-white">{totalMatching}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {previewData.statusCounts.CONFIRMED} conf · {previewData.statusCounts.PENDING} pend
                  </span>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Volume</span>
                  <span className="text-2xl font-black text-[#FFD700]">
                    ${previewData.financialSummary.totalAmountUSD}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ${previewData.financialSummary.paidOnlineUSD} paid online
                  </span>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Unique Travelers</span>
                  <span className="text-2xl font-black text-[#00E5FF]">
                    {previewData.uniqueCustomersCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Across {previewData.associatedTours.length} experience(s)
                  </span>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Retention Safeguard</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {previewData.financialSummary.financialRecordsToRetain}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Financial records retained
                  </span>
                </div>
              </div>

              {/* Associated Tours Breakdown */}
              {previewData.associatedTours.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">Affected Experiences:</p>
                  <div className="flex flex-wrap gap-2">
                    {previewData.associatedTours.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300"
                      >
                        {t.title} <strong className="text-[#00E5FF]">({t.count})</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Selection */}
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 block">
                  3. Select Bulk Action:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType('ARCHIVE')}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      actionType === 'ARCHIVE'
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white shadow-lg shadow-[#00E5FF]/10'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Archive className={`h-4 w-4 ${actionType === 'ARCHIVE' ? 'text-[#00E5FF]' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">Option A: Move to Archive / Cancelled</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Updates matching bookings to <strong>CANCELLED</strong> status. Fully recoverable and preserves all historical records.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('DELETE')}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      actionType === 'DELETE'
                        ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Trash2 className={`h-4 w-4 ${actionType === 'DELETE' ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">Option B: Permanently Delete Eligible Records</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Permanently purges non-financial bookings. <strong>{previewData.financialSummary.financialRecordsToRetain} paid transaction records will be retained</strong> for statutory compliance.
                    </p>
                  </button>
                </div>
              </div>

              {/* Action Confirmation Panel */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                {actionType === 'ARCHIVE' ? (
                  <div className="flex items-center gap-3 text-xs text-emerald-300">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                    <p>
                      Clicking confirm will update all <strong>{totalMatching}</strong> matching bookings to status CANCELLED. Receipts and customer profiles remain intact.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-amber-300">
                      <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <p>
                        Financial retention safeguard: <strong>{previewData.financialSummary.financialRecordsToRetain}</strong> paid records will be retained. <strong>{previewData.financialSummary.eligibleForHardDelete}</strong> eligible bookings will be deleted.
                      </p>
                    </div>
                    <label className="text-xs font-bold text-slate-300 block">
                      Type <span className="font-mono text-rose-400">{expectedDeleteConfirm}</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      placeholder={expectedDeleteConfirm}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-black/20">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={
              submitting ||
              loading ||
              totalMatching === 0 ||
              (actionType === 'DELETE' &&
                confirmationInput.trim().toUpperCase() !== expectedDeleteConfirm &&
                confirmationInput.trim().toUpperCase() !== 'DELETE')
            }
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              actionType === 'DELETE'
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-[#00E5FF] text-[#070F1E] hover:bg-[#00C2E0]'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executing Batch...</span>
              </>
            ) : actionType === 'ARCHIVE' ? (
              <span>Archive {totalMatching} Bookings</span>
            ) : (
              <span>Permanently Delete Eligible ({previewData?.financialSummary.eligibleForHardDelete || 0})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
