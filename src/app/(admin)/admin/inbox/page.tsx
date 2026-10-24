'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

type Conversation = { id: string; visitorName: string | null; visitorEmail: string | null; lastPagePath: string | null; status: 'OPEN' | 'CLOSED'; lastMessageAt: string; messages: { body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string }[]; _count: { messages: number } };
type Message = { id: string; body: string; sender: 'VISITOR' | 'ADMIN'; createdAt: string };

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const loadConversations = useCallback(async () => {
    const response = await fetch('/api/admin/live-chat', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    setConversations(payload.conversations || []);
    setSelectedId((current) => current || payload.conversations?.[0]?.id || null);
  }, []);
  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/live-chat/${selectedId}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    setMessages(payload.conversation.messages || []);
  }, [selectedId]);

  useEffect(() => { void loadConversations(); const timer = window.setInterval(() => void loadConversations(), 10_000); return () => window.clearInterval(timer); }, [loadConversations]);
  useEffect(() => { void loadMessages(); const timer = window.setInterval(() => void loadMessages(), 8_000); return () => window.clearInterval(timer); }, [loadMessages]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !text.trim()) return;
    const response = await fetch(`/api/admin/live-chat/${selectedId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const payload = await response.json();
    if (response.ok) { setMessages((current) => [...current, payload.message]); setText(''); void loadConversations(); }
  };

  return <main className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[22rem_1fr] lg:p-8">
    <aside className="overflow-hidden rounded-lg border border-white/10 bg-[#0B1528]">
      <div className="border-b border-white/10 px-4 py-4"><h1 className="font-black text-white">Live Inbox</h1><p className="mt-1 text-xs text-slate-400">Replies appear for the visitor on the site.</p></div>
      <div className="max-h-[70vh] overflow-y-auto">{conversations.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full border-b border-white/[0.06] p-4 text-left ${selectedId === item.id ? 'bg-cyan-300/10' : 'hover:bg-white/[0.03]'}`}><div className="flex justify-between gap-2"><span className="truncate text-sm font-bold text-white">{item.visitorName || item.visitorEmail || 'Website visitor'}</span>{item._count.messages > 0 && <span className="rounded bg-cyan-300 px-1.5 text-[10px] font-bold text-slate-950">{item._count.messages}</span>}</div><p className="mt-1 truncate text-xs text-slate-400">{item.messages[0]?.body || item.lastPagePath || 'Opened chat'}</p></button>)}{conversations.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No live conversations yet.</p>}</div>
    </aside>
    <section className="flex min-w-0 min-h-[36rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0B1528]">
      <div className="border-b border-white/10 px-5 py-4"><div className="flex items-center gap-2 text-white"><MessageCircle className="h-5 w-5 text-cyan-300" />Marketplace customer conversation</div></div>
      <div className="flex-1 space-y-3 overflow-y-auto p-5">{messages.map((message) => <div key={message.id} className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${message.sender === 'ADMIN' ? 'ml-auto bg-cyan-300 text-slate-950' : 'bg-white/[0.07] text-white'}`}>{message.body}</div>)}</div>
      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-4"><input value={text} onChange={(event) => setText(event.target.value)} maxLength={1200} placeholder="Reply to the visitor" className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#070F1E] px-3 py-2.5 text-sm text-white outline-none" /><button type="submit" disabled={!selectedId || !text.trim()} className="rounded-md bg-cyan-300 p-2.5 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button></form>
    </section>
  </main>;
}
