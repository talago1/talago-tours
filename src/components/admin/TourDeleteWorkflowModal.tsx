'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface TourDeleteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle?: string;
  onSuccess: (message: string) => void;
}

interface AuditData {
  tour: {
    id: string;
    slug: string;
    title: string;
    category: string | null;
    destination?: string;
    destinationId?: string | null;
    status: string | null;
    durationHours: number;
    adultPrice: number;
  };
  stats: {
    totalBookings: number;
    bookingsByStatus: Record<string, number>;
    totalRevenueUSD: number;
    totalPaidOnlineUSD: number;
    financialTransactionsCount: number;
    uniqueCustomersCount: number;
    totalReviews: number;
    ratingAverage: number;
  };
  reviews: Array<{
    id: string;
    reviewerName?: string | null;
    customerName: string;
    rating: number;
    comment?: string | null;
    originalText?: string | null;
    status: string;
    isVisible: boolean;
    createdAt: string;
  }>;
  candidateReplacementTours: Array<{
    id: string;
    slug: string;
    title: string;
    category: string | null;
    destination: string;
    destinationId?: string | null;
    adultPrice: number;
    durationHours: number;
    isSameDestination: boolean;
  }>;
}

type WorkflowMode = 'OPTION_A' | 'OPTION_B' | 'OPTION_C';

export default function TourDeleteWorkflowModal({
  isOpen,
  onClose,
  tourId,
  tourTitle,
  onSuccess,
}: TourDeleteWorkflowModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);

  const [selectedMode, setSelectedMode] = useState<WorkflowMode>('OPTION_A');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [replacementTourId, setReplacementTourId] = useState('');
  const [reviewStrategy, setReviewStrategy] = useState<'TRANSFER_ALL' | 'TRANSFER_SELECTED' | 'KEEP_ON_OLD' | 'HIDE_ALL'>('TRANSFER_ALL');
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());

  // Fetch tour audit data whenever modal opens
  useEffect(() => {
    if (!isOpen || !tourId) return;

    setLoading(true);
    setError(null);
    setConfirmationInput('');
    setReplacementTourId('');

    fetch(`/api/admin/tours/${tourId}/delete-workflow`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tour deletion audit.');
        return res.json();
      })
      .then((data: AuditData) => {
        setAuditData(data);
        if (data.candidateReplacementTours.length > 0) {
          setReplacementTourId(data.candidateReplacementTours[0].id);
        }
        if (data.reviews.length > 0) {
          setSelectedReviewIds(new Set(data.reviews.map((r) => r.id)));
        }
      })
      .catch((err: any) => setError(err.message || 'Error loading audit.'))
      .finally(() => setLoading(false));
  }, [isOpen, tourId]);

  if (!isOpen) return null;

  const currentTitle = auditData?.tour.title || tourTitle || 'Experience';
  const hasBookings = (auditData?.stats.totalBookings || 0) > 0;
  const hasPaidTransactions = (auditData?.stats.financialTransactionsCount || 0) > 0;

  const handleExecute = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let payload: Record<string, any> = {};

      if (selectedMode === 'OPTION_A') {
        payload = { mode: 'OPTION_A_PRESERVE_BOOKINGS' };
      } else if (selectedMode === 'OPTION_B') {
        payload = {
          mode: 'OPTION_B_HARD_DELETE',
          confirmationText: confirmationInput,
        };
      } else if (selectedMode === 'OPTION_C') {
        payload = {
          mode: 'OPTION_C_REPLACE_TRANSFER',
          replacementTourId,
          reviewMigrationStrategy: reviewStrategy,
          selectedReviewIds: Array.from(selectedReviewIds),
        };
      }

      const res = await fetch(`/api/admin/tours/${tourId}/delete-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute tour action.');
      }

      onSuccess(data.message || 'Action executed successfully.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReviewSelect = (id: string) => {
    setSelectedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedReplacementTour = auditData?.candidateReplacementTours.find(
    (t) => t.id === replacementTourId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Delete or Replace Tour</h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Managing: <span className="text-white font-semibold">{currentTitle}</span>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF] mb-3" />
              <p className="text-xs font-semibold">Auditing tour records and reservations...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {/* Tour Audit Summary Card */}
              {auditData && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Bookings</span>
                      <span className="text-xl font-black text-white">{auditData.stats.totalBookings}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {auditData.stats.bookingsByStatus.CONFIRMED || 0} confirmed
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Revenue</span>
                      <span className="text-xl font-black text-[#FFD700]">
                        ${auditData.stats.totalRevenueUSD}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ${auditData.stats.totalPaidOnlineUSD} paid online
                      </span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Customers</span>
                      <span className="text-xl font-black text-[#00E5FF]">
                        {auditData.stats.uniqueCustomersCount}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Unique travelers</span>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Reviews</span>
                      <span className="text-xl font-black text-amber-400">
                        {auditData.stats.totalReviews}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ★ {auditData.stats.ratingAverage.toFixed(1)} avg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selection Tabs */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Choose Tour Lifecycle Action:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMode('OPTION_A')}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      selectedMode === 'OPTION_A'
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white shadow-lg shadow-[#00E5FF]/10'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Archive className={`h-4 w-4 ${selectedMode === 'OPTION_A' ? 'text-[#00E5FF]' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">Option A (Recommended)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Permanently remove from catalog. <strong>Preserve all bookings &amp; receipts</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('OPTION_C')}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      selectedMode === 'OPTION_C'
                        ? 'border-[#FFD700] bg-[#FFD700]/10 text-white shadow-lg shadow-[#FFD700]/10'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className={`h-4 w-4 ${selectedMode === 'OPTION_C' ? 'text-[#FFD700]' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">Option C (Replace)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Transfer bookings &amp; reviews to a <strong>replacement tour</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMode('OPTION_B')}
                    className={`rounded-2xl border p-3.5 text-left transition-all ${
                      selectedMode === 'OPTION_B'
                        ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className={`h-4 w-4 ${selectedMode === 'OPTION_B' ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-black">Option B (Hard Delete)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Permanent record purge. Requires exact name confirmation.
                    </p>
                  </button>
                </div>
              </div>

              {/* Mode Details Pane */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                {/* ── OPTION A: Preserve Bookings ── */}
                {selectedMode === 'OPTION_A' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Safe Catalog Removal (Full Data Retention)
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          This tour will be permanently removed from all public search listings, sitemaps, category pages, and active admin lists. Its original URL slug will be immediately freed up.
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1.5 border-t border-white/5 pt-3 list-disc pl-5">
                      <li>Customer reservations, booking references, and vouchers remain 100% accessible.</li>
                      <li>Payment and refund audit records are safely retained.</li>
                      <li>Customer accounts and past trip histories remain linked.</li>
                    </ul>
                  </div>
                )}

                {/* ── OPTION B: Hard Delete ── */}
                {selectedMode === 'OPTION_B' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5 text-rose-400">
                      <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Permanent Deletion &amp; Record Purge
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          This action permanently deletes the tour record and eligible associated items. This cannot be undone.
                        </p>
                      </div>
                    </div>

                    {hasPaidTransactions && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                        <strong className="block text-amber-300 font-bold mb-1">
                          ⚠️ Accounting Protection Active:
                        </strong>
                        This tour has {auditData?.stats.financialTransactionsCount} reservation(s) with completed payments. Statutory financial accounting regulations prohibit hard-deleting paid transactions. Use Option A to remove the tour while preserving accounting records.
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Type the exact tour title to confirm deletion:
                      </label>
                      <input
                        type="text"
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        placeholder={currentTitle}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* ── OPTION C: Replace & Transfer ── */}
                {selectedMode === 'OPTION_C' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5 text-[#FFD700]">
                      <RefreshCw className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Replace Tour &amp; Reassign Compatible Bookings
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Reassigns all existing reservations from this tour to a replacement tour. Customer booked prices, dates, and references are preserved.
                        </p>
                      </div>
                    </div>

                    {/* Replacement Tour Dropdown */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <label className="text-xs font-bold text-slate-300 block">
                        Select Replacement Tour:
                      </label>
                      <select
                        value={replacementTourId}
                        onChange={(e) => setReplacementTourId(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFD700]"
                      >
                        {auditData?.candidateReplacementTours.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.destination} · {t.durationHours}h · ${t.adultPrice})
                            {t.isSameDestination ? ' [Same Destination]' : ''}
                          </option>
                        ))}
                      </select>

                      {selectedReplacementTour && (
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 mt-2 text-xs text-slate-300 flex items-center justify-between">
                          <span>
                            Target: <strong>{selectedReplacementTour.title}</strong>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {selectedReplacementTour.destination} · {selectedReplacementTour.durationHours}h
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Review Migration Controls */}
                    {auditData && auditData.reviews.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-white/5">
                        <label className="text-xs font-bold text-slate-300 block">
                          Review Migration Policy ({auditData.reviews.length} authentic reviews):
                        </label>
                        <select
                          value={reviewStrategy}
                          onChange={(e) => setReviewStrategy(e.target.value as any)}
                          className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFD700]"
                        >
                          <option value="TRANSFER_ALL">
                            Transfer all {auditData.reviews.length} reviews to replacement tour
                          </option>
                          <option value="TRANSFER_SELECTED">
                            Manually select reviews to transfer ({selectedReviewIds.size} selected)
                          </option>
                          <option value="KEEP_ON_OLD">
                            Keep reviews on old historical tour (do not transfer)
                          </option>
                          <option value="HIDE_ALL">
                            Preserve reviews in database but hide from public view
                          </option>
                        </select>

                        {reviewStrategy === 'TRANSFER_SELECTED' && (
                          <div className="max-h-48 overflow-y-auto space-y-2 rounded-xl border border-white/10 bg-[#070F1E] p-3">
                            {auditData.reviews.map((r) => (
                              <label
                                key={r.id}
                                className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded hover:bg-white/5"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedReviewIds.has(r.id)}
                                  onChange={() => toggleReviewSelect(r.id)}
                                  className="mt-0.5 rounded border-white/20 text-[#00E5FF] focus:ring-0"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 font-bold text-white">
                                    <span>{r.reviewerName || r.customerName}</span>
                                    <span className="text-amber-400">★ {r.rating}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 line-clamp-1">{r.comment || r.originalText}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
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
              (selectedMode === 'OPTION_B' &&
                (hasPaidTransactions ||
                  confirmationInput.trim().toLowerCase() !== currentTitle.trim().toLowerCase())) ||
              (selectedMode === 'OPTION_C' && !replacementTourId)
            }
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMode === 'OPTION_B'
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : selectedMode === 'OPTION_C'
                ? 'bg-[#FFD700] text-[#070F1E] hover:bg-[#EAB308]'
                : 'bg-[#00E5FF] text-[#070F1E] hover:bg-[#00C2E0]'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : selectedMode === 'OPTION_A' ? (
              <span>Permanently Remove &amp; Preserve Bookings</span>
            ) : selectedMode === 'OPTION_C' ? (
              <span>Confirm Tour &amp; Booking Replacement</span>
            ) : (
              <span>Permanently Delete Records</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
