'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { normalizePhoneForWhatsApp } from '@/utils/sanitize';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';
import BookingRowActions from './BookingRowActions';
import BookingInvoiceModal from './BookingInvoiceModal';
import BulkBookingManagementModal from './BulkBookingManagementModal';
import StatusBadge from './StatusBadge';
import {
  ChevronDown,
  ChevronRight,
  Hotel,
  MapPin,
  Users,
  Clock,
  DollarSign,
  MessageCircle,
  MessageSquare,
  AlertCircle,
  Search,
  Trash2,
  FileText,
  CheckSquare,
  Square,
  RefreshCw,
  Calendar,
  X,
  Sparkles,
  HelpCircle,
  Send,
  Inbox,
  AlertTriangle,
  User,
  Globe,
  ShieldCheck,
  Check,
  Ban,
  Compass,
  Plane,
  BedDouble,
} from 'lucide-react';

interface AvailableTour {
  id: string;
  title: string;
  category: string | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface BookingQueueProps {
  initialBookings: ActiveQueueTicket[];
  availableTours?: AvailableTour[];
  initialPagination?: PaginationMeta;
  initialTotalUnread?: number;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="w-10 px-3 py-3">
        <div className="h-4 w-4 rounded bg-white/5" />
      </td>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-white/5" />
        </td>
      ))}
      <td className="px-4 py-3">
        <div className="h-6 w-16 rounded bg-white/5" />
      </td>
    </tr>
  );
}

function ExpandedDetails({
  booking,
  onOpenChat,
  onReviewCancellation,
}: {
  booking: ActiveQueueTicket;
  onOpenChat: (id: string) => void;
  onReviewCancellation?: (id: string, action: 'APPROVE' | 'DECLINE') => void;
}) {
  const [showFullTourSpecs, setShowFullTourSpecs] = useState(false);
  const cleanPhone = normalizePhoneForWhatsApp(booking.customerPhone);
  const cashDue =
    booking.amountDueOnArrival ??
    (booking.paymentScheme === 'FULL'
      ? 0
      : Math.max(0, booking.totalPriceUSD - (booking.amountPaidOnline ?? 0)));
  const paidOnline =
    booking.amountPaidOnline ??
    (booking.paymentScheme === 'FULL' ? booking.totalPriceUSD : 0);
  const td = booking.tourDetails;
  const countryCodeMatch = booking.customerPhone?.trim().match(/^(\+\d{1,4})/);
  const dialCode = countryCodeMatch ? countryCodeMatch[1] : null;
  const createdLabel = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const answerEntries =
    booking.bookingAnswers && typeof booking.bookingAnswers === 'object'
      ? Object.entries(booking.bookingAnswers).filter(([k]) => !k.startsWith('_'))
      : [];

  return (
    <div
      className="border-t border-white/10 bg-[#070F1E]/95 px-4 py-5 sm:px-6 space-y-5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pending Cancellation Alert */}
      {booking.bookingAnswers?._cancellationRequest?.status === 'PENDING_REVIEW' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-rose-300 font-bold">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>Traveler Requested Cancellation</span>
                {booking.bookingAnswers._cancellationRequest.isWithinPolicy ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold border border-emerald-500/30">
                    Within Policy ({booking.bookingAnswers._cancellationRequest.hoursRemaining}h left)
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-semibold border border-amber-500/30">
                    Late Cutoff ({booking.bookingAnswers._cancellationRequest.hoursRemaining}h left)
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-slate-300">
                <strong className="text-white">Reason:</strong> {booking.bookingAnswers._cancellationRequest.reason}
                {booking.bookingAnswers._cancellationRequest.notes && (
                  <span> — <strong className="text-white">Notes:</strong> {booking.bookingAnswers._cancellationRequest.notes}</span>
                )}
              </p>
            </div>
            {onReviewCancellation && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onReviewCancellation(booking.id, 'APPROVE')}
                  className="flex-1 sm:flex-initial rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm"
                >
                  Approve (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => onReviewCancellation(booking.id, 'DECLINE')}
                  className="flex-1 sm:flex-initial rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 text-xs font-semibold transition"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Clean Structured Sections: Customer | Trip & Logistics | Booking & Payment */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-white/10">
        {/* Section 1: Customer */}
        <div className="min-w-0 flex flex-col justify-between space-y-4 lg:pr-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-[#00E5FF]">
                <User className="h-3.5 w-3.5 shrink-0" />
                Customer
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                {booking.language?.toUpperCase() || 'EN'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block">Name</span>
                <p className="text-sm font-semibold text-white break-words">{booking.customerName || 'Guest'}</p>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Phone &amp; Country Code</span>
                  <p className="font-mono text-slate-200 font-medium break-all">{booking.customerPhone || 'Not provided'}</p>
                </div>
                {dialCode && (
                  <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-[#00E5FF]">
                    {dialCode}
                  </span>
                )}
              </div>
              {booking.customerEmail && (
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block">Email</span>
                  <p className="text-slate-300 break-all">{booking.customerEmail}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                <span className={booking.customerProfileId ? 'text-emerald-300 font-medium' : 'text-slate-400'}>
                  {booking.customerProfileId ? 'Account linked' : 'Guest checkout'}
                </span>
                {booking.whatsappOptIn !== false && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-300/90">WhatsApp opt-in</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {cleanPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  `Hello ${booking.customerName}, regarding your booking ${booking.bookingReference} for ${booking.tourTitle} on ${booking.travelDate || ''}: Your pickup is scheduled for ${booking.pickupTime || 'lobby'}. Cash balance due: $${cashDue}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                WhatsApp
              </a>
            ) : (
              <span className="flex-1 min-w-[120px] inline-flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
                No Phone
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpenChat(booking.id)}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00E5FF]/15 border border-[#00E5FF]/30 px-3 py-2 text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/25 transition"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              Open Chat
              {(booking.unreadMessageCount ?? 0) > 0 && (
                <span className="rounded-full bg-emerald-400 px-1.5 py-0.2 text-[10px] font-black text-[#070F1E]">
                  {booking.unreadMessageCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Complete Tour & Trip Details */}
        <div className="min-w-0 space-y-3 lg:px-5 pt-4 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              Trip &amp; Logistics
            </span>
            {(td?.durationDisplay || td?.durationHours) && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                {td.durationDisplay || `${td.durationHours}h`}
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white break-words">{booking.tourTitle}</p>
              {booking.destinationName && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-[#00E5FF] shrink-0" />
                  <span className="truncate">
                    {booking.destinationName}
                    {booking.zoneName ? ` · Zone: ${booking.zoneName}` : ''}
                  </span>
                </p>
              )}
              {td?.description && (
                <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {td.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/[0.02] p-2.5">
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block">Date &amp; Time</span>
                <p className="font-semibold text-white">{booking.travelDate}</p>
                <p className="text-[11px] font-medium text-amber-400">{booking.pickupTime || 'Time TBD'}</p>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 block">Guests ({booking.guestCount})</span>
                <p className="font-medium text-slate-200">
                  {booking.adultsCount ?? booking.guestCount} Ad · {booking.childrenCount ?? 0} Ch
                  {!!booking.infantsCount && ` · ${booking.infantsCount} Inf`}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.02] p-2.5 space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-200 min-w-0 truncate">
                  <Hotel className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                  <span className="truncate">{booking.hotelName || booking.pickupLocationName || 'Direct / Meeting Point'}</span>
                </span>
                {booking.roomNumber && (
                  <span className="shrink-0 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00E5FF]">
                    Rm {booking.roomNumber}
                  </span>
                )}
              </div>
              {(booking.pickupAddress || td?.meetingPoint) && (
                <p className="text-[11px] text-slate-400 break-words">
                  Meeting/Address: {booking.pickupAddress || td?.meetingPoint}
                </p>
              )}
              {booking.pickupDirectives && (
                <p className="text-[11px] text-amber-300/90 break-words">Note: {booking.pickupDirectives}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
              {td?.guideLanguages && td.guideLanguages.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3 w-3 text-[#00E5FF]" />
                  Guide: {td.guideLanguages.join(', ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Free cancel: {td?.freeCancellationHours ?? 24}h prior
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowFullTourSpecs((v) => !v)}
              className="text-[11px] font-semibold text-[#00E5FF] hover:underline flex items-center gap-1"
            >
              {showFullTourSpecs ? 'Hide' : 'Show'} inclusions, itinerary &amp; requirements
              <ChevronDown className={`h-3 w-3 transition-transform ${showFullTourSpecs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section 3: Booking Details & Financials */}
        <div className="min-w-0 space-y-3 lg:pl-5 pt-4 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              Booking &amp; Payment
            </span>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-mono text-slate-400">
              {booking.source || 'WEBSITE'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{booking.bookingReference}</span>
                <StatusBadge status={booking.status} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Created</span>
              <span className="text-slate-200">{createdLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Total ({booking.currency || 'USD'})</span>
              <span className="text-sm font-bold text-white">${booking.totalPriceUSD.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Paid Online ({booking.paymentScheme || 'ARRIVAL'})</span>
              <span className="font-semibold text-emerald-400">${paidOnline.toFixed(2)}</span>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 flex items-center justify-between gap-2">
              <span className="font-semibold text-amber-300">Cash Due at Pickup</span>
              <span className="text-sm font-bold text-amber-300">${cashDue.toFixed(2)}</span>
            </div>

            {(booking.flightNumbers || booking.bedConfiguration) && (
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-300">
                {booking.flightNumbers && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                    <Plane className="h-3 w-3 text-[#00E5FF]" /> Flight: {booking.flightNumbers}
                  </span>
                )}
                {booking.bedConfiguration && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5">
                    <BedDouble className="h-3 w-3 text-[#00E5FF]" /> {booking.bedConfiguration}
                  </span>
                )}
              </div>
            )}

            {booking.specialRequirements && (
              <div className="rounded-lg bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-200 break-words">
                <strong>Special Req:</strong> {booking.specialRequirements}
              </div>
            )}

            {booking.notes && (
              <div className="rounded-lg bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-300 break-words">
                <strong className="text-white">Notes:</strong> {booking.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Full Tour Specs (Inclusions, Exclusions, Itinerary, Requirements) */}
      {showFullTourSpecs && td && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 rounded-2xl border border-white/10 bg-[#0B1528]/60 p-4 text-xs">
          {td.inclusions && td.inclusions.length > 0 && (
            <div>
              <p className="font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Included
              </p>
              <ul className="space-y-1 text-slate-300">
                {td.inclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {td.exclusions && td.exclusions.length > 0 && (
            <div>
              <p className="font-bold text-rose-400 mb-1.5 flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" /> Excluded
              </p>
              <ul className="space-y-1 text-slate-400">
                {td.exclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            {td.requirements && (
              <div>
                <p className="font-bold text-amber-400 mb-1">Requirements</p>
                <p className="text-slate-300">{td.requirements}</p>
              </div>
            )}
            {(td.fitnessLevel || td.accessibilityNotes || td.wheelchairAccessible) && (
              <div>
                <p className="font-bold text-slate-200 mb-1">Accessibility &amp; Fitness</p>
                <p className="text-slate-400">
                  {td.fitnessLevel ? `Fitness: ${td.fitnessLevel}. ` : ''}
                  {td.wheelchairAccessible ? 'Wheelchair accessible. ' : ''}
                  {td.accessibilityNotes || ''}
                </p>
              </div>
            )}
            {Array.isArray(td.safetyGuidelines) && td.safetyGuidelines.length > 0 && (
              <div>
                <p className="font-bold text-slate-200 mb-1">Safety</p>
                <p className="text-slate-400">{td.safetyGuidelines.join(' · ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Add-ons & Custom Booking Answers */}
      {((Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0) || answerEntries.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0B1528]/60 p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Selected Add-ons &amp; Upgrades
              </span>
              <div className="space-y-1.5">
                {booking.selectedAddons.map((addon: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="font-medium text-white">
                      {addon.title} {addon.quantity > 1 ? `(×${addon.quantity})` : ''}
                    </span>
                    <span className="font-bold text-amber-400">+${addon.total ?? addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {answerEntries.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0B1528]/60 p-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-3.5 w-3.5 text-[#00E5FF]" />
                Booking Question Answers
              </span>
              <div className="space-y-1.5">
                {answerEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 text-xs text-slate-300 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5">
                    <span className="text-slate-400 capitalize">{k.replace(/^question_/, '').replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-white text-right">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Inline Booking Chat Panel ────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  text: string;
  senderRole: string;
  createdAt: string;
}

function BookingChatPanel({ bookingId, bookingReference, onClose, onMessagesRead }: { bookingId: string; bookingReference: string; onClose: () => void; onMessagesRead?: (bookingId: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/messages`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (onMessagesRead) onMessagesRead(bookingId);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [bookingId, onMessagesRead]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setReply('');
      await fetchMessages();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full h-[90dvh] sm:h-[600px] sm:max-h-[85vh] sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-cyan-500/30 bg-[#0B1528] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm font-bold text-white">Chat — {bookingReference}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading && (
            <div className="text-center text-xs text-slate-500 py-8">Loading messages…</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center text-xs text-slate-500 py-8">No messages yet for this booking.</div>
          )}
          {messages.map((msg) => {
            if (msg.senderRole === 'SYSTEM') {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="max-w-[90%] rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-[11px] text-sky-200 text-center leading-relaxed shadow-sm">
                    <span className="font-bold text-[#00E5FF] mr-1 uppercase text-[10px]">[SYSTEM]</span>
                    {msg.text}
                    <span className="block mt-0.5 text-[9px] text-sky-400/60 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            }

            const isAdmin = msg.senderRole === 'ADMIN';
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                  isAdmin
                    ? 'bg-[#00E5FF]/20 text-white border border-[#00E5FF]/30'
                    : 'bg-white/[0.06] text-slate-200 border border-white/10'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className="mt-1 text-[10px] opacity-50 text-right">
                    {isAdmin ? 'You' : 'Guest'} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="border-t border-white/10 p-3 bg-[#0B1528] shrink-0 sticky bottom-0 flex items-center gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a reply…"
            className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00E5FF]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 transition-colors disabled:opacity-50"
          >
            {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingQueue({
  initialBookings,
  availableTours = [],
  initialPagination,
  initialTotalUnread,
}: BookingQueueProps) {
  const [bookings, setBookings] = useState<ActiveQueueTicket[]>(initialBookings);
  const [pagination, setPagination] = useState<PaginationMeta>(
    initialPagination || {
      page: 1,
      pageSize: 25,
      total: initialBookings.length,
      totalPages: 1,
    }
  );
  const [loadingPage, setLoadingPage] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [activeChatBooking, setActiveChatBooking] = useState<{ id: string; ref: string } | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(initialTotalUnread ?? 0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const searchParams = useSearchParams();
  const [filterCancellationsOnly, setFilterCancellationsOnly] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const handledDeepLinkRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'messages') {
      setFilterUnreadOnly(true);
    } else if (filterParam === 'cancellations') {
      setFilterCancellationsOnly(true);
    }

    const refParam = searchParams.get('ref') || searchParams.get('chatRef') || searchParams.get('conversationId');
    const chatParam = searchParams.get('chat');
    if (refParam && handledDeepLinkRef.current !== refParam) {
      handledDeepLinkRef.current = refParam;
      setSearchQuery(refParam);
      const match = bookings.find(
        (b) =>
          b.bookingReference.toLowerCase() === refParam.toLowerCase() ||
          b.id === refParam ||
          b.conversationId === refParam
      );
      if (match) {
        if (chatParam === '1' || searchParams.get('chatRef') || searchParams.get('conversationId')) {
          setActiveChatBooking({ id: match.id, ref: match.bookingReference });
        } else {
          setExpandedBookingId(match.id);
        }
      }
    }
  }, [searchParams, bookings]);

  const fetchServerBookings = useCallback(
    async (targetPage: number) => {
      setLoadingPage(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(targetPage));
        params.set('pageSize', String(pagination.pageSize));
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
        if (selectedTourId !== 'ALL') params.set('tourId', selectedTourId);
        if (startDate) params.set('dateFrom', startDate);
        if (endDate) params.set('dateTo', endDate);
        if (filterUnreadOnly) params.set('unreadOnly', 'true');

        const res = await fetch(`/api/admin/bookings?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.bookings)) setBookings(data.bookings);
          if (data.pagination) setPagination(data.pagination);
          if (typeof data.summary?.totalUnread === 'number') {
            setTotalUnreadCount(data.summary.totalUnread);
          }
        }
      } catch {
        // non-fatal
      } finally {
        setLoadingPage(false);
      }
    },
    [pagination.pageSize, searchQuery, selectedStatus, selectedTourId, startDate, endDate, filterUnreadOnly]
  );

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchServerBookings(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedTourId, startDate, endDate, filterUnreadOnly, fetchServerBookings]);

  const markBookingMessagesRead = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, unreadMessageCount: 0 } : b))
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talago:admin-notifications-updated'));
    }
  }, []);

  const unreadMap = useMemo(() => {
    const map: Record<string, { count: number; lastMessage?: string; lastMessageAt?: string }> = {};
    for (const b of bookings) {
      const count = b.unreadMessageCount ?? 0;
      if (count > 0 || b.lastMessageAt || b.lastMessagePreview) {
        map[b.bookingReference] = {
          count,
          lastMessage: b.lastMessagePreview ?? undefined,
          lastMessageAt: b.lastMessageAt ?? undefined,
        };
      }
    }
    return map;
  }, [bookings]);

  // Keep totalUnreadCount in sync if unreadMap updates
  const activeUnreadTotal = useMemo(() => {
    const sum = Object.values(unreadMap).reduce((acc, item) => acc + item.count, 0);
    return Math.max(sum, totalUnreadCount);
  }, [unreadMap, totalUnreadCount]);

  const pendingCancellationBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.bookingAnswers?._cancellationRequest?.status === 'PENDING_REVIEW'
    );
  }, [bookings]);
  const pendingCancellationCount = pendingCancellationBookings.length;

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Date Basis & Bulk Management State
  const [dateBasis, setDateBasis] = useState<'travelDate' | 'createdAt'>('travelDate');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Invoice Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Extract distinct months from bookings for quick filtering
  const distinctMonths = useMemo(() => {
    const months = new Set<string>();
    bookings.forEach((b) => {
      const d = dateBasis === 'travelDate' ? b.travelDate : b.createdAt?.split('T')[0];
      if (d && d.length >= 7) {
        months.add(d.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [bookings, dateBasis]);

  // Extract distinct categories
  const distinctCategories = useMemo(() => {
    const cats = new Set<string>();
    bookings.forEach((b) => {
      if (b.category) cats.add(b.category.toLowerCase());
    });
    availableTours.forEach((t) => {
      if (t.category) cats.add(t.category.toLowerCase());
    });
    return Array.from(cats).sort();
  }, [bookings, availableTours]);

  // Filtered bookings calculation
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = b.customerName?.toLowerCase().includes(query);
        const matchesPhone = b.customerPhone?.toLowerCase().includes(query);
        const matchesEmail = b.customerEmail?.toLowerCase().includes(query);
        const matchesRef = b.bookingReference?.toLowerCase().includes(query);
        const matchesHotel = b.hotelName?.toLowerCase().includes(query);
        const matchesTour = b.tourTitle?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesRef && !matchesHotel && !matchesTour) {
          return false;
        }
      }

      // Tour filter
      if (selectedTourId !== 'ALL' && b.tourId !== selectedTourId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && (b.category?.toLowerCase() !== selectedCategory.toLowerCase())) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && b.status !== selectedStatus) {
        return false;
      }

      const activeDate = dateBasis === 'travelDate' ? b.travelDate : b.createdAt?.split('T')[0];

      // Month filter (YYYY-MM)
      if (selectedMonth !== 'ALL') {
        if (!activeDate || !activeDate.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Custom date range
      if (startDate && (!activeDate || activeDate < startDate)) {
        return false;
      }
      if (endDate && (!activeDate || activeDate > endDate)) {
        return false;
      }

      // Unread messages filter
      if (filterUnreadOnly) {
        const unread = unreadMap[b.bookingReference];
        if (!unread || unread.count <= 0) {
          return false;
        }
      }

      // Cancellation requests filter
      if (filterCancellationsOnly) {
        if (b.bookingAnswers?._cancellationRequest?.status !== 'PENDING_REVIEW') {
          return false;
        }
      }

      return true;
    });
  }, [bookings, searchQuery, selectedTourId, selectedCategory, selectedStatus, selectedMonth, startDate, endDate, filterCancellationsOnly, filterUnreadOnly, unreadMap, dateBasis]);

  // Quick statistics for filtered set
  const stats = useMemo(() => {
    const count = filteredBookings.length;
    const pax = filteredBookings.reduce((sum, b) => sum + (b.guestCount || 0), 0);
    const revenue = filteredBookings.reduce((sum, b) => sum + (b.totalPriceUSD || 0), 0);
    const paidOnline = filteredBookings.reduce((sum, b) => sum + (b.amountPaidOnline || 0), 0);
    const dueArrival = filteredBookings.reduce((sum, b) => sum + (b.amountDueOnArrival || 0), 0);
    return { count, pax, revenue, paidOnline, dueArrival };
  }, [filteredBookings]);

  // Multi-select handlers
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.size === filteredBookings.length && filteredBookings.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map((b) => b.id)));
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTourId('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedMonth('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedIds(new Set());
    setFilterCancellationsOnly(false);
    setFilterUnreadOnly(false);
  };

  // Status and Single Row Handlers
  const handleReviewCancellation = async (id: string, action: 'APPROVE' | 'DECLINE') => {
    try {
      const res = await fetch('/api/admin/bookings/' + id + '/cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Action failed' }));
        alert(err.error || 'Failed to update cancellation request');
        return;
      }
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const prevAnswers = typeof b.bookingAnswers === 'object' && b.bookingAnswers !== null ? b.bookingAnswers : {};
          const prevReq = (prevAnswers && prevAnswers._cancellationRequest) || {};
          return {
            ...b,
            status: action === 'APPROVE' ? ('CANCELLED' as BookingStatus) : b.status,
            bookingAnswers: {
              ...prevAnswers,
              _cancellationRequest: {
                ...prevReq,
                status: action === 'APPROVE' ? 'APPROVED' : 'DECLINED',
                reviewedAt: new Date().toISOString(),
              },
            },
          };
        })
      );
    } catch (err: any) {
      alert((err && err.message) || 'Error processing cancellation review');
    }
  };

  const handleStatusChange = (id: string, newStatus: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const handleUpdateBooking = (updated: ActiveQueueTicket) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  const handleDeleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedBookingId((prev) => (prev === id ? null : id));
  };

  const openChat = (id: string, ref: string) => {
    setActiveChatBooking({ id, ref });
  };

  // Bulk Delete Selected Bookings
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} selected booking(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }

      const idsToDelete = new Set(selectedIds);
      setBookings((prev) => prev.filter((b) => !idsToDelete.has(b.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
      alert(err.message || 'Failed to delete selected bookings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete All Filtered Bookings
  const handleDeleteAllFiltered = async () => {
    if (filteredBookings.length === 0) return;
    const count = filteredBookings.length;
    const filterDesc = [
      selectedTourId !== 'ALL' ? `Tour: ${availableTours.find(t => t.id === selectedTourId)?.title || selectedTourId}` : '',
      selectedMonth !== 'ALL' ? `Month: ${selectedMonth}` : '',
      startDate || endDate ? `Dates: ${startDate || 'start'} to ${endDate || 'end'}` : '',
      selectedStatus !== 'ALL' ? `Status: ${selectedStatus}` : '',
    ].filter(Boolean).join(' | ') || 'All visible bookings';

    const confirmed = window.confirm(
      `⚠️ CAUTION: You are about to permanently delete all ${count} booking(s) matching the current filter:\r\n\r\n[ ${filterDesc} ]\r\n\r\nTotal value: $${stats.revenue.toFixed(2)} USD.\r\n\r\nAre you sure you want to delete all of them?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const targetIds = filteredBookings.map((b) => b.id);
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }

      const idsToDelete = new Set(targetIds);
      setBookings((prev) => prev.filter((b) => !idsToDelete.has(b.id)));
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Filtered delete failed:', err);
      alert(err.message || 'Failed to delete filtered bookings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format filter label for the Invoice Header
  const invoiceFilterDescription = useMemo(() => {
    if (selectedIds.size > 0) {
      return `${selectedIds.size} Selected Reservation(s)`;
    }
    const parts: string[] = [];
    if (selectedTourId !== 'ALL') {
      const t = availableTours.find((x) => x.id === selectedTourId);
      parts.push(`Tour: ${t?.title || selectedTourId}`);
    }
    if (selectedCategory !== 'ALL') {
      parts.push(`Category: ${selectedCategory.toUpperCase()}`);
    }
    if (selectedMonth !== 'ALL') {
      parts.push(`Month: ${selectedMonth}`);
    }
    if (startDate || endDate) {
      parts.push(`Dates: ${startDate || 'From start'} to ${endDate || 'Present'}`);
    }
    if (selectedStatus !== 'ALL') {
      parts.push(`Status: ${selectedStatus}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'All Current Bookings';
  }, [selectedIds, selectedTourId, selectedCategory, selectedMonth, startDate, endDate, selectedStatus, availableTours]);

  // Which bookings to feed to the Invoice Modal
  const invoiceBookings = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredBookings.filter((b) => selectedIds.has(b.id));
    }
    return filteredBookings;
  }, [selectedIds, filteredBookings]);

  const hasActiveFilters =
    filterUnreadOnly ||
    filterCancellationsOnly ||
    searchQuery.trim() !== '' ||
    selectedTourId !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedMonth !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <div className="space-y-6">

      {/* Action Queue Focus Pills */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => { setFilterUnreadOnly(false); setFilterCancellationsOnly(false); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            !filterUnreadOnly && !filterCancellationsOnly
              ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
              : 'border border-white/10 bg-[#0B1528] text-slate-400 hover:text-white'
          }`}
        >
          <span>All Bookings</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">{bookings.length}</span>
        </button>

        <button
          type="button"
          onClick={() => { setFilterUnreadOnly((prev) => !prev); setFilterCancellationsOnly(false); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            filterUnreadOnly
              ? 'bg-emerald-500 text-[#070F1E] shadow-md shadow-emerald-500/20'
              : 'border border-white/10 bg-[#0B1528] text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Unread Messages</span>
          {activeUnreadTotal > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-[#070F1E] text-[10px] font-black animate-pulse">
              {activeUnreadTotal}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px]">0</span>
          )}
        </button>

        {pendingCancellationCount > 0 && (
          <button
            type="button"
            onClick={() => { setFilterCancellationsOnly((prev) => !prev); setFilterUnreadOnly(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              filterCancellationsOnly
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Cancellation Requests</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {pendingCancellationCount}
            </span>
          </button>
        )}
      </div>

      {/* Pending Cancellations Banner */}
      {pendingCancellationCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/90 via-red-950/70 to-[#0B1528] p-4 sm:p-5 shadow-2xl shadow-rose-950/50 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertTriangle className="h-6 w-6 animate-pulse text-rose-400" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-[#070F1E]">
                  {pendingCancellationCount}
                </span>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>{pendingCancellationCount} Booking Cancellation Request{pendingCancellationCount > 1 ? 's' : ''} Awaiting Review</span>
                  <span className="rounded-full bg-rose-500/30 border border-rose-500/50 px-2 py-0.5 text-[10px] font-bold text-rose-200 uppercase tracking-wider">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Customers requested cancellation. Click the button to inspect and approve or decline immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterCancellationsOnly((prev) => !prev)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition shadow-lg ${
                  filterCancellationsOnly
                    ? 'bg-white text-rose-950 hover:bg-slate-200 ring-2 ring-white/50'
                    : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {filterCancellationsOnly ? 'Show All Bookings' : `Show Requests (${pendingCancellationCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Statistics Cards Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{stats.count}</span>
            <span className="text-[10px] text-slate-500">of {bookings.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF]">Total Travelers</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#00E5FF]">{stats.pax}</span>
            <span className="text-[10px] text-slate-400">Pax</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white">Total Revenue</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">${stats.revenue.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">USD</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Paid Online</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">${stats.paidOnline.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">Collected</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-[#0B1528] p-4 shadow-xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Due Cash on Arrival</p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">${stats.dueArrival.toFixed(0)}</span>
            <span className="text-[10px] text-slate-500">To Collect</span>
          </div>
        </div>
      </div>

{/* 2. Advanced Filtering Controls Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-5 shadow-2xl space-y-4">
        {/* Row 1: Search, Tour, Category, Status */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest, phone, ref, hotel..."
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#00E5FF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tour Dropdown */}
          <div>
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Tours ({availableTours.length})</option>
              {availableTours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Categories</option>
              {distinctCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00E5FF] transition-colors"
            >
              <option value="ALL">All Statuses</option>
              {pendingCancellationCount > 0 && (
                <option value="CANCELLATION_REQUESTED" className="text-rose-400 font-bold bg-[#070F1E]">
                  ⚠️ Cancellation Requests ({pendingCancellationCount})
                </option>
              )}
              <option value="INTERESTED">Interested</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Filters & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Basis Toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#070F1E] p-1 text-xs">
              <button
                type="button"
                onClick={() => setDateBasis('travelDate')}
                className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                  dateBasis === 'travelDate'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Travel Date
              </button>
              <button
                type="button"
                onClick={() => setDateBasis('createdAt')}
                className={`rounded-lg px-2.5 py-1 font-bold transition-all ${
                  dateBasis === 'createdAt'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Booking Date
              </button>
            </div>

            {/* Quick Month Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-[#00E5FF]" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
                className="bg-transparent text-xs text-white outline-none"
              >
                <option value="ALL" className="bg-[#070F1E]">All Months</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m} className="bg-[#070F1E]">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className="rounded-xl border border-white/10 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00E5FF]"
                title="From Date"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className="rounded-xl border border-white/10 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#00E5FF]"
                title="To Date"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* Action Buttons: Invoice Generation & Bulk Delete */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Month Management Button */}
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span>Bulk Month Actions</span>
            </button>

            {/* Generate Invoice / Statement Button */}
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-3.5 py-2 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF] hover:text-[#070F1E]"
            >
              <FileText className="h-4 w-4" />
              <span>
                {selectedIds.size > 0
                  ? `Invoice (${selectedIds.size} Selected)`
                  : `Invoice / Statement (${filteredBookings.length})`}
              </span>
            </button>

            {/* Delete Selected Button */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 px-3.5 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Delete All Filtered Button (shown if filter is active and nothing is explicitly selected) */}
            {hasActiveFilters && selectedIds.size === 0 && filteredBookings.length > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAllFiltered}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Delete All Filtered ({filteredBookings.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bookings Table (Desktop) */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-white">No matching bookings found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search or date filter parameters.</p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#00E5FF] hover:bg-white/10"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="hidden rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="w-10 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="flex items-center justify-center text-slate-400 hover:text-white"
                    title={selectedIds.size === filteredBookings.length ? 'Deselect All' : 'Select All Filtered'}
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredBookings.length ? (
                      <CheckSquare className="h-4 w-4 text-[#00E5FF]" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Tour</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Guests</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Due Cash</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Hotel</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredBookings.map((b) => {
                const isSelected = selectedIds.has(b.id);
                const isCancelPending = b.bookingAnswers?._cancellationRequest?.status === 'PENDING_REVIEW';
                const cancelReq = b.bookingAnswers?._cancellationRequest;
                return (
                  <React.Fragment key={b.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isCancelPending
                          ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500 ring-1 ring-rose-500/30'
                          : isSelected
                            ? 'bg-[#00E5FF]/5'
                            : expandedBookingId === b.id
                              ? 'bg-white/[0.04]'
                              : 'hover:bg-white/[0.02]'
                      }`}
                      onClick={() => toggleExpand(b.id)}
                    >
                      {/* Checkbox Column */}
                      <td className="px-4 py-3" onClick={(e) => toggleSelect(b.id, e)}>
                        <button
                          type="button"
                          className={`flex items-center justify-center rounded transition-colors ${
                            isSelected ? 'text-[#00E5FF]' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>

                      {/* Expand / Collapse Indicator */}
                      <td className="px-2 py-3">
                        {expandedBookingId === b.id ? (
                          <ChevronDown className="h-4 w-4 text-[#00E5FF]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </td>

                      {/* Booking Reference */}
                      <td className="px-4 py-3 text-sm font-mono font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#00E5FF] hover:underline">{b.bookingReference}</span>
                          {b.bookingAnswers?._cancellationRequest?.status === 'PENDING_REVIEW' && (
                            <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-sans font-black uppercase tracking-wider animate-pulse">
                              Cancel Req
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tour Title & Category */}
                      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-300">
                        <div className="truncate font-medium">{b.tourTitle}</div>
                        {b.category && (
                          <span className="text-[10px] uppercase text-[#00E5FF]">{b.category}</span>
                        )}
                      </td>

                      {/* Customer Name & Phone */}
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{b.customerName}</span>
                          {unreadMap[b.bookingReference]?.count > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-[#070F1E] animate-pulse">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {unreadMap[b.bookingReference].count} new
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{b.customerPhone}</div>
                        {unreadMap[b.bookingReference]?.lastMessage && (
                          <div className="text-[11px] text-emerald-400/90 truncate max-w-[200px] mt-0.5" title={unreadMap[b.bookingReference].lastMessage}>
                            💬 {unreadMap[b.bookingReference].lastMessage}
                          </div>
                        )}
                      </td>

                      {/* Travel Date */}
                      <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                        {b.travelDate}
                      </td>

                      {/* Guests */}
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span className="font-bold text-white">{b.guestCount}</span> Pax
                      </td>

                      {/* Total Price */}
                      <td className="px-4 py-3 text-sm font-bold text-white whitespace-nowrap">
                        ${b.totalPriceUSD.toFixed(2)}
                      </td>

                      {/* Due on Arrival */}
                      <td className="px-4 py-3 text-sm font-semibold text-amber-400 whitespace-nowrap">
                        ${(b.amountDueOnArrival || 0).toFixed(2)}
                      </td>

                      {/* Hotel */}
                      <td className="max-w-[140px] truncate px-4 py-3 text-sm text-slate-400">
                        {b.hotelName || '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-xs">
                        {isCancelPending ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-block rounded-lg px-2.5 py-1 font-black uppercase tracking-wider text-[10px] bg-rose-600 text-white border border-rose-500 shadow-sm animate-pulse">
                              Cancel Review
                            </span>
                            <span className="text-[9px] text-rose-300 font-bold uppercase tracking-wider">
                              {cancelReq?.isWithinPolicy ? '✓ In Policy' : '⚠️ Late Cutoff'}
                            </span>
                          </div>
                        ) : (
                          <StatusBadge status={b.status} />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(b.id, b.bookingReference);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                              unreadMap[b.bookingReference]?.count > 0
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/40'
                            }`}
                            title="Open Conversation"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Chat</span>
                            {unreadMap[b.bookingReference]?.count > 0 && (
                              <span className="rounded-full bg-emerald-400 px-1.5 py-0.2 text-[9px] font-black text-[#070F1E]">
                                {unreadMap[b.bookingReference].count}
                              </span>
                            )}
                          </button>
                          {isCancelPending && (
                            <div className="flex items-center gap-1.5 mr-1">
                              <button
                                type="button"
                                onClick={() => handleReviewCancellation(b.id, 'APPROVE')}
                                className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition"
                                title="Approve Cancellation"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewCancellation(b.id, 'DECLINE')}
                                className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 text-[11px] font-semibold transition"
                                title="Decline Cancellation"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          <BookingRowActions
                            ticket={b}
                            onStatusChange={handleStatusChange}
                            onUpdateBooking={handleUpdateBooking}
                            onDeleteBooking={handleDeleteBooking}
                          />
                        </div>
                      </td>
                    </tr>
                    {/* Inline Expanded Booking Details */}
                    {expandedBookingId === b.id && (
                      <tr>
                        <td colSpan={12} className="p-0 border-b border-white/10">
                          <ExpandedDetails
                            booking={b}
                            onOpenChat={(id) => openChat(id, b.bookingReference)}
                            onReviewCancellation={handleReviewCancellation}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Mobile Cards View (<lg) */}
      <div className="space-y-3 lg:hidden">
        {filteredBookings.map((b) => {
          const isSelected = selectedIds.has(b.id);
          const isCancelPending = b.bookingAnswers?._cancellationRequest?.status === 'PENDING_REVIEW';
          const cancelReq = b.bookingAnswers?._cancellationRequest;
          const unreadCount = unreadMap[b.bookingReference]?.count || 0;
          return (
            <div
              key={b.id}
              className={`space-y-3 rounded-xl border p-3.5 transition-colors overflow-hidden ${
                isCancelPending
                  ? 'border-rose-500/70 bg-rose-950/20'
                  : isSelected
                    ? 'border-[#00E5FF] bg-[#00E5FF]/5'
                    : 'border-white/10 bg-[#0B1528]'
              }`}
            >
              {/* Outside Prominent Cancellation Alert (Mobile) */}
              {isCancelPending && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/15 p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span className="truncate">Cancellation Requested</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                      ~{cancelReq?.hoursRemaining ?? '?'}h left
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 break-words">
                    <strong className="text-white">Reason:</strong> {cancelReq?.reason || 'No reason provided'}
                    {cancelReq?.notes && <span> ({cancelReq.notes})</span>}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                    <button
                      type="button"
                      onClick={() => handleReviewCancellation(b.id, 'APPROVE')}
                      className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white py-1.5 text-xs font-bold transition text-center"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewCancellation(b.id, 'DECLINE')}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 text-xs font-semibold transition text-center"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Header: Select, Reference, Status Badge & Compact Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleSelect(b.id, e)}
                    className={`shrink-0 ${isSelected ? 'text-[#00E5FF]' : 'text-slate-500'}`}
                    aria-label="Select booking"
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#00E5FF] truncate">{b.bookingReference}</span>
                  <StatusBadge status={b.status} />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openChat(b.id, b.bookingReference);
                    }}
                    className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-semibold transition ${
                      unreadCount > 0
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-[#00E5FF]/40 hover:text-[#00E5FF]'
                    }`}
                    title="Open Conversation"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-[#070F1E]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <BookingRowActions
                    ticket={b}
                    compact
                    hideStatusBadge
                    onStatusChange={handleStatusChange}
                    onUpdateBooking={handleUpdateBooking}
                    onDeleteBooking={handleDeleteBooking}
                  />
                </div>
              </div>

              {/* Clean Tappable Overview */}
              <div
                className="space-y-2.5 text-xs cursor-pointer"
                onClick={() => toggleExpand(b.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white line-clamp-1">{b.tourTitle}</p>
                  {b.category && (
                    <p className="text-[11px] text-[#00E5FF]/80 capitalize">{b.category.toLowerCase()}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Customer</span>
                    <p className="font-medium text-white truncate">{b.customerName}</p>
                    {b.customerPhone && <p className="text-[11px] text-slate-400 font-mono truncate">{b.customerPhone}</p>}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Date &amp; Time</span>
                    <p className="text-slate-200 font-medium truncate">{b.travelDate}</p>
                    {b.pickupTime && <p className="text-[11px] text-amber-400 truncate">{b.pickupTime}</p>}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Guests</span>
                    <p className="text-slate-200 font-medium">
                      {b.guestCount} Pax ({b.adultsCount ?? b.guestCount} Ad · {b.childrenCount ?? 0} Ch)
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 block">Total / Due Cash</span>
                    <p className="font-semibold text-white">
                      ${b.totalPriceUSD.toFixed(2)}{' '}
                      <span className="text-amber-400 font-normal">(${(b.amountDueOnArrival || 0).toFixed(2)} cash)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest message preview if available */}
              {unreadMap[b.bookingReference]?.lastMessage && (
                <div
                  className="border-l-2 border-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-r-lg text-xs text-emerald-300 cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => openChat(b.id, b.bookingReference)}
                >
                  <div className="min-w-0 truncate">
                    <span className="font-semibold">Message: </span>
                    <span className="opacity-90">{unreadMap[b.bookingReference].lastMessage}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 shrink-0 font-semibold underline">Reply</span>
                </div>
              )}

              {/* Inline Expand Toggle Button (Mobile) */}
              <button
                type="button"
                onClick={() => toggleExpand(b.id)}
                className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 hover:text-[#00E5FF] transition-colors bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 rounded-lg"
              >
                <span>{expandedBookingId === b.id ? 'Hide details' : 'View details & logistics'}</span>
                {expandedBookingId === b.id ? (
                  <ChevronDown className="h-4 w-4 text-[#00E5FF]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Inline Expanded Details (Mobile) */}
              {expandedBookingId === b.id && (
                <div className="pt-1">
                  <ExpandedDetails
                    booking={b}
                    onOpenChat={(id) => openChat(id, b.bookingReference)}
                    onReviewCancellation={handleReviewCancellation}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Server-side Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3 text-xs text-slate-300">
          <span>
            Page <strong className="text-white">{pagination.page}</strong> of{' '}
            <strong className="text-white">{pagination.totalPages}</strong> ·{' '}
            <strong className="text-white">{pagination.total}</strong> total bookings
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loadingPage}
              onClick={() => fetchServerBookings(pagination.page - 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-white hover:bg-white/10 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loadingPage}
              onClick={() => fetchServerBookings(pagination.page + 1)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-white hover:bg-white/10 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Modal */}
      {activeChatBooking && (
        <BookingChatPanel
          bookingId={activeChatBooking.id}
          bookingReference={activeChatBooking.ref}
          onClose={() => setActiveChatBooking(null)}
          onMessagesRead={markBookingMessagesRead}
        />
      )}

      {/* 6. Invoice & Statement Modal */}
      <BookingInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        bookings={invoiceBookings}
        filterLabel={invoiceFilterDescription}
      />

      {/* 7. Bulk Month Management Modal */}
      <BulkBookingManagementModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialYear={selectedMonth !== 'ALL' ? selectedMonth.slice(0, 4) : '2026'}
        initialMonth={selectedMonth !== 'ALL' ? selectedMonth.slice(5, 7) : 'ALL'}
        initialDateBasis={dateBasis}
        initialStatus={selectedStatus}
        initialTourId={selectedTourId}
        onCompleted={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}
