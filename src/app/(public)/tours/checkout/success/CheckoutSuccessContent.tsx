'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { supabaseClient } from '@/lib/supabase/client';
import { UserPlus, Mail, Loader2, CheckCircle2, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function CheckoutSuccessContent({ token }: { token: string }) {
  const { dict } = useLanguage();
  const [bookingReference, setBookingReference] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Guest onboarding state
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardPassword, setOnboardPassword] = useState('');
  const [onboardStatus, setOnboardStatus] = useState<'idle' | 'loading' | 'linked' | 'verification_sent' | 'error'>('idle');
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
      .then((d) => {
        if (!cancelled && d?.bookingReference) {
          setBookingReference(d.bookingReference);
          if (d.customerEmail) setOnboardEmail((prev) => prev || d.customerEmail);
          if (d.customerPhone) setBookingPhone(d.customerPhone);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  const handleGuestSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardEmail || !onboardPassword) return;
    setOnboardStatus('loading');
    setOnboardError('');

    try {
      // 1. Sign up user with Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: onboardEmail,
        password: onboardPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account?tab=bookings')}`,
          data: {
            phone: bookingPhone || undefined,
          },
        },
      });

      if (error) {
        setOnboardError(error.message);
        setOnboardStatus('error');
        return;
      }

      // Case A: Supabase returned an active session (immediate login without email verification required)
      if (data?.session?.access_token) {
        // Sync authoritative session cookies
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        }).catch(() => {});

        // Explicitly link this booking using its reference and phone
        if (bookingReference && bookingPhone) {
          await fetch('/api/public/my-bookings/link', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({
              bookingReference,
              phone: bookingPhone,
            }),
          }).catch(() => {});
        }

        setIsAuthenticated(true);
        setOnboardStatus('linked');
        setTimeout(() => {
          window.location.href = '/account?tab=bookings';
        }, 1500);
        return;
      }

      // Case B: Email verification required before login
      // Do NOT claim the booking is linked yet; clearly inform the user that email confirmation is required.
      if (data?.user) {
        setOnboardStatus('verification_sent');
        return;
      }

      setOnboardError('Unable to complete registration. Please try again.');
      setOnboardStatus('error');
    } catch {
      setOnboardError('Something went wrong. Please check your connection and try again.');
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

        {/* Guest Onboarding — convert guest to permanent account with genuine linking */}
        {!isAuthenticated && (
          <div className="mt-6 pt-6 border-t border-white/5">
            {onboardStatus === 'linked' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-300">Account Created & Booking Linked!</p>
                <p className="text-xs text-slate-400 mt-1">Redirecting to your account dashboard...</p>
              </div>
            ) : onboardStatus === 'verification_sent' ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-400 shrink-0" />
                  <p className="text-sm font-bold text-white">Verification Link Sent</p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We sent a confirmation email to <span className="font-semibold text-amber-300">{onboardEmail}</span>.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Please click the link in your email to verify your account. Once verified, this booking ({bookingReference || 'your reservation'}) will be automatically accessible under your account.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#00E5FF]/15 bg-[#00E5FF]/5 p-5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-[#00E5FF] shrink-0" />
                  <p className="text-sm font-bold text-white">Save this trip to your account</p>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Create a password to access your digital voucher, receive pickup notifications, and manage all your bookings.
                </p>
                <form onSubmit={handleGuestSignup} className="space-y-2.5">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={onboardEmail}
                      onChange={(e) => setOnboardEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30"
                    />
                  </div>
                  <input
                    type="password"
                    placeholder="Create a password (min 8 characters)"
                    value={onboardPassword}
                    onChange={(e) => setOnboardPassword(e.target.value)}
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#00E5FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/30"
                  />
                  {onboardError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{onboardError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={onboardStatus === 'loading'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  >
                    {onboardStatus === 'loading' ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Creating account...</span></>
                    ) : (
                      <><span>Create Account & Link Booking</span><ChevronRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </form>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  Already have an account?{' '}
                  <a href="/login?returnTo=/account" className="text-[#00E5FF] hover:underline font-medium">Sign in</a>
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
