'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  CalendarCheck,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';

export interface AdminActionNotification {
  id: string;
  logId?: string;
  convId?: string;
  leadId?: string;
  type: 'unread_message' | 'cancellation_request' | 'new_lead' | 'new_booking';
  title: string;
  customerName: string;
  tourTitle?: string;
  detail: string;
  timestamp: string;
  isRead?: boolean;
  actionRequired: boolean;
  linkUrl: string;
  reference?: string;
}

export default function AdminNotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AdminActionNotification[]>([]);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth - 24, 384);
      const desiredRight = Math.max(12, window.innerWidth - rect.right);
      const maxRight = Math.max(12, window.innerWidth - panelWidth - 12);
      setDropdownPos({
        top: rect.bottom + 8,
        right: Math.min(desiredRight, maxRight),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
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

  const fetchAdminNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.notifications)) {
        setItems(data.notifications);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchAdminNotifications]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.isRead).length;
  }, [items]);

  const markAsRead = async (item: AdminActionNotification) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true, actionRequired: false } : i)));
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: item.logId, convId: item.convId }),
      });
    } catch {}
  };

  const handleItemClick = async (item: AdminActionNotification) => {
    if (!item.isRead) {
      await markAsRead(item);
    }
    setIsOpen(false);
    router.push(item.linkUrl);
  };

  const handleDismiss = async (e: React.MouseEvent, item: AdminActionNotification) => {
    e.stopPropagation();
    await markAsRead(item);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true, actionRequired: false })));
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch {}
  };

  const getStyleForType = (type: AdminActionNotification['type']) => {
    switch (type) {
      case 'new_booking':
        return {
          icon: <CalendarCheck className="h-3.5 w-3.5" />,
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-400',
          badgeLabel: 'Booking',
          cta: 'Open Booking',
        };
      case 'new_lead':
        return {
          icon: <Sparkles className="h-3.5 w-3.5" />,
          iconBg: 'bg-amber-500/20 text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300',
          badgeLabel: 'Interest',
          cta: 'Review Request',
        };
      default:
        return {
          icon: <MessageSquare className="h-3.5 w-3.5" />,
          iconBg: 'bg-[#00E5FF]/20 text-[#00E5FF]',
          badgeBg: 'bg-[#00E5FF]/20 text-[#00E5FF]',
          badgeLabel: 'Message',
          cta: 'Open Chat',
        };
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Admin Action Queue"
        data-testid="admin-notification-bell"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 active:scale-95"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            data-testid="admin-notification-unread-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-[#070F1E] shadow-md shadow-emerald-500/30 animate-pulse"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && mounted && dropdownPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          data-testid="admin-notification-panel"
          style={{ top: `${dropdownPos.top}px`, right: `${dropdownPos.right}px` }}
          className="fixed z-[9999] w-[min(calc(100vw-24px),24rem)] rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/90 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#00E5FF]" />
              <h3 className="text-sm font-black text-white">Action Inbox</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white">All Clear!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No bookings, interests, or customer messages yet.</p>
              </div>
            ) : (
              items.map((item) => {
                const style = getStyleForType(item.type);
                return (
                  <div
                    key={item.id}
                    data-testid={`admin-notif-${item.type}`}
                    onClick={() => void handleItemClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/[0.05] ${
                      !item.isRead ? 'bg-white/[0.03]' : 'opacity-70'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${style.iconBg}`}>
                        {style.icon}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {!item.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                          <span className="truncate">{item.customerName}</span>
                          {item.reference && (
                            <span className="font-mono text-[10px] text-[#00E5FF] shrink-0">#{item.reference}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badgeBg}`}>
                            {style.badgeLabel}
                          </span>
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(e) => void handleDismiss(e, item)}
                              title="Mark as read"
                              className="rounded p-1 text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.tourTitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          {item.tourTitle}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        {item.detail}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[#00E5FF] font-bold inline-flex items-center gap-0.5 hover:underline">
                          {style.cta} <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-2.5 flex items-center justify-around bg-white/[0.01]">
            <Link
              href="/admin/bookings"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00E5FF] hover:underline"
            >
              <span>All Bookings</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href="/admin/bookings?filter=messages"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
            >
              <span>Unread Messages</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
