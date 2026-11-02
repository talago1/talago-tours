'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Users,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  ArrowRight,
  User,
  Phone,
  Mail,
  Building,
  RefreshCw,
  ExternalLink,
  Save,
  Check,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  Sparkles,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

type CRMTab = 'follow-ups' | 'leads' | 'inquiries' | 'reservations' | 'customers';

interface CRMOverviewMetrics {
  totalLeads: number;
  interestedLeads: number;
  inProgressLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  totalCustomers: number;
  totalBookings: number;
  openConversations: number;
  unansweredInquiries: number;
  conversionRate: number;
  needsActionCount: number;
}

interface FollowUpItem {
  id: string;
  type: 'INQUIRY' | 'BOOKING_INTEREST';
  reference: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  tourTitle: string;
  tourSlug?: string | null;
  travelDate?: string | null;
  estimatedPrice?: number | null;
  currency: string;
  status: string;
  queueStatus: 'Needs Action' | 'Follow-up Scheduled';
  notes?: string | null;
  createdAt: string;
  booking?: { id: string; bookingReference: string; status: string; paymentStatus: string } | null;
}

function CRMContent() {
  const [tab, setTab] = useState<CRMTab>('follow-ups');
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState<CRMOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Selected customer journey drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{
    profile: any;
    leads: any[];
    bookings: any[];
    chatConversation: any;
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Drawer notes & action
  const [notesText, setNotesText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Load overview metrics
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crm?view=overview', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load CRM overview metrics', e);
    }
  }, []);

  // Load active tab data
  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: tab });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/crm?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (tab === 'follow-ups') setFollowUps(data.queue || []);
        else if (tab === 'leads') setLeads(data.queue || data.leads || []);
        else if (tab === 'inquiries') setInquiries(data.inquiries || []);
        else if (tab === 'reservations') setReservations(data.reservations || []);
        else if (tab === 'customers') setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error('Failed to load CRM tab data', e);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Open Unified Customer Journey Drawer
  const openCustomerJourney = async (identifier: string, leadId?: string) => {
    setSelectedCustomerId(identifier);
    if (leadId) setActiveLeadId(leadId);
    setDrawerOpen(true);
    setDrawerLoading(true);

    try {
      const res = await fetch(`/api/admin/crm?view=customer-detail&customerId=${encodeURIComponent(identifier)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerDetail(data.customer);
        // Find matching lead notes if activeLeadId provided
        if (leadId && data.customer?.leads) {
          const match = data.customer.leads.find((l: any) => l.id === leadId);
          setNotesText(match?.notes || '');
        } else if (data.customer?.leads?.[0]) {
          setNotesText(data.customer.leads[0].notes || '');
          setActiveLeadId(data.customer.leads[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load customer journey detail', e);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Save staff notes or schedule follow-up
  const handleSaveNotes = async () => {
    if (!activeLeadId) return;
    setIsSavingNotes(true);
    setSaveSuccessNotice(false);

    try {
      const res = await fetch('/api/admin/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeLeadId,
          notes: notesText.trim(),
          scheduledFollowUp: followUpDate || undefined,
        }),
      });

      if (res.ok) {
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 2500);
        loadTabData();
        loadOverview();
      }
    } catch (e) {
      console.error('Failed to save staff notes', e);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#0284C7]/20 text-[#00E5FF] border border-[#00E5FF]/30">
              <Users className="h-5 w-5" />
            </span>
            Central CRM &amp; Customer Journey
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connected booking interests, inquiries, confirmed reservations, and follow-up queue in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadOverview();
            loadTabData();
          }}
          className="self-start sm:self-auto flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Overview Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Action Queue */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">Action Queue</span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-white">{metrics.needsActionCount}</p>
            <p className="text-[11px] text-slate-400">Needs staff reply</p>
          </div>

          {/* New Interests */}
          <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00E5FF]">New Interests</span>
              <Sparkles className="h-4 w-4 text-[#00E5FF]" />
            </div>
            <p className="text-2xl font-black text-white">{metrics.interestedLeads}</p>
            <p className="text-[11px] text-slate-400">RES- pending leads</p>
          </div>

          {/* Inquiries */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Inquiries</span>
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{metrics.unansweredInquiries}</p>
            <p className="text-[11px] text-slate-400">INQ- questions waiting</p>
          </div>

          {/* Confirmed Bookings */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Confirmed Bookings</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{metrics.totalBookings}</p>
            <p className="text-[11px] text-slate-400">TLG- reservations</p>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">Conversion</span>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{metrics.conversionRate}%</p>
            <p className="text-[11px] text-slate-400">Lead-to-Booking rate</p>
          </div>
        </div>
      )}

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/10">
          {[
            { id: 'follow-ups' as CRMTab, label: 'Follow-up Queue', count: metrics?.needsActionCount },
            { id: 'leads' as CRMTab, label: 'Booking Interests (RES-)', count: metrics?.interestedLeads },
            { id: 'inquiries' as CRMTab, label: 'Inquiries (INQ-)', count: metrics?.unansweredInquiries },
            { id: 'reservations' as CRMTab, label: 'Reservations (TLG-)', count: metrics?.totalBookings },
            { id: 'customers' as CRMTab, label: 'Customer Directory', count: metrics?.totalCustomers },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl py-2 px-3.5 text-xs font-bold transition ${
                tab === t.id
                  ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    tab === t.id ? 'bg-[#070F1E]/20 text-[#070F1E]' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search traveler, phone, ref (RES-/INQ-/TLG-)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Tab Content Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-[#00E5FF]" />
          <span className="text-xs font-bold">Loading CRM records...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. FOLLOW-UP QUEUE */}
          {tab === 'follow-ups' && (
            <div className="space-y-3">
              {followUps.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] py-16 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">All caught up! Zero pending follow-ups in queue.</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    New booking interests or unanswered inquiries will automatically appear here when traveler action is needed.
                  </p>
                </div>
              ) : (
                followUps.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openCustomerJourney(item.customerEmail || item.customerPhone || item.id, item.id)}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#00E5FF]/30 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          item.type === 'INQUIRY'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                        }`}
                      >
                        {item.type === 'INQUIRY' ? 'INQ' : 'RES'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white">{item.reference}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.queueStatus === 'Needs Action'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.queueStatus}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{item.customerName}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                          {item.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-500" />
                              {item.customerPhone}
                            </span>
                          )}
                          {item.customerEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-500" />
                              {item.customerEmail}
                            </span>
                          )}
                          <span className="text-[#00E5FF] font-medium">{item.tourTitle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {item.estimatedPrice && (
                        <span className="text-sm font-black text-white">${item.estimatedPrice}</span>
                      )}
                      <span className="text-xs text-[#00E5FF] font-bold flex items-center gap-1">
                        <span>Open Journey</span>
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. LEADS VIEW */}
          {tab === 'leads' && (
            <div className="space-y-3">
              {followUps.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => openCustomerJourney(lead.customerEmail || lead.customerPhone || lead.id, lead.id)}
                  className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-[#00E5FF]">{lead.reference}</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{lead.customerName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tour: {lead.tourTitle} • Date: {lead.travelDate || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      {lead.status}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Click to view timeline</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. INQUIRIES VIEW */}
          {tab === 'inquiries' && (
            <div className="space-y-3">
              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No inquiry records found.</div>
              ) : (
                inquiries.map((inq: any) => (
                  <div
                    key={inq.id}
                    onClick={() => openCustomerJourney(inq.customerEmail || inq.customerPhone || inq.id, inq.id)}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {inq.id.startsWith('INQ-') ? inq.id : `INQ-${inq.id.slice(-6).toUpperCase()}`}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{inq.customerName || 'Traveler Inquiry'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Tour: {inq.tourTitle || 'General Question'}</p>
                      {inq.notes && <p className="text-xs text-slate-300 italic mt-1">&ldquo;{inq.notes}&rdquo;</p>}
                    </div>
                    <span className="text-xs text-[#00E5FF] font-bold flex items-center gap-1">
                      <span>View Chat &amp; Reply</span>
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. RESERVATIONS VIEW */}
          {tab === 'reservations' && (
            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No reservation records found.</div>
              ) : (
                reservations.map((res: any) => (
                  <div
                    key={res.id}
                    onClick={() => openCustomerJourney(res.customerEmail || res.customerPhone || res.id)}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-400">{res.bookingReference}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{res.customerName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {res.tourTitle} • {res.guestCount} Guests • {new Date(res.travelDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">${res.totalPriceUSD}</p>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {res.paymentStatus || 'CONFIRMED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. CUSTOMERS VIEW */}
          {tab === 'customers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customers.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => openCustomerJourney(c.email || c.phone || c.id)}
                  className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#00E5FF]/30 hover:bg-white/[0.05] transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 border border-white/10 font-bold">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{c.name || 'Traveler'}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{c.email}</p>
                    </div>
                  </div>
                  {c.phone && <p className="text-xs text-slate-400">Phone: {c.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UNIFIED CUSTOMER JOURNEY DRAWER */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-xl h-full bg-[#0B1528] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-[#00E5FF]" />
                  Unified Customer Journey
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedCustomerId}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {drawerLoading ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#00E5FF]" />
                  <span className="text-xs font-bold">Fetching complete customer history...</span>
                </div>
              ) : customerDetail ? (
                <>
                  {/* Customer Card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Traveler Identity</span>
                      {customerDetail.profile?.isShadow ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Guest (Shadow Profile)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Registered Traveler
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-white">
                      {customerDetail.profile?.name || customerDetail.leads?.[0]?.customerName || 'Traveler'}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-300">
                      {customerDetail.profile?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{customerDetail.profile.phone}</span>
                        </p>
                      )}
                      {customerDetail.profile?.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          <span>{customerDetail.profile.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Telegram Profile */}
                  {customerDetail.profile?.telegramId && (
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400">Telegram</span>
                        {customerDetail.profile.telegramBotAccess ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Messaging Enabled
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            Bot Not Authorized
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {customerDetail.profile.telegramPhotoUrl && (
                          <img
                            src={customerDetail.profile.telegramPhotoUrl}
                            alt="Telegram avatar"
                            className="h-9 w-9 rounded-full border border-sky-500/30 object-cover shrink-0"
                          />
                        )}
                        <div className="space-y-0.5 text-xs">
                          {customerDetail.profile.telegramUsername && (
                            <p className="font-bold text-white">
                              @{customerDetail.profile.telegramUsername}
                            </p>
                          )}
                          <p className="text-slate-400 font-mono">ID: {customerDetail.profile.telegramId}</p>
                          {customerDetail.profile.telegramPhone && (
                            <p className="text-slate-300 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-500" />
                              {customerDetail.profile.telegramPhone}
                              {customerDetail.profile.telegramPhoneVerified && (
                                <span className="text-[10px] font-bold text-emerald-400 ml-1">Verified</span>
                              )}
                            </p>
                          )}
                          {customerDetail.profile.telegramConnectedAt && (
                            <p className="text-[11px] text-slate-500">
                              Connected {new Date(customerDetail.profile.telegramConnectedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected Journey Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#00E5FF]" />
                      Activity Timeline
                    </h4>

                    {/* Bookings */}
                    {customerDetail.bookings && customerDetail.bookings.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-400">Confirmed Reservations</span>
                        {customerDetail.bookings.map((b: any) => (
                          <div key={b.id} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-emerald-300">{b.bookingReference}</span>
                              <span className="font-bold text-white">${b.totalPriceUSD}</span>
                            </div>
                            <p className="text-slate-300">{b.tourTitle}</p>
                            <p className="text-[11px] text-slate-400">
                              Payment: {b.paymentStatus} ({b.paymentScheme}) • Date: {new Date(b.travelDate).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Leads / Inquiries */}
                    {customerDetail.leads && customerDetail.leads.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold text-[#00E5FF]">Booking Interests &amp; Inquiries</span>
                        {customerDetail.leads.map((l: any) => (
                          <div key={l.id} className="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-white">{l.id}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                                {l.status}
                              </span>
                            </div>
                            <p className="text-slate-300">{l.tourTitle}</p>
                            {l.notes && <p className="text-slate-400 italic text-[11px]">&ldquo;{l.notes}&rdquo;</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Live Chat Stream */}
                    {customerDetail.chatConversation && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300">Customer Live Chat Messages</span>
                          <Link
                            href="/admin/inbox"
                            className="text-[10px] text-[#00E5FF] hover:underline flex items-center gap-1"
                          >
                            <span>Open in Live Inbox</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-xl border border-white/10 bg-white/[0.01]">
                          {customerDetail.chatConversation.messages?.map((m: any) => (
                            <div
                              key={m.id}
                              className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                                m.sender === 'VISITOR'
                                  ? 'bg-white/10 text-white mr-auto'
                                  : 'bg-[#00E5FF]/20 text-[#00E5FF] ml-auto text-right'
                              }`}
                            >
                              <p className="font-medium">{m.body}</p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staff Notes & Action Box */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Save className="h-3.5 w-3.5 text-[#00E5FF]" />
                      Staff Internal Notes &amp; Follow-up Schedule
                    </h4>

                    <div>
                      <textarea
                        rows={3}
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Add internal staff notes or promises made to traveler..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Schedule Follow-up Date</label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes || !activeLeadId}
                        className="self-end px-4 py-2 rounded-xl bg-[#00E5FF] text-[#070F1E] text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 disabled:opacity-50 transition"
                      >
                        {isSavingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>

                    {saveSuccessNotice && (
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Notes &amp; follow-up updated successfully.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-slate-400">No customer details found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCRMPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading CRM Workspace...</div>}>
      <CRMContent />
    </Suspense>
  );
}

