'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Car,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Ship,
  Sparkles,
  DollarSign,
  Compass,
} from 'lucide-react';
import type { PartnerApplication } from '@/app/api/public/partners/apply/route';
import type { PartnerTourSubmission } from '@/app/api/partner/tours/route';

export default function AdminPartnersPage() {
  const [activeView, setActiveView] = useState<'applications' | 'tours'>('applications');

  // Applications state
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DECLINED'>('ALL');
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Tours state
  const [tours, setTours] = useState<PartnerTourSubmission[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<PartnerTourSubmission | null>(null);
  const [updatingTourId, setUpdatingTourId] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchApplications = async () => {
    setAppsLoading(true);
    setAppsError(null);
    try {
      const res = await fetch('/api/admin/partners/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      setAppsError(err.message || 'Error loading applications');
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchTours = async () => {
    setToursLoading(true);
    try {
      const res = await fetch('/api/admin/partner-tours');
      if (res.ok) {
        const data = await res.json();
        setTours(data.tours || []);
      }
    } catch (err) {
      console.error('Error fetching partner tours:', err);
    } finally {
      setToursLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchTours();
  }, []);

  const handleUpdateAppStatus = async (id: string, newStatus: 'APPROVED' | 'DECLINED' | 'PENDING') => {
    setUpdatingAppId(id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      const data = await res.json();
      setApplications(data.applications || []);

      if (selectedApp && selectedApp.id === id) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }

      setActionMessage(
        newStatus === 'APPROVED'
          ? 'Partner application approved successfully!'
          : newStatus === 'DECLINED'
          ? 'Partner application declined.'
          : 'Application marked as pending.'
      );
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating application');
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleUpdateTourStatus = async (id: string, newStatus: 'APPROVED' | 'CHANGES_REQUESTED') => {
    setUpdatingTourId(id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/partner-tours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update tour status');
      const data = await res.json();
      setTours(data.tours || []);

      if (selectedTour && selectedTour.id === id) {
        setSelectedTour({ ...selectedTour, status: newStatus });
      }

      setActionMessage(`Tour proposal marked as ${newStatus.replace('_', ' ')}.`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating tour status');
    } finally {
      setUpdatingTourId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesStatus = appStatusFilter === 'ALL' || app.status === appStatusFilter;
    const q = appSearch.toLowerCase();
    const matchesSearch =
      !q ||
      app.companyName.toLowerCase().includes(q) ||
      app.contactName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q) ||
      app.country.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const appCounts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    declined: applications.filter((a) => a.status === 'DECLINED').length,
  };

  const tourCounts = {
    total: tours.length,
    pending: tours.filter((t) => t.status === 'PENDING_REVIEW').length,
    approved: tours.filter((t) => t.status === 'APPROVED').length,
  };

  return (
    <div className="space-y-8 p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">Partner Management</h1>
            <p className="text-sm text-slate-400">
              Review operator applications and moderate partner-submitted tour experiences.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchApplications();
            fetchTours();
          }}
          disabled={appsLoading || toursLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B1528] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${appsLoading || toursLoading ? 'animate-spin text-[#00E5FF]' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Main Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveView('applications')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
            activeView === 'applications'
              ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Supplier Applications ({appCounts.total})
          {appCounts.pending > 0 && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-900 font-bold">
              {appCounts.pending} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('tours')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition ${
            activeView === 'tours'
              ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Ship className="h-4 w-4" />
          Tour Proposals ({tourCounts.total})
          {tourCounts.pending > 0 && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-900 font-bold">
              {tourCounts.pending} pending
            </span>
          )}
        </button>
      </div>

      {/* Action Toast Feedback */}
      {actionMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* VIEW 1: Applications */}
      {activeView === 'applications' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B1528]/80 p-5 backdrop-blur-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applicants</div>
              <div className="mt-2 text-3xl font-black text-white">{appCounts.total}</div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Review</div>
              <div className="mt-2 text-3xl font-black text-amber-300">{appCounts.pending}</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Approved Partners</div>
              <div className="mt-2 text-3xl font-black text-emerald-300">{appCounts.approved}</div>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 backdrop-blur-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Declined</div>
              <div className="mt-2 text-3xl font-black text-rose-300">{appCounts.declined}</div>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B1528] p-1">
              {(['ALL', 'PENDING', 'APPROVED', 'DECLINED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setAppStatusFilter(st)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    appStatusFilter === st
                      ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search company, contact, city..."
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          {/* List */}
          {appsLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/50">
              <RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" />
              <p className="text-sm text-slate-400">Loading partner applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/50 text-center">
              <Building2 className="h-10 w-10 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">No Applications Found</h3>
              <p className="max-w-sm text-xs text-slate-500">
                When tour operators apply via /partners, their submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-[#0B1528] p-5 transition-all hover:border-[#00E5FF]/40 hover:bg-[#0B1528]/90 lg:flex-row lg:items-center"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-black text-white group-hover:text-[#00E5FF] transition">
                        {app.companyName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          app.status === 'APPROVED'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : app.status === 'DECLINED'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.category && (
                        <span className="rounded-lg bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                          {app.category}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-400 sm:grid-cols-2 md:grid-cols-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-slate-300">{app.contactName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <a href={`mailto:${app.email}`} className="hover:text-[#00E5FF] transition truncate">
                          {app.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <a href={`tel:${app.phone}`} className="hover:text-[#00E5FF] transition">
                          {app.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>{app.city ? `${app.city}, ${app.country}` : app.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 lg:border-t-0 lg:pt-0">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                    >
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    {app.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'APPROVED')}
                        disabled={updatingAppId === app.id}
                        className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {app.status !== 'DECLINED' && (
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'DECLINED')}
                        disabled={updatingAppId === app.id}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Partner Tour Proposals */}
      {activeView === 'tours' && (
        <div className="space-y-6">
          {toursLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/50">
              <RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" />
              <p className="text-sm text-slate-400">Loading tour proposals...</p>
            </div>
          ) : tours.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/50 text-center">
              <Ship className="h-10 w-10 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">No Tour Proposals Submitted</h3>
              <p className="max-w-sm text-xs text-slate-500">
                Partners can propose new tours through the Partner Portal at /partner/tours/new.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-[#0B1528] p-5 lg:flex-row lg:items-center"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">{tour.title}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          tour.status === 'APPROVED'
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {tour.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Compass className="h-3.5 w-3.5 text-slate-500" />
                        {tour.destination}
                      </span>
                      <span>•</span>
                      <span>{tour.category}</span>
                      <span>•</span>
                      <span>{tour.durationHours}h</span>
                      <span>•</span>
                      <span className="font-bold text-[#00E5FF]">${tour.adultPrice} / adult</span>
                      {tour.pickupHub && (
                        <>
                          <span>•</span>
                          <span>Pickup: {tour.pickupHub}</span>
                        </>
                      )}
                    </div>

                    <p className="line-clamp-2 text-xs text-slate-400">{tour.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {tour.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateTourStatus(tour.id, 'APPROVED')}
                        disabled={updatingTourId === tour.id}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-400 transition"
                      >
                        Approve Proposal
                      </button>
                    )}
                    {tour.status !== 'CHANGES_REQUESTED' && (
                      <button
                        onClick={() => handleUpdateTourStatus(tour.id, 'CHANGES_REQUESTED')}
                        disabled={updatingTourId === tour.id}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
                      >
                        Request Changes
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                  Partner Application Details
                </span>
                <h2 className="mt-1 text-2xl font-black text-white">{selectedApp.companyName}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>Applied on: {new Date(selectedApp.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span
                    className={`font-bold ${
                      selectedApp.status === 'APPROVED'
                        ? 'text-emerald-400'
                        : selectedApp.status === 'DECLINED'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    Status: {selectedApp.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/5 bg-[#070F1E] p-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Contact Person</div>
                  <div className="font-bold text-white">{selectedApp.contactName}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500">Category</div>
                  <div className="font-bold text-white">{selectedApp.category || 'General Tour Operator'}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500">Email</div>
                  <a href={`mailto:${selectedApp.email}`} className="font-bold text-[#00E5FF] hover:underline">
                    {selectedApp.email}
                  </a>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500">Phone</div>
                  <a href={`tel:${selectedApp.phone}`} className="font-bold text-white hover:underline">
                    {selectedApp.phone}
                  </a>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500">Location</div>
                  <div className="font-bold text-white">
                    {selectedApp.city ? `${selectedApp.city}, ${selectedApp.country}` : selectedApp.country}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500">Fleet Size</div>
                  <div className="font-bold text-white">{selectedApp.fleetSize || 'Not specified'}</div>
                </div>

                {selectedApp.website && (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-semibold text-slate-500">Website</div>
                    <a
                      href={selectedApp.website.startsWith('http') ? selectedApp.website : `https://${selectedApp.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#00E5FF] hover:underline"
                    >
                      {selectedApp.website}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {selectedApp.message && (
                <div>
                  <div className="text-xs font-semibold text-slate-400">Statement & Proposal</div>
                  <div className="mt-2 rounded-2xl border border-white/5 bg-[#070F1E] p-4 text-sm text-slate-300 leading-relaxed">
                    {selectedApp.message}
                  </div>
                </div>
              )}

              {/* Modal Action Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'PENDING')}
                  disabled={updatingAppId === selectedApp.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Mark as Pending
                </button>

                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'DECLINED')}
                  disabled={updatingAppId === selectedApp.id}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
                >
                  Decline Application
                </button>

                <button
                  onClick={() => handleUpdateAppStatus(selectedApp.id, 'APPROVED')}
                  disabled={updatingAppId === selectedApp.id}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-400"
                >
                  Approve Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
