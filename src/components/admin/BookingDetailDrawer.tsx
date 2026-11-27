'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { normalizePhoneForWhatsApp } from '@/utils/sanitize';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import StatusBadge from './StatusBadge';
import BookingRowActions from './BookingRowActions';
import {
  X,
  Hotel,
  MapPin,
  Users,
  Clock,
  DollarSign,
  MessageCircle,
  MessageSquare,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Send,
  RefreshCw,
  Calendar,
  Activity,
  User,
  FileText,
} from 'lucide-react';

type DrawerTab = 'overview' | 'customer' | 'payment' | 'conversation' | 'activity';

interface ChatMessage {
  id: string;
  text: string;
  senderRole: string;
  createdAt: string;
}

interface ActivityLogItem {
  id: string;
  channel: string;
  recipient: string;
  status: string;
  createdAt: string;
}

interface BookingDetailDrawerProps {
  booking: ActiveQueueTicket | null;
  initialTab?: DrawerTab;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onUpdateBooking: (updated: ActiveQueueTicket) => void;
  onDeleteBooking: (id: string) => void;
  onMessagesRead: (bookingId: string) => void;
  onReviewCancellation: (id: string, action: 'APPROVE' | 'DECLINE') => void;
}

export default function BookingDetailDrawer({
  booking,
  initialTab = 'overview',
  onClose,
  onStatusChange,
  onUpdateBooking,
  onDeleteBooking,
  onMessagesRead,
  onReviewCancellation,
}: BookingDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, booking?.id]);

  const fetchMessages = useCallback(async () => {
    if (!booking) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(booking.id)}/messages`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        onMessagesRead(booking.id);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('talago:admin-notifications-updated'));
        }
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingMsgs(false);
    }
  }, [booking, onMessagesRead]);

  const fetchActivity = useCallback(async () => {
    if (!booking) return;
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(Array.isArray(data.activityLogs) ? data.activityLogs : []);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingActivity(false);
    }
  }, [booking]);

  useEffect(() => {
    if (!booking) return;
    if (activeTab === 'conversation') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [booking, activeTab, fetchMessages, fetchActivity]);

  useEffect(() => {
    if (activeTab === 'conversation') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!booking) return null;

  const cleanPhone = normalizePhoneForWhatsApp(booking.customerPhone);
  const paidOnline = booking.amountPaidOnline ?? (booking.paymentScheme === 'FULL' ? booking.totalPriceUSD : 0);
  const cashDue = booking.amountDueOnArrival ?? (booking.paymentScheme === 'FULL' ? 0 : Math.max(0, booking.totalPriceUSD - paidOnline));
  const cancelReq = booking.bookingAnswers?._cancellationRequest;
  const isCancelPending = cancelReq?.status === 'PENDING_REVIEW';

  const handleSendReply = async () => {
    if (!reply.trim() || sending) return;
    const text = reply.trim();
    setSending(true);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(booking.id)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        setReply('');
      }
    } finally {
      setSending(false);
    }
  };

  const tabs: { id: DrawerTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'customer', label: 'Customer & Pickup', icon: <User className="h-3.5 w-3.5" /> },
    { id: 'payment', label: 'Payment & Add-ons', icon: <DollarSign className="h-3.5 w-3.5" /> },
    {
      id: 'conversation',
      label: 'Conversation',
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      badge: booking.unreadMessageCount && booking.unreadMessageCount > 0 ? booking.unreadMessageCount : undefined,
    },
    { id: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <aside
        className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#0B1528] text-white shadow-2xl"
        aria-label="Booking details drawer"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#070F1E] px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black text-[#00E5FF]">{booking.bookingReference}</span>
              <StatusBadge status={booking.status} />
              {booking.source && (
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-white/10">
                  {booking.source}
                </span>
              )}
            </div>
            <h2 className="mt-1 truncate text-sm font-bold text-white">{booking.tourTitle}</h2>
            <p className="text-xs text-slate-400">
              {booking.customerName || 'Guest'} · {booking.customerPhone || booking.customerEmail || 'No contact'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BookingRowActions
              ticket={booking}
              onStatusChange={onStatusChange}
              onUpdateBooking={onUpdateBooking}
              onDeleteBooking={(id) => {
                onDeleteBooking(id);
                onClose();
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-[#070F1E]/60 px-4 py-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-[#070F1E]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isCancelPending && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  Traveler Requested Cancellation
                </span>
                <span className="rounded-full bg-rose-950/80 px-2 py-0.5 text-[10px] font-semibold text-rose-200 border border-rose-500/30">
                  {cancelReq.isWithinPolicy ? `Within Policy (${cancelReq.hoursRemaining}h)` : `Late Cutoff (${cancelReq.hoursRemaining}h)`}
                </span>
              </div>
              <p className="text-slate-300">
                <strong className="text-white">Reason:</strong> {cancelReq.reason}
                {cancelReq.notes ? ` — ${cancelReq.notes}` : ''}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onReviewCancellation(booking.id, 'APPROVE')}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 font-bold text-white transition"
                >
                  Approve Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => onReviewCancellation(booking.id, 'DECLINE')}
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 font-semibold text-slate-300 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
                    Tour & Schedule
                  </span>
                  <p className="text-sm font-bold text-white">{booking.tourTitle}</p>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Travel Date:</span>
                    <span className="font-semibold text-white">{booking.travelDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Pickup Time:</span>
                    <span className="font-semibold text-amber-400">{booking.pickupTime || 'TBD'}</span>
                  </div>
                  {booking.destinationName && (
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Destination:</span>
                      <span className="font-semibold text-white">{booking.destinationName}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400" />
                    Party & Language
                  </span>
                  <p className="text-lg font-black text-white">{booking.guestCount} Guests</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                    <span>Adults: <strong className="text-white">{booking.adultsCount ?? booking.guestCount}</strong></span>
                    <span>Children: <strong className="text-white">{booking.childrenCount ?? 0}</strong></span>
                    {!!booking.infantsCount && (
                      <span>Infants: <strong className="text-white">{booking.infantsCount}</strong></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                    <span>Booking Language:</span>
                    <span className="uppercase font-bold text-white">{booking.language}</span>
                  </div>
                </div>
              </div>

              {booking.notes && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300">
                  <p className="font-bold text-white mb-1">Internal / Lifecycle Notes</p>
                  <p>{booking.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${booking.customerName}, regarding your booking ${booking.bookingReference} for ${booking.tourTitle} on ${booking.travelDate}:`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message on WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('conversation')}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open In-App Conversation
                </button>
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2 text-xs">
                <h3 className="font-bold text-white text-sm mb-2">Customer Contact</h3>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Name</span>
                  <span className="font-semibold text-white">{booking.customerName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Phone (E.164)</span>
                  <span className="font-mono text-[#00E5FF]">{booking.customerPhone || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-200">{booking.customerEmail || '—'}</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2 text-xs">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 mb-2">
                  <Hotel className="h-4 w-4 text-[#00E5FF]" />
                  Pickup & Logistics
                </h3>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Pickup Mode</span>
                  <span className="font-semibold text-white">{booking.pickupType || 'HOTEL'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Hotel / Location</span>
                  <span className="font-semibold text-white">{booking.hotelName || booking.pickupLocationName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Room Number</span>
                  <span className="font-semibold text-white">{booking.roomNumber || '—'}</span>
                </div>
                {booking.zoneName && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Zone</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#00E5FF]" />
                      {booking.zoneName}
                    </span>
                  </div>
                )}
                {booking.pickupAddress && (
                  <div className="py-1 border-b border-white/5">
                    <span className="text-slate-400 block">Pickup Address</span>
                    <span className="text-white">{booking.pickupAddress}</span>
                  </div>
                )}
                {booking.flightNumbers && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Flight Numbers</span>
                    <span className="text-white">{booking.flightNumbers}</span>
                  </div>
                )}
                {booking.pickupDirectives && (
                  <div className="py-1">
                    <span className="text-slate-400 block">Pickup Directives</span>
                    <span className="text-slate-200">{booking.pickupDirectives}</span>
                  </div>
                )}
              </div>

              {booking.specialRequirements && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300">
                  <p className="font-bold text-amber-300 mb-1">Special Requirements</p>
                  <p>{booking.specialRequirements}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Payment Summary</span>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300 border border-white/10">
                    {booking.paymentScheme || 'PAY_ON_ARRIVAL'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-slate-400">Total Price</span>
                  <span className="text-sm font-bold text-white">${booking.totalPriceUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid Online</span>
                  <span className="font-semibold text-emerald-400">${paidOnline.toFixed(2)}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                  <span className="font-semibold text-amber-300">Cash Due at Pickup</span>
                  <span className="text-sm font-black text-amber-300">${cashDue.toFixed(2)}</span>
                </div>
              </div>

              {Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Selected Add-ons
                  </h3>
                  {booking.selectedAddons.map((addon: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                      <span>{addon.title} {addon.quantity > 1 ? `(×${addon.quantity})` : ''}</span>
                      <span className="font-bold text-amber-400">+${addon.total ?? addon.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {booking.bookingAnswers && typeof booking.bookingAnswers === 'object' && Object.keys(booking.bookingAnswers).filter((k) => !k.startsWith('_')).length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#00E5FF]" />
                    Booking Question Answers
                  </h3>
                  {Object.entries(booking.bookingAnswers)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
                        <span className="text-slate-400 capitalize">{k.replace(/^question_/, '').replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-white">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'conversation' && (
            <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-white/10 bg-[#070F1E]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#00E5FF]" />
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-xs text-slate-500">
                    <MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
                    No messages yet for {booking.bookingReference}. Start the conversation below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.senderRole === 'ADMIN';
                    const isSystem = m.senderRole === 'SYSTEM';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isSystem ? 'items-center' : isAdmin ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            isSystem
                              ? 'bg-white/5 text-slate-400 border border-white/10 text-center'
                              : isAdmin
                              ? 'bg-[#00E5FF] text-[#070F1E] font-medium'
                              : 'bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="mt-1 text-[10px] text-slate-500">
                          {isAdmin ? 'You' : isSystem ? 'System' : booking.customerName || 'Customer'} ·{' '}
                          {new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-white/10 p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={`Reply to ${booking.customerName || 'customer'}...`}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF]"
                />
                <button
                  type="button"
                  disabled={sending || !reply.trim()}
                  onClick={handleSendReply}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-xs font-bold text-[#070F1E] hover:bg-cyan-300 disabled:opacity-50 transition"
                >
                  {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-white font-medium">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-white font-medium">
                    {booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '—'}
                  </span>
                </div>
                {booking.lastMessageAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Message</span>
                    <span className="text-[#00E5FF] font-medium">
                      {new Date(booking.lastMessageAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#00E5FF]" />
                  Notification & Event Log
                </h3>
                {loadingActivity ? (
                  <p className="text-xs text-slate-400">Loading activity...</p>
                ) : activityLogs.length === 0 ? (
                  <p className="text-xs text-slate-500">No notification logs recorded for this booking.</p>
                ) : (
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-xs rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
                        <div>
                          <span className="font-semibold text-white">{log.channel}</span>
                          <span className="text-slate-400 ml-2">{log.recipient}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
