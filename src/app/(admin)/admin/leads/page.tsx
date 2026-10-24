'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, Search, UserRound } from 'lucide-react';

type LeadStatus = 'INTERESTED' | 'IN_PROGRESS' | 'CONTACTED' | 'CONVERTED' | 'ABANDONED';

type BookingLead = {
  id: string;
  tourTitle?: string | null;
  tourSlug?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  travelDate?: string | null;
  adults: number;
  children: number;
  totalEstimatedPrice?: number | null;
  currency: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  booking?: { bookingReference: string; status: string } | null;
};

const STATUSES: Array<{ id: 'ALL' | LeadStatus; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'INTERESTED', label: 'Interested' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'CONVERTED', label: 'Confirmed' },
  { id: 'ABANDONED', label: 'Abandoned' },
];

const STATUS_STYLE: Record<LeadStatus, string> = {
  INTERESTED: 'bg-cyan-400/10 text-cyan-200',
  IN_PROGRESS: 'bg-amber-400/10 text-amber-200',
  CONTACTED: 'bg-violet-400/10 text-violet-200',
  CONVERTED: 'bg-emerald-400/10 text-emerald-200',
  ABANDONED: 'bg-slate-400/10 text-slate-300',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<BookingLead[]>([]);
  const [status, setStatus] = useState<'ALL' | LeadStatus>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100', status });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/admin/leads?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load booking leads.');
      setLeads(payload.leads || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load booking leads.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadLeads, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadLeads, search]);

  const updateStatus = async (id: string, nextStatus: LeadStatus) => {
    const response = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) {
      setError('The lead status could not be saved.');
      return;
    }
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: nextStatus } : lead));
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Customer follow-up</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Booking Leads</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Interest is not a confirmed booking. A lead becomes confirmed only after the related booking is confirmed.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search traveler or trip"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatus(item.id)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${status === item.id ? 'bg-cyan-300 text-slate-950' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#0B1528]">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Traveler</th>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-400"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading leads</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-400"><UserRound className="mx-auto mb-2 h-5 w-5" />No leads match these filters.</td></tr>
            ) : leads.map((lead) => (
              <tr key={lead.id} className="border-b border-white/[0.06] last:border-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-white">{lead.customerName || 'Anonymous visitor'}</p>
                  <p className="mt-1 text-xs text-slate-400">{lead.customerEmail || lead.customerPhone || 'No contact details supplied'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-200">{lead.tourTitle || lead.tourSlug || 'Trip not specified'}</p>
                  {lead.booking && <p className="mt-1 text-xs text-emerald-300">Booking {lead.booking.bookingReference}</p>}
                </td>
                <td className="px-4 py-4 text-xs text-slate-400">
                  <p>{lead.adults} adults{lead.children ? `, ${lead.children} children` : ''}</p>
                  {lead.travelDate && <p className="mt-1">{lead.travelDate}</p>}
                  {lead.totalEstimatedPrice != null && <p className="mt-1">{lead.totalEstimatedPrice} {lead.currency}</p>}
                </td>
                <td className="px-4 py-4 text-xs text-slate-400">{new Date(lead.createdAt).toLocaleString()}</td>
                <td className="px-4 py-4">
                  <select
                    value={lead.status}
                    onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                    className={`rounded-md border-0 px-2.5 py-1.5 text-xs font-bold outline-none ${STATUS_STYLE[lead.status]}`}
                    aria-label={`Change status for ${lead.tourTitle || 'lead'}`}
                  >
                    {STATUSES.filter((item): item is { id: LeadStatus; label: string } => item.id !== 'ALL').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                  {lead.status === 'CONVERTED' && <CheckCircle2 className="mt-2 h-4 w-4 text-emerald-300" />}
                  {lead.status === 'IN_PROGRESS' && <Clock3 className="mt-2 h-4 w-4 text-amber-300" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
