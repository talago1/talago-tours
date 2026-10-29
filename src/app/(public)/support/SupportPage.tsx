'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { MessageSquare, Mail, HelpCircle, Send, Loader2, CheckCircle2, Phone } from 'lucide-react';

interface SupportPageProps {
  contactSettings?: {
    whatsappNumber?: string;
    corporateEmail?: string;
    phoneNumber?: string;
    showContactChannels?: boolean;
    showWhatsApp?: boolean;
    showEmail?: boolean;
    showPhone?: boolean;
  };
}

export default function SupportPage({ contactSettings }: SupportPageProps) {
  const { dict } = useLanguage();
  const s = dict.support;
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showChannels = contactSettings?.showContactChannels !== false;
  const showWhatsApp = contactSettings?.showWhatsApp !== false && Boolean(contactSettings?.whatsappNumber);
  const showEmail = contactSettings?.showEmail !== false && Boolean(contactSettings?.corporateEmail);
  const showPhone = Boolean(contactSettings?.showPhone && contactSettings?.phoneNumber);
  const whatsappNum = contactSettings?.whatsappNumber || '+201222434602';
  const emailAddr = contactSettings?.corporateEmail || 'support@talago-tours.com';
  const phoneNum = contactSettings?.phoneNumber || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      setFormState({ name: '', email: '', message: '' });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#070F1E] px-6 py-24">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="mb-4 text-3xl font-black text-white">{s.formSuccess}</h1>
          <button
            onClick={() => setSent(false)}
            className="rounded-full bg-[#00E5FF] px-6 py-3 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02]"
          >
            Send Another Message
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,229,255,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-[#00E5FF]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            {s.badge}
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white lg:text-7xl">
            {s.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            {s.description}
          </p>
        </div>
      </section>

      <div className={`mx-auto px-6 py-20 ${showChannels ? 'max-w-6xl' : 'max-w-2xl'}`}>
        <div className={showChannels ? 'grid grid-cols-1 gap-12 lg:grid-cols-2' : ''}>
          {/* Contact Form */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                <Send className="h-5 w-5 text-[#00E5FF]" />
              </div>
              <h2 className="text-xl font-black text-white">{s.formTitle}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {s.formNameLabel}
                </span>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                  placeholder={s.formNamePlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {s.formEmailLabel}
                </span>
                <input
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                  placeholder={s.formEmailPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {s.formMessageLabel}
                </span>
                <textarea
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState((p) => ({ ...p, message: e.target.value }))}
                  placeholder={s.formMessagePlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                />
              </label>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#00E5FF] px-6 py-3.5 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02] disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? s.formSubmitting : s.formSubmit}
              </button>
            </form>
          </div>

          {/* Contact Channels (Admin Controlled) */}
          {showChannels && (
            <div className="space-y-6">
              {/* WhatsApp */}
              {showWhatsApp && (
                <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10">
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-black text-white">{s.whatsappTitle}</h2>
                  </div>
                  <p className="mb-5 text-sm leading-6 text-slate-400">{s.whatsappDescription}</p>
                  <a
                    href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-white transition-all hover:scale-[1.02]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {s.whatsappButton}
                  </a>
                </div>
              )}

              {/* Email */}
              {showEmail && (
                <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                      <Mail className="h-5 w-5 text-[#FFD700]" />
                    </div>
                    <h2 className="text-xl font-black text-white">{s.emailTitle}</h2>
                  </div>
                  <p className="mb-5 text-sm leading-6 text-slate-400">{s.emailDescription}</p>
                  <a
                    href={`mailto:${emailAddr}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-black text-slate-200 transition-all hover:border-[#FFD700]/40 hover:text-[#FFD700]"
                  >
                    <Mail className="h-4 w-4" />
                    {emailAddr}
                  </a>
                </div>
              )}

              {/* FAQ */}
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                    <HelpCircle className="h-5 w-5 text-violet-300" />
                  </div>
                  <h2 className="text-xl font-black text-white">{s.faqTitle}</h2>
                </div>
                <p className="mb-5 text-sm leading-6 text-slate-400">{s.faqDescription}</p>
                <a
                  href="/faq"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-black text-slate-200 transition-all hover:border-violet-400/40 hover:text-violet-300"
                >
                  <HelpCircle className="h-4 w-4" />
                  {dict.faq.title}
                </a>
              </div>

              {/* Direct Phone (Only if enabled and configured by admin) */}
              {showPhone && (
                <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                      <Phone className="h-5 w-5 text-[#00E5FF]" />
                    </div>
                    <h2 className="text-xl font-black text-white">Direct Phone</h2>
                  </div>
                  <a
                    href={`tel:${phoneNum.replace(/[^0-9+]/g, '')}`}
                    className="text-2xl font-black text-white transition-all hover:text-[#00E5FF]"
                  >
                    {phoneNum}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
