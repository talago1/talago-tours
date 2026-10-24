'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, CheckSquare, MessageCircle, RotateCcw, Send, Square, Trash2 } from 'lucide-react';

type Conversation = { id: string; visitorName: string | null; visitorEmail: string | null; visitorPhone?: string | null; lastPagePath: string | null; status: 'OPEN' | 'CLOSED'; lastMessageAt: string; messages: { body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string }[]; _count: { messages: number } };
type Message = { id: string; body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string };
type View = 'OPEN' | 'CLOSED' | 'ALL';

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [view, setView] = useState<View>('OPEN');
  const [busy, setBusy] = useState(false);

  const selectedConversation = conversations.find((item) => item.id === selectedId);
  const allSelected = conversations.length > 0 && conversations.every((item) => selectedIds.has(item.id));
  const unreadCount = useMemo(() => conversations.reduce((total, item) => total + item._count.messages, 0), [conversations]);
  const loadConversations = useCallback(async () => {
    const response = await fetch(`/api/admin/live-chat?status=${view}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json(); const next = payload.conversations || [];
    setConversations(next); setSelectedId((current) => next.some((item: Conversation) => item.id === current) ? current : next[0]?.id || null);
  }, [view]);
  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/live-chat/${selectedId}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json(); setMessages(payload.conversation.messages || []); void loadConversations();
  }, [loadConversations, selectedId]);

  useEffect(() => { void loadConversations(); const timer = window.setInterval(() => void loadConversations(), 10_000); return () => window.clearInterval(timer); }, [loadConversations]);
  useEffect(() => { void loadMessages(); const timer = window.setInterval(() => void loadMessages(), 8_000); return () => window.clearInterval(timer); }, [loadMessages]);
  const toggleOne = (id: string) => setSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(conversations.map((item) => item.id)));
  const send = async (event: FormEvent) => { event.preventDefault(); if (!selectedId || !text.trim()) return; const response = await fetch(`/api/admin/live-chat/${selectedId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }); const payload = await response.json(); if (response.ok) { setMessages((current) => [...current, payload.message]); setText(''); void loadConversations(); } };
  const setStatus = async (ids: string[], status: 'OPEN' | 'CLOSED') => { if (!ids.length) return; setBusy(true); try { await Promise.all(ids.map((id) => fetch(`/api/admin/live-chat/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }))); setSelectedIds(new Set()); await loadConversations(); } finally { setBusy(false); } };
  const deleteMany = async (ids: string[]) => { if (!ids.length || !window.confirm(`Permanently delete ${ids.length} conversation(s)? This cannot be undone.`)) return; setBusy(true); try { const response = await fetch('/api/admin/live-chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }); if (!response.ok) throw new Error(); setSelectedIds(new Set()); if (selectedId && ids.includes(selectedId)) setSelectedId(null); await loadConversations(); } finally { setBusy(false); } };

  return <main className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[22rem_1fr] lg:p-8">
    <aside className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#0B1528]"><div className="border-b border-white/10 px-4 py-4"><div className="flex items-center justify-between gap-2"><h1 className="font-black text-white">Live Inbox</h1>{unreadCount > 0 && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-xs font-black text-slate-950">{unreadCount} new</span>}</div><p className="mt-1 text-xs text-slate-400">Booking interest and visitor messages arrive here.</p><div className="mt-3 grid grid-cols-3 gap-1">{(['OPEN', 'CLOSED', 'ALL'] as View[]).map((item) => <button key={item} type="button" onClick={() => { setView(item); setSelectedIds(new Set()); }} className={`rounded px-2 py-1.5 text-xs font-bold ${view === item ? 'bg-cyan-300 text-slate-950' : 'bg-white/[0.05] text-slate-300'}`}>{item === 'OPEN' ? 'Active' : item === 'CLOSED' ? 'Archived' : 'All'}</button>)}</div></div>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2"><button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300">{allSelected ? <CheckSquare className="h-4 w-4 text-cyan-300" /> : <Square className="h-4 w-4" />}{allSelected ? 'Clear selection' : 'Select all'}</button>{selectedIds.size > 0 && <span className="text-xs text-cyan-200">{selectedIds.size} selected</span>}</div>
      {selectedIds.size > 0 && <div className="flex flex-wrap gap-2 border-b border-white/10 p-3"><button type="button" disabled={busy} onClick={() => void setStatus([...selectedIds], 'CLOSED')} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-xs text-slate-200"><Archive className="h-3.5 w-3.5" />Archive</button><button type="button" disabled={busy} onClick={() => void setStatus([...selectedIds], 'OPEN')} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-xs text-slate-200"><RotateCcw className="h-3.5 w-3.5" />Reopen</button><button type="button" disabled={busy} onClick={() => void deleteMany([...selectedIds])} className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 px-2 py-1.5 text-xs text-rose-200"><Trash2 className="h-3.5 w-3.5" />Delete</button></div>}
      <div className="max-h-[60vh] overflow-y-auto">{conversations.map((item) => <div key={item.id} className={`flex border-b border-white/[0.06] ${selectedId === item.id ? 'bg-cyan-300/10' : 'hover:bg-white/[0.03]'}`}><button type="button" aria-label="Select conversation" onClick={() => toggleOne(item.id)} className="px-3 text-slate-400">{selectedIds.has(item.id) ? <CheckSquare className="h-4 w-4 text-cyan-300" /> : <Square className="h-4 w-4" />}</button><button type="button" onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 p-4 text-left"><div className="flex justify-between gap-2"><span className="truncate text-sm font-bold text-white">{item.visitorName || item.visitorEmail || 'Website visitor'}</span>{item._count.messages > 0 && <span className="rounded bg-cyan-300 px-1.5 text-[10px] font-bold text-slate-950">{item._count.messages}</span>}</div><p className="mt-1 truncate text-xs text-slate-400">{item.messages[0]?.body || item.lastPagePath || 'Opened chat'}</p></button></div>)}{conversations.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No conversations in this view.</p>}</div>
    </aside>
    <section className="flex min-w-0 min-h-[36rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0B1528]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4"><div className="flex min-w-0 items-center gap-2 text-white"><MessageCircle className="h-5 w-5 shrink-0 text-cyan-300" /><span className="truncate">{selectedConversation?.visitorName || selectedConversation?.visitorEmail || 'Marketplace customer conversation'}</span></div>{selectedId && <div className="flex gap-2"><button type="button" onClick={() => void setStatus([selectedId], selectedConversation?.status === 'CLOSED' ? 'OPEN' : 'CLOSED')} className="rounded-md border border-white/10 p-2 text-slate-300" title={selectedConversation?.status === 'CLOSED' ? 'Reopen' : 'Archive'}>{selectedConversation?.status === 'CLOSED' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</button><button type="button" onClick={() => void deleteMany([selectedId])} className="rounded-md border border-rose-400/30 p-2 text-rose-200" title="Delete conversation"><Trash2 className="h-4 w-4" /></button></div>}</div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map((message) => <div key={message.id} className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${message.sender === 'ADMIN' ? 'ml-auto bg-cyan-300 text-slate-950' : 'bg-white/[0.07] text-white'}`}>{message.body}</div>)}{!selectedId && <p className="py-16 text-center text-sm text-slate-500">Select a conversation to reply.</p>}</div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-4"><input value={text} onChange={(event) => setText(event.target.value)} maxLength={1200} placeholder="Reply to the visitor" className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#070F1E] px-3 py-2.5 text-sm text-white outline-none" /><button type="submit" disabled={!selectedId || !text.trim()} className="rounded-md bg-cyan-300 p-2.5 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button></form>
    </section>
  </main>;
}
