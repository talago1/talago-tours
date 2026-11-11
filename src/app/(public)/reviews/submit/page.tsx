'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface VerifiedReviewContext {
  valid: boolean;
  bookingId?: string;
  tourId?: string;
  tourTitle?: string;
  tourSlug?: string;
  customerName?: string;
  coverImage?: string | null;
  alreadyReviewed?: boolean;
  error?: string;
}

function ReviewSubmitForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<VerifiedReviewContext | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setContext({
        valid: false,
        error: 'Missing review invitation token. Please check your invitation link.',
      });
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/public/reviews/verify-token?token=${encodeURIComponent(token!)}`);
        const data = (await res.json()) as VerifiedReviewContext;
        setContext(data);
        if (data.valid && data.customerName) {
          setCustomerName(data.customerName);
        }
      } catch {
        setContext({
          valid: false,
          error: 'Failed to verify review invitation. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !context?.bookingId || !context?.tourId) return;

    setSubmitError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setSubmitError('Please enter your name (minimum 2 characters).');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setSubmitError('Please write at least 10 characters describing your experience.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/public/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: context.bookingId,
          tourId: context.tourId,
          reviewToken: token,
          customerName: customerName.trim(),
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit your review.');
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const ratingLabels = ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'];

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Verifying review invitation...</p>
      </div>
    );
  }

  if (!context?.valid) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        {context?.alreadyReviewed ? (
          <>
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Review Already Received</h1>
            <p className="text-slate-600 text-sm mb-6">
              Thank you! You have already submitted a review for this excursion. Your feedback has been recorded.
            </p>
            {context.tourSlug && (
              <Link
                href={`/tours/${context.tourSlug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                View Excursion Page
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h1>
            <p className="text-slate-600 text-sm mb-6">
              {context?.error || 'This review invitation link is invalid or has expired.'}
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Browse Excursions
            </Link>
          </>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You, {customerName}!</h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Your verified traveler review for <strong className="text-slate-900">{context.tourTitle}</strong> has been
          submitted for moderation. We appreciate your feedback!
        </p>
        <div className="flex flex-col gap-3">
          {context.tourSlug && (
            <Link
              href={`/tours/${context.tourSlug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Back to Experience Page
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/tours"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Explore More Tours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto my-8 sm:my-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 p-6 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-teal-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Guest Review
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">How was your excursion?</h1>
          <p className="text-teal-100/90 text-sm mt-1 max-w-sm mx-auto line-clamp-2">
            {context.tourTitle}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Your Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                        filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-teal-700">
              {ratingLabels[rating - 1]}
            </p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label htmlFor="customerName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Name
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={50}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-sm outline-none transition"
              placeholder="e.g. Sarah M."
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="comment" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Review
              </label>
              <span className="text-[11px] text-slate-400">
                {comment.length} / 1000
              </span>
            </div>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900 text-sm outline-none transition leading-relaxed"
              placeholder="What did you enjoy most? How was your guide, transportation, or the highlights? (min. 10 characters)"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting review...
              </>
            ) : (
              'Submit Verified Review'
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Reviews are verified and moderated to keep Talago trustworthy for all travelers.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ReviewSubmitPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Suspense
        fallback={
          <div className="min-h-[500px] flex items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        }
      >
        <ReviewSubmitForm />
      </Suspense>
    </div>
  );
}

