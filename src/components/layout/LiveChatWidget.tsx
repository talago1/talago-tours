'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = { id: string; sender: 'VISITOR' | 'ADMIN'; body: string; createdAt: string };

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '' });
  const [contactSaved, setContactSaved] = useState(false);

  const startSession = useCallback(async (details = {}) => {
    const response = await fetch('/api/public/live-chat/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, pagePath: window.location.pathname }),
    });
    if (response.ok) setReady(true);
  }, []);

  const loadMessages = useCallback(async () => {
    const response = await fetch('/api/public/live-chat/messages', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    setMessages(payload.messages || []);
  }, []);

  useEffect(() => { void startSession(); }, [startSession]);
  useEffect(() => {
    if (!ready) return;
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 10_000);
    return () => window.clearInterval(timer);
  }, [ready, loadMessages]);

  const saveContact = async (event: FormEvent) => {
    event.preventDefault();
    await startSession(contact);
    setContactSaved(true);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const response = await fetch('/api/public/live-chat/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      const payload = await response.json();
      if (response.ok) {
        setMessages((current) => [...current, payload.message]);
        setText('');
      }
    } finally { setSending(false); }
  };

  return (
    <div className="fixed bottom-[calc(11rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex flex-col items-end lg:bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:right-[calc(1.5rem+env(safe-area-inset-right))]">
      {open && (
        <section className="mb-3 flex h-[min(32rem,calc(100vh-14rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-white/15 bg-[#0B1528] shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div><p className="text-sm font-bold text-white">Talago Marketplace Support</p><p className="text-xs text-emerald-300">We reply here while you browse</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && <p className="rounded-lg bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">Need help choosing an experience, comparing options, or managing a booking? Send our marketplace team a message.</p>}
            {messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-lg px-3 py-2 text-sm leading-5 ${message.sender === 'ADMIN' ? 'bg-cyan-300 text-slate-950' : 'ml-auto bg-white/[0.08] text-white'}`}>{message.body}</div>)}
          </div>
          {!contactSaved && messages.length === 0 ? (
            <form onSubmit={saveContact} className="space-y-2 border-t border-white/10 p-3">
              <input value={contact.name} onChange={(e) => setContact((current) => ({ ...current, name: e.target.value }))} placeholder="Your name (optional)" className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <input value={contact.email} onChange={(e) => setContact((current) => ({ ...current, email: e.target.value }))} placeholder="Email for follow-up (optional)" type="email" className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <button type="submit" className="w-full rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950">Start chat</button>
            </form>
          ) : (
            <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1200} placeholder="Write a message" className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none" />
              <button type="submit" disabled={!text.trim() || sending} aria-label="Send message" className="rounded-md bg-cyan-300 p-2 text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" /></button>
            </form>
          )}
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25" aria-label="Open live chat">
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
