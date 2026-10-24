'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Filter,
  Upload,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TourOption {
  id: string;
  slug: string;
  title: string;
}

interface AdminReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  tourId: string;
  tourTitle: string;
  tourSlug?: string;
}

const STATUS_TABS: (ReviewStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [tours, setTours] = useState<TourOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<ReviewStatus | 'ALL'>('ALL');
  const [selectedTourId, setSelectedTourId] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<AdminReviewItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tourId: '',
    customerName: '',
    rating: 5,
    comment: '',
    status: 'APPROVED' as ReviewStatus,
  });

  // CSV Importer State
  const [csvPanelOpen, setCsvPanelOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    imported: number;
    queued: number;
    errors: number;
    affectedTours: number;
    queuedRows: { row: number; tourName: string; reviewerName: string; reason: string }[];
    errorRows: { row: number; reason: string }[];
  } | null>(null);
  const csvDropRef = useRef<HTMLDivElement>(null);

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const fd = new FormData();
      fd.append('file', csvFile);
      const res = await fetch('/api/admin/reviews/import-csv', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setCsvResult(data);
      setCsvFile(null);
      if (data.imported > 0) {
        setSuccessMsg(`✅ ${data.imported} review${data.imported > 1 ? 's' : ''} imported across ${data.affectedTours} tour${data.affectedTours > 1 ? 's' : ''}. Ratings recalculated.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        fetchReviews();
      }
    } catch (e: any) {
      setError(e.message || 'CSV import failed');
    } finally {
      setCsvUploading(false);
    }
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.set('status', activeTab);
      if (selectedTourId !== 'ALL') params.set('tourId', selectedTourId);
      params.set('page', page.toString());
      params.set('limit', '30');

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();

      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      if (data.tours && data.tours.length > 0) {
        setTours(data.tours);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong loading reviews');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedTourId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Quick Moderate (Approve/Reject)
  const handleModerate = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setModeratingId(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, status }),
      });
      if (!res.ok) throw new Error('Failed to moderate review');

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
      setSuccessMsg(`Review marked as ${status}`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      setError(e.message || 'Failed to moderate review');
    } finally {
      setModeratingId(null);
    }
  };

  // Handle Delete Review
  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this review? Tour ratings will be automatically updated.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete review');

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setSuccessMsg('Review deleted and tour score updated');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      setError(e.message || 'Failed to delete review');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      tourId: selectedTourId !== 'ALL' ? selectedTourId : (tours[0]?.id || ''),
      customerName: '',
      rating: 5,
      comment: '',
      status: 'APPROVED',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (review: AdminReviewItem) => {
    setEditingReview(review);
    setFormData({
      tourId: review.tourId,
      customerName: review.customerName,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
    });
    setIsEditModalOpen(true);
  };

  // Submit Add Form
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tourId || !formData.customerName.trim() || !formData.comment.trim()) {
      alert('Please fill out all required fields');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create review');

      setIsAddModalOpen(false);
      setSuccessMsg('Review created successfully and tour rating recalculated!');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchReviews();
    } catch (e: any) {
      alert(e.message || 'Error creating review');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingReview.id,
          customerName: formData.customerName,
          rating: formData.rating,
          comment: formData.comment,
          status: formData.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review');

      setIsEditModalOpen(false);
      setEditingReview(null);
      setSuccessMsg('Review updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
      fetchReviews();
    } catch (e: any) {
      alert(e.message || 'Error updating review');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            <Link href="/admin" className="hover:text-[#06B6D4] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#EAB308]">Reviews Moderation & Management</span>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">
                Customer Testimonial Desk
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-5xl">
                Verified Reviews Desk
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Create authentic reviews, audit guest feedback, and manage tour star ratings. Approved reviews automatically calibrate the public rating average in real time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCsvPanelOpen((p) => !p)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#EAB308] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-xl shadow-[#EAB308]/20 transition-all hover:bg-[#FFE55C]"
              >
                <Plus className="h-4 w-4" />
                Add Review
              </button>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0B1528] px-5 py-3 text-sm font-black text-slate-200 transition-all hover:border-[#06B6D4]/40 hover:bg-[#06B6D4]/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* CSV Import Panel */}
        {csvPanelOpen && (
          <div className="mb-6 rounded-3xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#00E5FF]" />
                  Bulk Review Import (CSV)
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Import real reviews from GetYourGuide, Viator, TripAdvisor, Google, etc.
                  All imported rows are set to <strong className="text-white">Approved + Visible</strong>.
                </p>
              </div>
              <button onClick={() => setCsvPanelOpen(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Download */}
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
              <p className="font-bold text-slate-300 mb-1">Required CSV columns (header row):</p>
              <code className="font-mono text-[#00E5FF] text-[11px] break-all">
                tour_name,tour_slug,source,reviewer_name,country,rating,review_date,original_text,original_language,translated_text,source_url
              </code>
              <p className="mt-2"><strong>source</strong> must be one of: TALAGO, GETYOURGUIDE, VIATOR, TRIPADVISOR, SPUTNIK8, TRIPSTER, BOOKING_COM, GOOGLE, OTHER</p>
              <p><strong>country</strong>: 2-letter ISO code (DE, RU, GB, US…). <strong>review_date</strong>: YYYY-MM-DD. <strong>original_language</strong>: en, de, ru…</p>
            </div>

            {/* File Drop Zone */}
            <div
              ref={csvDropRef}
              onDragOver={(e) => { e.preventDefault(); csvDropRef.current?.classList.add('border-[#00E5FF]'); }}
              onDragLeave={() => csvDropRef.current?.classList.remove('border-[#00E5FF]')}
              onDrop={(e) => {
                e.preventDefault();
                csvDropRef.current?.classList.remove('border-[#00E5FF]');
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith('.csv')) setCsvFile(f);
              }}
              className="mb-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] py-10 text-center transition-colors cursor-pointer hover:border-white/30"
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <FileText className="h-8 w-8 text-slate-500" />
              {csvFile ? (
                <p className="text-sm font-bold text-white">{csvFile.name} <span className="text-xs text-slate-400">({(csvFile.size / 1024).toFixed(1)} KB)</span></p>
              ) : (
                <p className="text-sm text-slate-400">Drag & drop a <strong className="text-white">.csv</strong> file here, or click to browse</p>
              )}
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <button
              type="button"
              disabled={!csvFile || csvUploading}
              onClick={handleCsvUpload}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00E5FF] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#070F1E] transition-all hover:bg-[#5CF1FF] disabled:opacity-40"
            >
              {csvUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {csvUploading ? 'Importing…' : 'Run Import'}
            </button>

            {/* Results */}
            {csvResult && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Imported', value: csvResult.imported, color: 'text-emerald-400' },
                    { label: 'Tours Updated', value: csvResult.affectedTours, color: 'text-[#00E5FF]' },
                    { label: 'Queued (Unmatched)', value: csvResult.queued, color: 'text-[#EAB308]' },
                    { label: 'Errors', value: csvResult.errors, color: 'text-red-400' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {csvResult.queuedRows.length > 0 && (
                  <div className="rounded-2xl border border-[#EAB308]/20 bg-[#EAB308]/5 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#EAB308] flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Unmatched Tours (manual matching required)
                    </p>
                    <div className="space-y-1 text-xs text-slate-300 max-h-40 overflow-y-auto">
                      {csvResult.queuedRows.map((q, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-500">Row {q.row}:</span>
                          <span className="font-bold">{q.tourName}</span>
                          <span className="text-slate-500">— {q.reviewerName}</span>
                          <span className="text-[#EAB308] ml-auto shrink-0">{q.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {csvResult.errorRows.length > 0 && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-red-400">Errors</p>
                    <div className="space-y-1 text-xs text-slate-300 max-h-40 overflow-y-auto">
                      {csvResult.errorRows.map((e, i) => (
                        <div key={i}><span className="text-slate-500">Row {e.row}:</span> {e.reason}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Filters Bar: Status Tabs + Tour Selector */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl border border-white/10 bg-[#0B1528] p-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-[#EAB308] text-[#070F1E] shadow-lg shadow-[#EAB308]/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Statuses' : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#00E5FF] shrink-0" />
            <select
              value={selectedTourId}
              onChange={(e) => {
                setSelectedTourId(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-[#00E5FF]"
            >
              <option value="ALL">All Tours ({tours.length})</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews Table */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-[#070F1E] text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Tour</th>
                  <th className="px-6 py-4">Review Content</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-[#00E5FF]" />
                        <span>Fetching reviews and calculating tour scores...</span>
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      No reviews found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="text-slate-300 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white">{review.customerName}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-[#FFD700] text-xs mr-1">{review.rating}.0</span>
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-3.5 w-3.5 ${
                                index < review.rating
                                  ? 'fill-[#FFD700] text-[#FFD700]'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[220px]">
                          <p className="font-medium text-white truncate" title={review.tourTitle}>
                            {review.tourTitle}
                          </p>
                          {review.tourSlug && (
                            <Link
                              href={`/tours/${review.tourSlug}`}
                              target="_blank"
                              className="text-[11px] text-[#00E5FF] hover:underline"
                            >
                              View Tour ↗
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="line-clamp-2 text-xs leading-5 text-slate-300" title={review.comment}>
                          “{review.comment}”
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                            review.status === 'APPROVED'
                              ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20'
                              : review.status === 'REJECTED'
                              ? 'bg-red-400/10 text-red-300 border border-red-400/20'
                              : 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20'
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve / Reject Buttons */}
                          {review.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleModerate(review.id, 'APPROVED')}
                              disabled={moderatingId === review.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-[#070F1E] transition-all"
                              title="Approve"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {review.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => handleModerate(review.id, 'REJECTED')}
                              disabled={moderatingId === review.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-[#070F1E] transition-all"
                              title="Reject"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(review)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-all"
                            title="Edit Review"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(review.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                            title="Delete Review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
              className="rounded-xl border border-white/10 bg-[#0B1528] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-bold tracking-wider text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-white/10 bg-[#0B1528] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 transition-all hover:bg-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#EAB308]" />
                Add Verified Guest Review
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Tour *
                </label>
                <select
                  value={formData.tourId}
                  onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                >
                  <option value="">-- Choose a Tour --</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer / Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="e.g. Maximilian Weber, Sofia Rossi, Elena Petrova"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#EAB308]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Rating *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good)</option>
                    <option value={3}>⭐⭐⭐ 3 Stars (Average)</option>
                    <option value={2}>⭐⭐ 2 Stars (Poor)</option>
                    <option value={1}>⭐ 1 Star (Terrible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ReviewStatus })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="APPROVED">Approved (Visible on site)</option>
                    <option value="PENDING">Pending (Draft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Share the guest's authentic experience, highlights, snorkeling quality, guide service..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#EAB308]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-[#EAB308] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:bg-[#FFE55C] disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Save & Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {isEditModalOpen && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#00E5FF]" />
                Edit Review
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingReview(null);
                }}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Tour:
                </span>
                <p className="text-sm font-bold text-white">{editingReview.tourTitle}</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Rating *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#EAB308]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                    <option value={3}>⭐⭐⭐ 3 Stars</option>
                    <option value={2}>⭐⭐ 2 Stars</option>
                    <option value={1}>⭐ 1 Star</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ReviewStatus })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingReview(null);
                  }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:bg-[#5CF1FF] disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Update Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
