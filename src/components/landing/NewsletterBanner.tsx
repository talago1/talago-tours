'use client';

import { useState, useCallback } from 'react';
import { Send, Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function NewsletterBanner() {
  const { dict } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;

      setStatus('loading');
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        if (!res.ok) throw new Error();
        setStatus('success');
        setEmail('');
      } catch {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    },
    [email]
  );

  return (
    <section className="bg-[#070F1E] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#00473F]/40 via-[#070F1E] to-[#06B6D4]/10 p-8 shadow-2xl shadow-black/20 lg:p-14">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#00473F]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#06B6D4]/10 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00473F]/30 bg-[#00473F]/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#A7F3D0]">
                <Mail className="h-4 w-4" />
                Stay in the loop
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Never miss an adventure
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-400">
                Subscribe for exclusive offers, new experience launches, and travel inspiration from the Red Sea.
              </p>
            </div>

            <div>
              {status === 'success' ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#00473F]/30 bg-[#00473F]/20 p-5">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-[#A7F3D0]" />
                  <p className="text-sm font-bold text-[#A7F3D0]">
                    You&apos;re subscribed! Check your inbox for the welcome email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-4 text-base font-medium text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#06B6D4]/40 focus:bg-white/[0.06 focus:shadow-lg focus:shadow-[#06B6D4]/5"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00473F] to-[#005A50] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#00473F]/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#00473F]/40 disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </button>
                </form>
              )}

              {status === 'error' && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Something went wrong. Please try again.
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500">
                No spam — unsubscribe anytime. We respect your inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
