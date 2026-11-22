'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  MessageCircle,
  Calendar,
  X,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export interface CustomerNotificationItem {
  id: string;
  type: 'message' | 'booking_confirmed' | 'interest_received' | 'status_update' | 'cancellation';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkUrl: string;
  reference?: string;
  tourTitle?: string;
}

const READ_STORAGE_KEY = 'talago_customer_read_notifications';

function getStoredReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function storeReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export default function CustomerNotificationCenter() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredReadIds());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchCustomerNotifications = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {}

      const res = await fetch('/api/public/my-bookings', {
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!res.ok) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();
      if (!data?.authenticated) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      const items: CustomerNotificationItem[] = [];
      const currentRead = getStoredReadIds();

      // 1. Unread Admin Messages & Active Conversations
      const bookings = Array.isArray(data.bookings) ? data.bookings : [];
      const reservations = Array.isArray(data.reservations) ? data.reservations : [];

      for (const b of bookings) {
        // Message notifications
        if (b.hasUnreadAdminReply && b.lastAdminMessage) {
          const notifId = `msg-booking-${b.id}-${b.lastAdminMessageAt || ''}`;
          items.push({
            id: notifId,
            type: 'message',
            title: 'Message from Concierge',
            message: b.lastAdminMessage,
            timestamp: b.lastAdminMessageAt || b.createdAt,
            isRead: currentRead.has(notifId),
            linkUrl: `/account?tab=messages&bookingRef=${encodeURIComponent(b.bookingReference)}`,
            reference: b.bookingReference,
            tourTitle: b.tour?.translations?.en?.title || 'Tour',
          });
        }

        // Booking confirmation notification
        const confId = `conf-${b.id}`;
        items.push({
          id: confId,
          type: 'booking_confirmed',
          title: b.status === 'CONFIRMED' ? 'Booking Confirmed' : 'Booking Received',
          message: `Booking #${b.bookingReference} for ${b.guestCount} traveler${b.guestCount === 1 ? '' : 's'} on ${new Date(b.travelDate).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}.`,
          timestamp: b.createdAt,
          isRead: currentRead.has(confId),
          linkUrl: `/booking/${b.accessToken}`,
          reference: b.bookingReference,
          tourTitle: b.tour?.translations?.en?.title,
        });

        // Cancellation notification
        if (b.status === 'CANCELLED') {
          const cancelId = `cancel-${b.id}`;
          items.push({
            id: cancelId,
            type: 'cancellation',
            title: 'Booking Cancelled',
            message: `Booking #${b.bookingReference} has been processed as cancelled.`,
            timestamp: b.createdAt,
            isRead: currentRead.has(cancelId),
            linkUrl: `/booking/${b.accessToken}`,
            reference: b.bookingReference,
          });
        }
      }

      // 2. Preliminary Interest Notifications
      for (const r of reservations) {
        if (r.hasUnreadAdminReply && r.lastAdminMessage) {
          const notifId = `msg-lead-${r.id}-${r.lastAdminMessageAt || ''}`;
          items.push({
            id: notifId,
            type: 'message',
            title: 'Inquiry Reply from Concierge',
            message: r.lastAdminMessage,
            timestamp: r.lastAdminMessageAt || r.createdAt,
            isRead: currentRead.has(notifId),
            linkUrl: `/account?tab=messages&bookingRef=${encodeURIComponent(`lead:${r.id}`)}`,
            reference: r.reservationReference,
            tourTitle: r.tourTitle,
          });
        }

        const intId = `interest-${r.id}`;
        items.push({
          id: intId,
          type: 'interest_received',
          title: 'Preliminary Hold Active',
          message: `Spots requested for ${r.tourTitle || 'Tour'} (${r.adults} adult${r.adults === 1 ? '' : 's'}). Reference: ${r.reservationReference}.`,
          timestamp: r.createdAt,
          isRead: currentRead.has(intId),
          linkUrl: `/account?tab=bookings`,
          reference: r.reservationReference,
          tourTitle: r.tourTitle,
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(items);
    } catch {
      // Non-fatal
    }
  }, [language]);

  useEffect(() => {
    fetchCustomerNotifications();
    const timer = setInterval(fetchCustomerNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchCustomerNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      storeReadIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      storeReadIds(next);
      return next;
    });
  };

  const handleNotificationClick = (item: CustomerNotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    router.push(item.linkUrl);
  };

  // Only render if customer has active account session
  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Customer notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 active:scale-95"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-[#070F1E] shadow-lg shadow-emerald-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#00E5FF]" />
              <h3 className="text-sm font-black text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#00E5FF] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                <p className="text-xs font-bold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No notifications right now.</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const isUnread = !n.isRead && !readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/[0.04] ${
                      isUnread ? 'bg-[#00E5FF]/[0.03]' : ''
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {n.type === 'message' ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00E5FF]/20 text-[#00E5FF]">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </div>
                      ) : n.type === 'booking_confirmed' ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : n.type === 'interest_received' ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate ${isUnread ? 'text-[#00E5FF]' : 'text-white'}`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{new Date(n.timestamp).toLocaleDateString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {n.reference && <span className="font-mono text-slate-400">#{n.reference}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-2.5 text-center bg-white/[0.01]">
            <Link
              href="/account?tab=messages"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#00E5FF] hover:underline"
            >
              <span>View full messaging history</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
