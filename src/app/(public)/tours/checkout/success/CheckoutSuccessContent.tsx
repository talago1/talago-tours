'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { supabaseClient } from '@/lib/supabase/client';
import { UserPlus, Mail, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

export default function CheckoutSuccessContent({ token }: { token: string }) {
  const { dict } = useLanguage();
  const [bookingReference, setBookingReference] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Guest onboarding state
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [onboardStatus, setOnboardStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [onboardError, setOnboardError] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated) {
          setIsAuthenticated(true);
        } else {
          supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session?.access_token) setIsAuthenticated(true);
          }).catch(() => {});
        }
      })
      .catch(() => {
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
          if (session?.access_token) setIsAuthenticated(true);
        }).catch(() => {});
      });
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/public/bookings?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.bookingReference) setBookingReference(d.bookingReference); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const handleGuestSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardEmail || !onboardPassword) return;
    setOnboardStatus('loading');
    setOnboardError('');
    try {
      const { error } = await supabaseClient.auth.signUp({
        email: onboardEmail,
        password: onboardPassword,
        options: { emailRedirectTo: `${window.location.origin}/account?tab=bookings` },
      });
      if (error) {
        setOnboardError(error.message);
        setOnboardStatus('error');
      } else {
        setOnboardStatus('success');
        setIsAuthenticated(true);
      }
    } catch {
      setOnboardError('Something went wrong. Please try again.');
      setOnboardStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-[#070F1E] flex items-center justify-center px-4 py-12">
      <article className="max-w-lg w-full rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{dict.checkoutSuccessPage.title}</h1>

        <p className="text-slate-400 mb-6">
          {dict.checkoutSuccessPage.bookingRefLabel}
        </p>

        {bookingReference && (
          <div className="inline-block bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-xl px-6 py-3 mb-6">
            <span className="text-xl font-bold text-[#00E5FF] tracking-wider">
              {bookingReference}
            </span>
          </div>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 mb-6 text-sm text-amber-300">
          <p>
            {dict.checkoutSuccessPage.whatsappMsg}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/"
            className="w-full sm:w-auto inline-block px-8 py-3 bg-[#00E5FF] text-[#070F1E] font-semibold rounded-lg hover:bg-[#00D4F0] transition-colors duration-200"
          >
            {dict.checkoutSuccessPage.backToHome}
          </a>
          <a
            href={isAuthenticated ? '/account?tab=bookings' : '/my-bookings'}
            className="w-full sm:w-auto inline-block px-8 py-3 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Go to My Bookings
          </a>
        </div>

        {/* Guest Onboarding — save trip to account */}
        {!isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-white/5">
            {onboardStatus === 'success' ? (
              <div className="flex flex-col items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
                <p className="font-semibold">Account created! Check your email to confirm.</p>
                <p className="text-xs text-slate-400">Your booking is now saved to your account.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#00E5FF]/15 bg-[#00E5FF]/5 p-5 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <p className="text-sm font-bold text-white">Save this trip to your account</p>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Create a free account to access boarding pass, receive trip reminders, and manage future bookings in one place.
                </p>
                <form onSubmit={handleGuestSignup} className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Your email"
                      value={onboardEmail}
                      onChange={(e) => setOnboardEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30"
                    />
                  </div>
                  <input
                    type="password"
                    placeholder="Choose a password (min 8 chars)"
                    value={onboardPassword}
                    onChange={(e) => setOnboardPassword(e.target.value)}
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30"
                  />
                  {onboardError && (
                    <p className="text-xs text-rose-400">{onboardError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={onboardStatus === 'loading'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  >
                    {onboardStatus === 'loading' ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Creating account...</span></>
                    ) : (
                      <><span>Create Account & Save Trip</span><ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </form>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Already have an account?{' '}
                  <a href="/login?returnTo=/account" className="text-[#00E5FF] hover:underline">Sign in</a>
                </p>
              </div>
            )}
          </div>
        )}

        {token && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <a
              href={`/tours/voucher/${token}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {dict.checkoutSuccessPage.viewVoucher}
            </a>
          </div>
        )}
      </article>
    </main>
  );
}
