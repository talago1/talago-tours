'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquareWarning, ArrowLeft, Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  listAdminReviews,
  moderateAdminReview,
  type AdminReview,
} from './actions';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_TABS: (ReviewStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewStatus | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moderating, setModerating] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminReviews(activeTab, page);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = useCallback(async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setModerating(reviewId);
    try {
      await moderateAdminReview(reviewId, status);

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, status } : r,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to moderate review');
    } finally {
      setModerating(null);
    }
  }, []);

  const handleTabChange = useCallback((tab: ReviewStatus | 'ALL') => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-10">
          <nav className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            <Link href="/admin" className="hover:text-[#06B6D4] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#EAB308]">Reviews</span>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">Moderation Hub</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">
                Guest Review Desk
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Audit incoming ratings, manage testimonial catalog presence, and trigger automated listing aggregate updates in real time.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-slate-200 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Desk
            </Link>
          </div>
        </div>

        {/* Filters Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-[#EAB308] text-[#070F1E] shadow-xl shadow-[#EAB308]/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'ALL' ? 'All Reviews' : tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Review list grid / list */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Guest Info</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Tour / Booking</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-[#06B6D4]" />
                        <span>Fetching review inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      No reviews found matching standard criteria.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="text-slate-300 transition-all duration-300 ease-in-out hover:bg-white/[0.03]">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-black text-white">{review.customerName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating ? 'fill-[#EAB308] text-[#EAB308]' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-white max-w-[200px] truncate">{review.tourTitle}</p>
                          <p className="mt-1 text-xs text-[#06B6D4]">REF: {review.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-md">
                        <p className="line-clamp-2 text-sm leading-6 text-slate-400" title={review.comment}>
                          “{review.comment}”
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                            review.status === 'APPROVED'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : review.status === 'REJECTED'
                              ? 'bg-red-400/10 text-red-300'
                              : 'bg-[#EAB308]/10 text-[#EAB308]'
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {review.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleModerate(review.id, 'APPROVED')}
                              disabled={moderating === review.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500 hover:text-[#070F1E] hover:border-transparent transition-all duration-300 disabled:opacity-50"
                              title="Approve Review"
                            >
                              {moderating === review.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModerate(review.id, 'REJECTED')}
                              disabled={moderating === review.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500 hover:text-[#070F1E] hover:border-transparent transition-all duration-300 disabled:opacity-50"
                              title="Reject Review"
                            >
                              {moderating === review.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ThumbsDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              Prev
            </button>
            <span className="text-xs font-black tracking-wider text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
