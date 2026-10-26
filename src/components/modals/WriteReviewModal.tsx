'use client';

import { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  tourTitle: string;
  initialBookingId?: string;
  initialBookingAccessToken?: string;
  initialCustomerName?: string;
  onSuccess?: () => void;
}

export default function WriteReviewModal({
  isOpen,
  onClose,
  tourId,
  tourTitle,
  initialBookingId = '',
  initialBookingAccessToken = '',
  initialCustomerName = '',
  onSuccess,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError('Please provide your name (minimum 2 characters).');
      return;
    }

    if (!initialBookingId || !initialBookingAccessToken) {
      setError('This review must be opened from one of your verified bookings.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setError('Please write at least a few words describing your experience (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/public/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId,
          bookingId: initialBookingId,
          bookingAccessToken: initialBookingAccessToken,
          customerName: customerName.trim(),
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setIsSuccess(false);
    setError(null);
    setComment('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0B1528] p-6 sm:p-8 shadow-2xl shadow-black/80 text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h3 className="text-2xl font-black text-white">Thank You for Your Review!</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your feedback for <span className="text-[#00E5FF] font-semibold">{tourTitle}</span> has been received and verified. It helps travelers worldwide make informed choices!
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-full bg-[#00E5FF] px-8 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] transition-all hover:scale-105 shadow-lg shadow-[#00E5FF]/20"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-[#FFD700] mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Guest Experience
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Write a Review</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 truncate">
                {tourTitle}
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-115 focus:outline-none"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            isFilled
                              ? 'fill-[#FFD700] text-[#FFD700]'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-bold text-[#FFD700]">
                    {rating === 5 && 'Excellent (5/5)'}
                    {rating === 4 && 'Very Good (4/5)'}
                    {rating === 3 && 'Average (3/5)'}
                    {rating === 2 && 'Poor (2/5)'}
                    {rating === 1 && 'Terrible (1/5)'}
                  </span>
                </div>
              </div>

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Name on verified booking
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00E5FF]"
                />
              </div>

              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
                This review is linked to your verified booking and will be moderated before publication.
              </p>

              {/* Comment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you love most about the experience? Tips for other travelers?"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-[#00E5FF] resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-3.5 text-xs font-black uppercase tracking-wider text-[#070F1E] transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-[#00E5FF]/20 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying & Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Submit Verified Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
