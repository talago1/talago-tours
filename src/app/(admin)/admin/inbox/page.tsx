'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Archive, CheckSquare, MessageCircle, RotateCcw, Send, Square, Trash2,
  Search, X, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

type Conversation = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone?: string | null;
  lastPagePath: string | null;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string;
  messages: { body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string }[];
  _count: { messages: number };
};

type Message = { id: string; body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string };
type View = 'OPEN' | 'CLOSED' | 'ALL';

export default function InboxPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [view, setView] = useState<View>('OPEN');
  const [search, setSearch] = useState(initialSearch);
  const [busy, setBusy] = useState(false);

  const selectedConversation = conversations.find((item) => item.id === selectedId);
  const allSelected = conversations.length > 0 && conversations.every((item) => selectedIds.has(item.id));
  const unreadCount = useMemo(
    () => conversations.reduce((total, item) => total + item._count.messages, 0),
    [conversations]
  );

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: view });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/admin/live-chat?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const next = payload.conversations || [];
      setConversations(next);
      setSelectedId((current) => (next.some((item: Conversation) => item.id === current) ? current : next[0]?.id || null));
    } catch (err) {
      console.error('[Inbox] load error:', err);
    }
  }, [search, view]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/admin/live-chat/${selectedId}`, { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setMessages(payload.conversation.messages || []);
      void loadConversations();
    } catch (err) {
      console.error('[Inbox] load messages error:', err);
    }
  }, [loadConversations, selectedId]);

  useEffect(() => {
    void loadConversations();
    const timer = window.setInterval(() => void loadConversations(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 8_000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  const toggleOne = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(conversations.map((item) => item.id)));

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !text.trim()) return;
    try {
      const response = await fetch(`/api/admin/live-chat/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const payload = await response.json();
      if (response.ok) {
        setMessages((current) => [...current, payload.message]);
        setText('');
        void loadConversations();
      }
    } catch (err) {
      console.error('[Inbox] send error:', err);
    }
  };

  const setStatus = async (ids: string[], targetStatus: 'OPEN' | 'CLOSED') => {
    if (!ids.length) return;
    setBusy(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/live-chat/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus }),
          })
        )
      );
      setSelectedIds(new Set());
      await loadConversations();
    } finally {
      setBusy(false);
    }
  };

  const deleteMany = async (ids: string[]) => {
    if (!ids.length || !window.confirm(`Permanently delete ${ids.length} conversation(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const response = await fetch('/api/admin/live-chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error();
      setSelectedIds(new Set());
      if (selectedId && ids.includes(selectedId)) setSelectedId(null);
      await loadConversations();
    } finally {
      setBusy(false);
    }
  };

  // Extract reservation reference RES-... from messages if present
  const reservationRefMatch = useMemo(() => {
    if (!messages.length) return null;
    for (const m of messages) {
      const match = m.body.match(/\[(RES-[A-Z0-9]+)\]/);
      if (match) return match[1];
    }
    return null;
  }, [messages]);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[22rem_1fr] lg:p-8">
      {/* Sidebar: Conversations List */}
      <aside className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1528] flex flex-col shadow-xl">
        <div className="border-b border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-black text-white text-base">Live Inbox</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-black text-slate-950">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Booking interest and visitor inquiries arrive here live.
          </p>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visitor, email, RES-..."
              className="w-full rounded-xl border border-white/10 bg-[#060D1A] py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1">
            {(['OPEN', 'CLOSED', 'ALL'] as View[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setView(item);
                  setSelectedIds(new Set());
                }}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  view === item ? 'bg-cyan-300 text-slate-950 font-black' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10'
                }`}
              >
                {item === 'OPEN' ? 'Active' : item === 'CLOSED' ? 'Archived' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Actions Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 bg-white/[0.02]">
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            {allSelected ? <CheckSquare className="h-4 w-4 text-cyan-300" /> : <Square className="h-4 w-4" />}
            {allSelected ? 'Clear selection' : 'Select all'}
          </button>
          {selectedIds.size > 0 && <span className="text-xs text-cyan-200 font-bold">{selectedIds.size} selected</span>}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3 bg-white/[0.02]">
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus([...selectedIds], 'CLOSED')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              <Archive className="h-3.5 w-3.5" /> Archive
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void setStatus([...selectedIds], 'OPEN')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reopen
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void deleteMany([...selectedIds])}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] max-h-[calc(100vh-18rem)]">
          {conversations.map((item) => (
            <div
              key={item.id}
              className={`flex items-center ${selectedId === item.id ? 'bg-cyan-400/10 border-l-2 border-cyan-400' : 'hover:bg-white/[0.03]'}`}
            >
              <button
                type="button"
                aria-label="Select conversation"
                onClick={() => toggleOne(item.id)}
                className="px-3 text-slate-400 hover:text-white"
              >
                {selectedIds.has(item.id) ? <CheckSquare className="h-4 w-4 text-cyan-300" /> : <Square className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="min-w-0 flex-1 p-3.5 text-left"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="truncate text-xs font-bold text-white">
                    {item.visitorName || item.visitorEmail || 'Website visitor'}
                  </span>
                  {item._count.messages > 0 && (
                    <span className="rounded bg-cyan-300 px-1.5 py-0.2 text-[9px] font-black text-slate-950">
                      {item._count.messages}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {item.messages[0]?.body || item.lastPagePath || 'Started inquiry'}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-600 font-mono">
                  {new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="p-8 text-center text-xs text-slate-500">
              {search ? 'No conversations match your search.' : 'No conversations in this view.'}
            </p>
          )}
        </div>
      </aside>

      {/* Main Chat Thread */}
      <section className="flex min-w-0 min-h-[36rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1528] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5 bg-white/[0.02]">
          <div className="flex min-w-0 items-center gap-2.5 text-white">
            <MessageCircle className="h-5 w-5 shrink-0 text-cyan-300" />
            <div className="min-w-0">
              <span className="truncate text-sm font-bold block">
                {selectedConversation?.visitorName || selectedConversation?.visitorEmail || 'Marketplace customer conversation'}
              </span>
              {selectedConversation?.visitorPhone && (
                <span className="text-[11px] text-slate-400 block">{selectedConversation.visitorPhone}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reservationRefMatch && (
              <Link
                href={`/admin/leads?search=${encodeURIComponent(reservationRefMatch)}`}
                className="flex items-center gap-1 rounded-lg bg-cyan-400/10 border border-cyan-400/30 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20"
                title="View linked lead details"
              >
                <span>Lead: {reservationRefMatch}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}

            {selectedId && (
              <>
                <button
                  type="button"
                  onClick={() => void setStatus([selectedId], selectedConversation?.status === 'CLOSED' ? 'OPEN' : 'CLOSED')}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white"
                  title={selectedConversation?.status === 'CLOSED' ? 'Reopen conversation' : 'Archive conversation'}
                >
                  {selectedConversation?.status === 'CLOSED' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteMany([selectedId])}
                  className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20"
                  title="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((message) => {
            const isAdmin = message.sender === 'ADMIN';
            return (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAdmin
                    ? 'ml-auto bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-white/[0.07] text-white rounded-tl-none border border-white/10'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1 text-[9px] font-mono text-right ${isAdmin ? 'text-slate-900/70' : 'text-slate-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            );
          })}
          {!selectedId && <p className="py-24 text-center text-xs text-slate-500">Select a conversation from the left to read and reply.</p>}
        </div>

        {/* Reply Input Form */}
        <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3 bg-white/[0.01]">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={1200}
            placeholder="Type your response to the customer..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#060D1A] px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-300"
          />
          <button
            type="submit"
            disabled={!selectedId || !text.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40 hover:brightness-110 shadow-md shadow-cyan-300/10 transition"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </form>
      </section>
    </main>
  );
}
