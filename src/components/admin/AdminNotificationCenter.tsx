'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  Clock,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  User,
  X,
  Check,
} from 'lucide-react';

export interface AdminActionNotification {
  id: string;
  convId?: string;
  type: 'unread_message' | 'cancellation_request' | 'new_lead' | 'new_booking';
  title: string;
  customerName: string;
  tourTitle?: string;
  detail: string;
  timestamp: string;
  actionRequired: boolean;
  linkUrl: string;
  reference?: string;
}

export default function AdminNotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AdminActionNotification[]>([]);
  const [loading, setLoading] = useState(false);
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

  const fetchAdminNotifications = useCallback(async () => {
    try {
      // 1. Fetch conversations with unread visitor messages
      const chatRes = await fetch('/api/admin/live-chat');
      const chatData = chatRes.ok ? await chatRes.json() : null;
      const conversations = Array.isArray(chatData?.conversations) ? chatData.conversations : [];

      const notifs: AdminActionNotification[] = [];

      for (const conv of conversations) {
        const unreadCount = conv._count?.messages || 0;
        if (unreadCount > 0 && conv.messages && conv.messages[0]) {
          const lastMsg = conv.messages[0];
          const targetRef = conv.bookingReference || (conv.leadId ? `lead:${conv.leadId}` : `conv:${conv.id}`);
          notifs.push({
            id: `chat-${conv.id}`,
            convId: conv.id,
            type: 'unread_message',
            title: 'New Customer Message',
            customerName: conv.visitorName || conv.visitorEmail || 'Customer',
            tourTitle: conv.tourTitle || undefined,
            detail: lastMsg.body || 'New message waiting for response',
            timestamp: lastMsg.createdAt || conv.lastMessageAt,
            actionRequired: true,
            linkUrl: `/admin/bookings?filter=messages&ref=${encodeURIComponent(targetRef)}`,
            reference: conv.bookingReference || undefined,
          });
        }
      }

      // Sort newest first
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(notifs);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 25000);
    return () => clearInterval(interval);
  }, [fetchAdminNotifications]);

  const totalActionCount = useMemo(() => {
    return items.filter((item) => item.actionRequired).length;
  }, [items]);

  const handleItemClick = (linkUrl: string) => {
    setIsOpen(false);
    router.push(linkUrl);
  };

  const handleDismiss = async (e: React.MouseEvent, item: AdminActionNotification) => {
    e.stopPropagation();
    try {
      if (item.convId) {
        await fetch(`/api/admin/live-chat?conversationId=${encodeURIComponent(item.convId)}`);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Admin Action Queue"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 active:scale-95"
      >
        <Bell className="h-4 w-4" />
        {totalActionCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-[#070F1E] shadow-md shadow-emerald-500/30 animate-pulse">
            {totalActionCount > 9 ? '9+' : totalActionCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#00E5FF]" />
              <h3 className="text-sm font-black text-white">Action Inbox</h3>
              {totalActionCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  {totalActionCount} pending
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white">All Clear!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending customer messages or action items.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.linkUrl)}
                  className="p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/[0.04]"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{item.customerName}</span>
                        {item.reference && (
                          <span className="font-mono text-[10px] text-[#00E5FF]">#{item.reference}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                          Reply
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, item)}
                          title="Mark as read / Dismiss"
                          className="rounded p-1 text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {item.tourTitle && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                        {item.tourTitle}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5">
                      &ldquo;{item.detail}&rdquo;
                    </p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#00E5FF] font-bold inline-flex items-center gap-0.5 hover:underline">
                        Open Chat <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-2.5 text-center bg-white/[0.01]">
            <Link
              href="/admin/bookings?filter=messages"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#00E5FF] hover:underline"
            >
              <span>Go to Live Chat & Bookings Queue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
