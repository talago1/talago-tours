'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Loader2, User, Mail, Phone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const STORAGE_KEY = 'talago-lead-captured';

export default function LeadCaptureModal() {
  const { dict } = useLanguage();
  const lc = dict.leadCapture;
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const alreadyCaptured = localStorage.getItem(STORAGE_KEY);
    if (!alreadyCaptured) {
      const timer = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'skipped');
    setVisible(false);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!res.ok) throw new Error('Failed to register');
      localStorage.setItem(STORAGE_KEY, 'captured');
      setSubmitted(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [name, email, phone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#0B1528]/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Glass gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00E5FF]/5 via-transparent to-[#FFD700]/5" />

        <div className="relative p-8">
          {/* Close */}
          <button
            type="button"
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-full border border-white/10 p-1.5 text-slate-500 transition-all hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#FFD700]/20">
            <Sparkles className="h-8 w-8 text-[#FFD700]" />
          </div>

          {submitted ? (
            <div className="text-center">
              <p className="text-lg font-black text-white">Welcome to the Inner Circle!</p>
              <p className="mt-2 text-sm text-emerald-400">You now have priority access.</p>
            </div>
          ) : (
            <>
              <h2 className="text-center text-2xl font-black text-white">{lc.title}</h2>
              <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-400">
                {lc.subtitle}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <User className="h-3 w-3" /> {lc.nameLabel}
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lc.namePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Mail className="h-3 w-3" /> {lc.emailLabel}
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={lc.emailPlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Phone className="h-3 w-3" /> {lc.phoneLabel}
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lc.phonePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </label>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#06B6D4] px-6 py-3.5 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {lc.submittingButton}
                    </span>
                  ) : (
                    lc.submitButton
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={handleSkip}
                className="mt-4 w-full text-center text-xs font-bold text-slate-500 transition-all hover:text-slate-300"
              >
                {lc.skipButton}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
