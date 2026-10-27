'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2, Clock3, Loader2, Search, UserRound, MessageSquare,
  FileText, Calendar, DollarSign, X, ExternalLink, Save, Phone, Mail, Send,
} from 'lucide-react';
import Link from 'next/link';

type LeadStatus = 'INTERESTED' | 'IN_PROGRESS' | 'CONTACTED' | 'CONVERTED' | 'ABANDONED';

type BookingLead = {
  id: string;
  tourId?: string | null;
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
  notes?: string | null;
  createdAt: string;
  booking?: { id: string; bookingReference: string; status: string } | null;
};

type LeadMetrics = {
  totalLeads: number;
  interested: number;
  inProgress: number;
  contacted: number;
  converted: number;
  abandoned: number;
  conversionRate: number;
  totalEstimatedValue: number;
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
  INTERESTED: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/30',
  IN_PROGRESS: 'bg-amber-400/10 text-amber-200 border-amber-400/30',
  CONTACTED: 'bg-violet-400/10 text-violet-200 border-violet-400/30',
  CONVERTED: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/30',
  ABANDONED: 'bg-slate-400/10 text-slate-300 border-slate-400/30',
};

function LeadsContent() {
  const searchParams = useSearchParams();
  const urlLeadId = searchParams.get('id');

  const [leads, setLeads] = useState<BookingLead[]>([]);
  const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
  const [status, setStatus] = useState<'ALL' | LeadStatus>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Lead Drawer
  const [activeLead, setActiveLead] = useState<BookingLead | null>(null);
  const [drawerNotes, setDrawerNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveNotice, setNotesSaveNotice] = useState(false);

  // Linked live conversation & supplier operator info
  const [leadConversation, setLeadConversation] = useState<{
    id: string;
    messages: Array<{ id: string; sender: 'VISITOR' | 'ADMIN'; body: string; createdAt: string }>;
  } | null>(null);
  const [operatorInfo, setOperatorInfo] = useState<{
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessNotice, setReplySuccessNotice] = useState(false);

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
      if (payload.metrics) setMetrics(payload.metrics);
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
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status: nextStatus } : lead)));
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  const handleOpenLead = (lead: BookingLead) => {
    setActiveLead(lead);
    setDrawerNotes(lead.notes || '');
    setNotesSaveNotice(false);
    setReplyText('');
    setReplySuccessNotice(false);
    setLeadConversation(null);
    setOperatorInfo(null);

    // Fetch conversation messages and tour operator information
    fetch(`/api/admin/leads/${lead.id}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.lead) {
          if (data.lead.messages) {
            setLeadConversation({
              id: data.lead.conversationId || '',
              messages: data.lead.messages,
            });
          }
          if (data.lead.operator) {
            setOperatorInfo(data.lead.operator);
          }
        }
      })
      .catch((err) => console.warn('[leads] Failed to fetch linked conversation:', err));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/admin/leads/${activeLead.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setLeadConversation((prev) => ({
          id: data.conversationId || prev?.id || '',
          messages: [...(prev?.messages || []), data.message],
        }));
        setReplyText('');
        setReplySuccessNotice(true);
        setTimeout(() => setReplySuccessNotice(false), 4000);
        if (data.leadStatus) {
          setLeads((current) =>
            current.map((l) => (l.id === activeLead.id ? { ...l, status: data.leadStatus } : l))
          );
          setActiveLead((prev) => (prev ? { ...prev, status: data.leadStatus } : null));
        }
      } else {
        alert(data.error || 'Failed to send reply.');
      }
    } catch {
      alert('Network error sending reply.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // TAL-C5: Auto-open lead drawer if ?id= is present in the URL
  useEffect(() => {
    if (!urlLeadId) return;

    const found = leads.find((l) => l.id === urlLeadId);
    if (found) {
      handleOpenLead(found);
      return;
    }

    let isCancelled = false;
    fetch(`/api/admin/leads/${urlLeadId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data?.lead) {
          handleOpenLead(data.lead);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [urlLeadId, leads]);

  const handleSaveNotes = async () => {
    if (!activeLead) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/leads/${activeLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: drawerNotes }),
      });
      if (res.ok) {
        setLeads((current) =>
          current.map((l) => (l.id === activeLead.id ? { ...l, notes: drawerNotes } : l))
        );
        setActiveLead((prev) => (prev ? { ...prev, notes: drawerNotes } : null));
        setNotesSaveNotice(true);
        setTimeout(() => setNotesSaveNotice(false), 3000);
      }
    } catch {
      alert('Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Customer Relationship Management</p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Booking Leads &amp; Inquiries</h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-400">
            Every &quot;Book&quot; click generates an inquiry reference (RES-...) and mirrors into the Live Inbox for instant follow-up.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search traveler, tour, or RES-..."
            className="w-full rounded-xl border border-white/10 bg-[#0B1528] py-2.5 pl-10 pr-3 text-xs text-white outline-none transition focus:border-cyan-300/60"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Leads</p>
            <p className="text-2xl font-black text-white mt-1">{metrics.totalLeads}</p>
            <p className="text-[10px] text-cyan-300 mt-1">{metrics.conversionRate}% conversion rate</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Interests</p>
            <p className="text-2xl font-black text-cyan-300 mt-1">{metrics.interested}</p>
            <p className="text-[10px] text-slate-500 mt-1">Awaiting contact</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Follow-up</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{metrics.inProgress + metrics.contacted}</p>
            <p className="text-[10px] text-slate-500 mt-1">In progress &amp; contacted</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline Est. Value</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">${metrics.totalEstimatedValue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400/80 mt-1">{metrics.converted} confirmed bookings</p>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStatus(item.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              status === item.id ? 'bg-cyan-300 text-slate-950 shadow-md shadow-cyan-300/10' : 'bg-[#0B1528] border border-white/10 text-slate-300 hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</p>}

      {/* Leads Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1528] shadow-xl">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400 bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3.5">Reference &amp; Guest</th>
              <th className="px-4 py-3.5">Tour &amp; Destination</th>
              <th className="px-4 py-3.5">Booking Details</th>
              <th className="px-4 py-3.5">Created</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-cyan-300" />
                  Loading booking inquiries…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                  <UserRound className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  No leads match the selected filter.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isInquiry = lead.source === 'INQUIRY';
                const ref = isInquiry
                  ? `INQ-${lead.id.slice(-8).toUpperCase()}`
                  : `RES-${lead.id.slice(-8).toUpperCase()}`;
                return (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenLead(lead)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono text-[10px] font-bold border px-2 py-0.5 rounded ${
                          isInquiry
                            ? 'text-purple-300 bg-purple-400/10 border-purple-400/25'
                            : 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20'
                        }`}>
                          {ref}
                        </span>
                        {isInquiry && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-400/15 px-1.5 py-0.5 rounded">
                            Question
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm mt-1">{lead.customerName || 'Anonymous Traveler'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lead.customerEmail || lead.customerPhone || 'Contact pending in chat'}
                      </p>
                    </td>

                    <td className="px-4 py-4 max-w-xs">
                      <p className="font-semibold text-slate-200 truncate">{lead.tourTitle || lead.tourSlug || 'Trip inquiry'}</p>
                      {lead.booking && (
                        <p className="mt-1 text-[11px] text-emerald-300 font-medium">
                          ✓ Booking #{lead.booking.bookingReference}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      <p className="text-white font-medium">{lead.adults} adults{lead.children ? `, ${lead.children} kids` : ''}</p>
                      {lead.travelDate && <p className="text-[11px] text-slate-400 mt-0.5">{lead.travelDate}</p>}
                      {lead.totalEstimatedPrice != null && (
                        <p className="text-[11px] text-[#00E5FF] font-bold mt-0.5">${lead.totalEstimatedPrice} {lead.currency}</p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString()} &middot; {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(event) => updateStatus(lead.id, event.target.value as LeadStatus)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer ${STATUS_STYLE[lead.status]}`}
                      >
                        {STATUSES.filter((item): item is { id: LeadStatus; label: string } => item.id !== 'ALL').map((item) => (
                          <option key={item.id} value={item.id} className="bg-[#0B1528] text-white">
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/inbox?search=${encodeURIComponent(ref)}`}
                          className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20"
                          title="Open in Live Inbox"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Drawer */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveLead(null)} />
          <div className="relative z-10 w-full max-w-lg bg-[#0B1528] border-l border-white/10 p-6 overflow-y-auto space-y-6 shadow-2xl">
            {/* Drawer Header */}
            {(() => {
              const isInquiry = activeLead.source === 'INQUIRY';
              const activeRef = isInquiry
                ? `INQ-${activeLead.id.slice(-8).toUpperCase()}`
                : `RES-${activeLead.id.slice(-8).toUpperCase()}`;

              return (
                <>
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold border px-2.5 py-1 rounded ${
                          isInquiry
                            ? 'text-purple-300 bg-purple-400/10 border-purple-400/25'
                            : 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20'
                        }`}>
                          {activeRef}
                        </span>
                        {isInquiry && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-400/15 px-2 py-0.5 rounded">
                            Question / Inquiry
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-black text-white mt-2">{activeLead.customerName || 'Anonymous Traveler'}</h2>
                      <p className="text-xs text-slate-400">Created {new Date(activeLead.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setActiveLead(null)} className="rounded-full p-1 text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/inbox?search=${encodeURIComponent(activeRef)}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-2.5 text-xs font-black text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-400/10"
                    >
                      <MessageSquare className="h-4 w-4" /> Open Conversation in Inbox
                    </Link>
                    {activeLead.tourSlug && (
                      <Link
                        href={`/tours/${activeLead.tourSlug}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                        title="View Tour Page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Traveler Contact */}
            <div className="rounded-2xl border border-white/10 bg-[#060D1A] p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Information</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-cyan-300" />
                  <span>{activeLead.customerEmail || 'No email provided yet'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-cyan-300" />
                  <span>{activeLead.customerPhone || 'No phone provided yet'}</span>
                </div>
              </div>
            </div>

            {/* Supplier / Tour Operator (if assigned) */}
            {operatorInfo?.name && (
              <div className="rounded-2xl border border-white/10 bg-[#060D1A] p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Supplier / Tour Operator</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-bold text-white">{operatorInfo.name}</p>
                  {operatorInfo.phone && <p className="text-slate-400">📞 {operatorInfo.phone}</p>}
                  {operatorInfo.email && <p className="text-slate-400">✉️ {operatorInfo.email}</p>}
                </div>
              </div>
            )}

            {/* Trip Details */}
            <div className="rounded-2xl border border-white/10 bg-[#060D1A] p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trip &amp; Reservation</p>
              <div className="space-y-1.5 text-xs">
                <p className="text-white font-semibold">{activeLead.tourTitle || activeLead.tourSlug || 'Trip inquiry'}</p>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Travel Date:</span>
                  <span className="text-white font-medium">{activeLead.travelDate || 'Not specified'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Party Size:</span>
                  <span className="text-white font-medium">{activeLead.adults} adults{activeLead.children ? `, ${activeLead.children} children` : ''}</span>
                </div>
                {activeLead.totalEstimatedPrice != null && (
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Total:</span>
                    <span className="text-[#00E5FF] font-bold">${activeLead.totalEstimatedPrice} {activeLead.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Source Channel:</span>
                  <span className="text-slate-300 uppercase text-[10px] font-mono">{activeLead.source}</span>
                </div>
              </div>
            </div>

            {/* Shared Live Conversation & Direct Reply Box */}
            <div className="rounded-2xl border border-white/10 bg-[#060D1A] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Shared Conversation Stream
                </p>
                {replySuccessNotice && (
                  <span className="text-[10px] text-emerald-400 font-bold">✓ Reply sent &amp; logged</span>
                )}
              </div>

              {/* Message List */}
              <div className="max-h-56 overflow-y-auto space-y-2.5 rounded-xl bg-[#0B1528] p-3 border border-white/5">
                {leadConversation?.messages && leadConversation.messages.length > 0 ? (
                  leadConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                        m.sender === 'ADMIN'
                          ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-100 ml-4'
                          : 'bg-white/5 border border-white/10 text-white mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold opacity-60 mb-1">
                        <span>{m.sender === 'ADMIN' ? 'TALAGO Staff' : (activeLead.customerName || 'Traveler')}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No conversation messages yet for this traveler. Send a reply below to initiate.
                  </p>
                )}
              </div>

              {/* Direct Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Type a direct reply to this traveler (appears in live chat &amp; email)..."
                  className="w-full rounded-xl border border-white/10 bg-[#0B1528] p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-300"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 transition disabled:opacity-40"
                  >
                    {isSendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send Direct Reply
                  </button>
                </div>
              </form>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Internal Staff Notes</p>
                {notesSaveNotice && <span className="text-[10px] text-emerald-400 font-bold">✓ Notes saved</span>}
              </div>
              <textarea
                value={drawerNotes}
                onChange={(e) => setDrawerNotes(e.target.value)}
                rows={4}
                placeholder="Add private operator notes, hotel details, preferred languages, or follow-up schedule..."
                className="w-full rounded-xl border border-white/10 bg-[#060D1A] p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-300"
              />
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition disabled:opacity-40"
              >
                {isSavingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Internal Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070F1E]">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
        </div>
      }
    >
      <LeadsContent />
    </Suspense>
  );
}
