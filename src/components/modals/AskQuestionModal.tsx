'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, MessageSquare, Loader2, CheckCircle2, User, Mail, Phone, CalendarDays, ArrowRight } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

interface AskQuestionModalProps {
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export default function AskQuestionModal({
  tourId,
  tourSlug,
  tourTitle,
  isOpen,
  onClose,
  initialDate,
}: AskQuestionModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelDate, setTravelDate] = useState(initialDate || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiryRef, setInquiryRef] = useState<string | null>(null);

  // Pre-fill user profile if logged in
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.user.email) setEmail(session.user.email);
        const userName = session.user.user_metadata?.name || session.user.user_metadata?.full_name;
        if (userName) setName(userName);
      }
    });
  }, []);

  useEffect(() => {
    if (initialDate) setTravelDate(initialDate);
  }, [initialDate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || (!email.trim() && !phone.trim())) {
        setError('Please provide your question and at least an email or phone number.');
        return;
      }
      setSubmitting(true);
      setError(null);

      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        let sid = typeof window !== 'undefined' ? sessionStorage.getItem('talago_sid') : null;
        if (!sid && typeof window !== 'undefined') {
          sid = 'sid_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
          sessionStorage.setItem('talago_sid', sid);
        }

        const res = await fetch('/api/public/tour-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            tourId,
            tourSlug,
            customerName: name.trim() || undefined,
            customerEmail: email.trim() || undefined,
            customerPhone: phone.trim() || undefined,
            travelDate: travelDate || undefined,
            message: message.trim(),
            sessionId: sid || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry.');

        setInquiryRef(data.inquiryReference || 'INQ-SUCCESS');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [tourId, tourSlug, name, email, phone, travelDate, message]
  );

  const resetAndClose = () => {
    setInquiryRef(null);
    setMessage('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0B1528] shadow-2xl shadow-black/80 backdrop-blur-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle cyan glow accent */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00E5FF]/10 via-transparent to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-6 sm:p-8">
          {inquiryRef ? (
            /* Success confirmation */
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">Question Received</p>
              <h3 className="mt-2 text-2xl font-black text-white">We&apos;re On It!</h3>
              <div className="mt-3 inline-block rounded-xl border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                Reference: {inquiryRef}
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-300 max-w-sm mx-auto">
                Your question regarding <span className="font-semibold text-white">&ldquo;{tourTitle}&rdquo;</span> has been sent to our local experts. We typically reply within 15–30 minutes.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form view */
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Ask a Question</h3>
                  <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">{tourTitle}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs font-medium text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Question <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Can we customize the pickup time? Is this suitable for young children? What should we bring?"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]/50 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Your Name
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 focus-within:border-[#00E5FF]/50">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Intended Travel Date
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 focus-within:border-[#00E5FF]/50">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 focus-within:border-[#00E5FF]/50">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Phone / WhatsApp
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 focus-within:border-[#00E5FF]/50">
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 123 4567"
                        className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal pt-1">
                  Submitting a question does not book a ticket or charge anything. Our local team will reply directly to your contact details.
                </p>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Question</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
