'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Calendar,
  SendHorizontal,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    bookingReference: string;
    accessToken?: string;
    travelDate: string | Date;
    tourTitle?: string;
    freeCancellationHours?: number;
  };
  onSuccess: (data: any) => void;
}

const CANCELLATION_REASONS = [
  { id: 'CHANGE_OF_PLANS', label: 'Change of travel plans' },
  { id: 'FLIGHT_DELAY', label: 'Flight delay or transportation issues' },
  { id: 'MEDICAL_EMERGENCY', label: 'Health or medical emergency' },
  { id: 'WEATHER_CONCERNS', label: 'Weather or safety concerns' },
  { id: 'PERSONAL_EMERGENCY', label: 'Family or personal emergency' },
  { id: 'OTHER', label: 'Other reason' },
];

export default function CancellationModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: CancellationModalProps) {
  const { dict } = useLanguage();
  const [reason, setReason] = useState(CANCELLATION_REASONS[0].label);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const departureTime = new Date(booking.travelDate).getTime();
  const now = Date.now();
  const hoursRemaining = Math.max(0, Math.round((departureTime - now) / (3600 * 1000)));
  const freeHours = booking.freeCancellationHours ?? 24;
  const isWithinFreeWindow = hoursRemaining >= freeHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/public/bookings/cancel-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          bookingReference: booking.bookingReference,
          accessToken: booking.accessToken,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit cancellation request');
      }

      setSubmittedSuccess(data.message || 'Cancellation request submitted.');
      onSuccess(data.cancellationRequest);
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setError(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F1E]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-8 shadow-2xl shadow-black/80 text-left my-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Request Booking Cancellation
              </h2>
              <p className="text-xs font-mono font-bold text-[#00E5FF] mt-0.5">
                Ref: {booking.bookingReference}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">Request Submitted</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {submittedSuccess}
            </p>
            <p className="text-[11px] text-slate-500 pt-2 font-mono">
              The operations team has been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tour & Timing Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2 text-xs">
              {booking.tourTitle && (
                <p className="font-bold text-white text-sm line-clamp-1">{booking.tourTitle}</p>
              )}
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>
                  Departure Date: {new Date(booking.travelDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Time remaining: ~{hoursRemaining} hours</span>
              </div>
            </div>

            {/* Policy Banner */}
            {isWithinFreeWindow ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <p className="font-bold text-white">Free Cancellation Eligible</p>
                  <p className="mt-0.5 text-emerald-200/90 leading-relaxed text-[11px]">
                    You are requesting cancellation {hoursRemaining} hours before departure. This tour includes free cancellation up to {freeHours} hours prior.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-bold text-white">Late Cancellation Policy Notice</p>
                  <p className="mt-0.5 text-amber-200/90 leading-relaxed text-[11px]">
                    Departure is in {hoursRemaining}h, which is within the {freeHours}-hour cutoff window. Your request will be reviewed by the operations team.
                  </p>
                </div>
              </div>
            )}

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Reason for cancellation *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white focus:border-[#00E5FF] focus:outline-none"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r.id} value={r.label} className="bg-[#0B1528] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes / Details */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain any details that can help our operations team assist you..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
              >
                Keep Booking
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

