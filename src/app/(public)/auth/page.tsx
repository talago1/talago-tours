'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Mail,
  ShieldAlert,
  MessageCircle,
  SendHorizontal,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useContactSettings } from '@/hooks/useContactSettings';

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function TelegramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function AuthPageContent() {
  const { dict } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getWhatsAppUrl } = useContactSettings();

  const [authMethod, setAuthMethod] = useState<'GOOGLE' | 'TELEGRAM' | 'EMAIL'>('GOOGLE');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Telegram OIDC state
  const [telegramConfig, setTelegramConfig] = useState<{
    configured: boolean;
    botUsername: string | null;
    oidcConfigured?: boolean;
  } | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  // Check URL errors on mount
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setMessage({ type: 'error', text: decodeURIComponent(errorParam) });
    }
  }, [searchParams]);

  // Load Telegram config
  useEffect(() => {
    fetch('/api/auth/telegram/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTelegramConfig(data);
      })
      .catch(() => setTelegramConfig({ configured: false, botUsername: null }));
  }, []);

  // Cleanup popup watchers on unmount
  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearInterval(popupTimerRef.current);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Telegram OIDC popup flow
  // ---------------------------------------------------------------------------
  const handleTelegramOidc = useCallback(async () => {
    setLoading(true);
    setMessage({ type: 'info', text: 'Connecting to Telegram…' });

    // Cleanup any previous popup watcher
    if (popupTimerRef.current) clearInterval(popupTimerRef.current);
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);

    try {
      const res = await fetch('/api/auth/telegram/authorize?returnTo=/my-bookings');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not start Telegram login. Please try again.');
      }
      const { url } = await res.json();

      // Open Telegram OIDC in a popup
      const popup = window.open(
        url,
        'telegram_oidc',
        'width=800,height=640,scrollbars=yes,resizable=yes,status=yes'
      );

      if (!popup) {
        // Popup was blocked — fall back to full-page redirect
        window.location.href = url;
        return;
      }

      popupRef.current = popup;

      // Listen for postMessage from telegram-success page
      const onMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'talago_telegram_auth_success') {
          window.removeEventListener('message', onMessage);
          if (popupTimerRef.current) clearInterval(popupTimerRef.current);
          if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
          setLoading(false);
          setMessage({ type: 'success', text: 'Signed in with Telegram! Loading your account…' });
          const returnTo = event.data.returnTo || '/my-bookings';

          if (event.data?.session) {
            try {
              await supabaseClient.auth.setSession(event.data.session);
            } catch (err) {
              console.warn('[auth] Could not set client session:', err);
            }
          }

          // Authoritative full-window navigation to ensure server cookies and client session are live
          window.location.href = returnTo;
        }
      };
      window.addEventListener('message', onMessage);

      // Poll for popup closure (fallback if postMessage fails)
      popupTimerRef.current = setInterval(async () => {
        if (popup.closed) {
          clearInterval(popupTimerRef.current!);
          window.removeEventListener('message', onMessage);
          if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);

          // Verify if session exists either in client or via server cookie
          try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (sessionData?.session) {
              setLoading(false);
              setMessage({ type: 'success', text: 'Signed in! Loading your account…' });
              window.location.href = '/my-bookings';
              return;
            }

            const check = await fetch('/api/auth/session');
            const checkData = await check.json();
            if (checkData?.authenticated) {
              setLoading(false);
              setMessage({ type: 'success', text: 'Signed in! Loading your account…' });
              window.location.href = '/my-bookings';
              return;
            }
          } catch {}

          // Fallback navigation
          window.location.href = '/my-bookings';
        }
      }, 600);

      // 5-minute global timeout
      popupTimeoutRef.current = setTimeout(() => {
        clearInterval(popupTimerRef.current!);
        window.removeEventListener('message', onMessage);
        if (!popup.closed) popup.close();
        setLoading(false);
        setMessage({
          type: 'error',
          text: 'Telegram login timed out. Please try again.',
        });
      }, 5 * 60 * 1000);
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err?.message || 'Telegram login failed. Please try again.' });
    }
  }, [router]);

  // ---------------------------------------------------------------------------
  // Google OAuth (Supabase)
  // ---------------------------------------------------------------------------
  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage(null);

    try {
      const cleanOrigin = window.location.origin.replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');
      const redirectUri = `${cleanOrigin}/auth/callback?next=/my-bookings`;
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;

      if (data?.url) {
        try {
          const preflight = await fetch(data.url, { method: 'GET', redirect: 'manual' });
          if (preflight.status === 400) {
            setLoading(false);
            setMessage({
              type: 'error',
              text: 'Google Sign-In is awaiting provider activation in the Supabase Dashboard. In the meantime, please use Telegram or Email.',
            });
            return;
          }
        } catch {
          // CORS blocked — continue
        }
        window.location.href = data.url;
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({
        type: 'error',
        text:
          err?.message?.includes('provider is not enabled') || err?.message?.includes('Unsupported provider')
            ? 'Google Sign-In is awaiting provider activation in Supabase Auth. Please use Telegram or Email in the meantime.'
            : err?.message || 'Could not initiate Google Sign-In.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Email auth (magic link or password)
  // ---------------------------------------------------------------------------
  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: dict?.authPage?.invalidEmail || 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isPasswordMode) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
          const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
          if (signUpError) throw signUpError;
          setMessage({ type: 'success', text: dict?.authPage?.registrationSuccess || 'Registration successful! Check your email to confirm.' });
        } else if (data.session) {
          document.cookie = `talago_session=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
          setMessage({ type: 'success', text: dict?.authPage?.signedInSuccess || 'Signed in successfully! Redirecting...' });
          setTimeout(() => router.push('/my-bookings'), 1200);
        }
      } else {
        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, redirectTo: `${window.location.origin}/my-bookings` }),
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Failed to send magic link.');

        setMessage({ type: 'success', text: dict?.authPage?.magicLinkSent || 'Sign-in link sent! Please check your email inbox.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  // Determine Telegram UI mode
  const oidcReady = telegramConfig?.oidcConfigured === true;
  const legacyReady = telegramConfig?.configured && telegramConfig?.botUsername && !oidcReady;

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col justify-center items-center px-4 py-12 text-[#F8FAFC]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#0ea5e9/8,transparent_55%)] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#0B1528]/85 p-6 sm:p-10 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 transition-all hover:scale-[1.02]">
            <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
          </Link>
          <h1 className="text-2xl font-black text-white">
            {dict?.authPage?.title || 'Sign In or Register'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Access your bookings, boarding passes, and custom travel itinerary.
          </p>
        </div>

        {/* Authentication Mode Switcher */}
        <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-white/[0.04] p-1.5 border border-white/10 text-center">
          <button
            type="button"
            onClick={() => { setAuthMethod('GOOGLE'); setMessage(null); }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
              authMethod === 'GOOGLE'
                ? 'bg-white/15 border border-white/30 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('TELEGRAM'); setMessage(null); }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
              authMethod === 'TELEGRAM'
                ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TelegramIcon className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('EMAIL'); setMessage(null); }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-2 text-xs font-bold transition-all ${
              authMethod === 'EMAIL'
                ? 'bg-white/15 border border-white/30 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="h-4 w-4 text-slate-300 shrink-0" />
            <span>Email</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`mb-5 rounded-2xl border p-3.5 text-xs font-semibold flex gap-2.5 ${
              message.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : message.type === 'info'
                ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : message.type === 'info' ? (
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* ── TAB 1: TELEGRAM ── */}
        {authMethod === 'TELEGRAM' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
              <div className="flex justify-center mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                  <TelegramIcon className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Instant Sign In with Telegram</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Log in seamlessly using your verified Telegram account. No SMS, no password, and no mandatory email required.
              </p>
            </div>

            {/* OIDC Button (preferred) */}
            {telegramConfig === null ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                <span>Loading Telegram login…</span>
              </div>
            ) : oidcReady ? (
              <button
                type="button"
                onClick={handleTelegramOidc}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/10 py-3.5 text-sm font-bold text-sky-200 shadow-xl transition-all duration-300 hover:bg-sky-500/20 hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                ) : (
                  <>
                    <TelegramIcon className="h-5 w-5 text-sky-400" />
                    <span>Continue with Telegram</span>
                  </>
                )}
              </button>
            ) : telegramConfig?.configured ? (
              /* Legacy widget fallback — show unavailability notice when OIDC not set */
              <div className="text-center rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-400 w-full space-y-2">
                <p className="font-semibold text-amber-300">Telegram Login Needs Configuration</p>
                <p className="text-[11px] text-slate-400">
                  Telegram OIDC credentials are not yet set. Once the BotFather OIDC setup is complete and{' '}
                  <code className="text-sky-300">TELEGRAM_OIDC_CLIENT_ID</code> is added to your environment, this button will activate.
                </p>
                <a
                  href="https://t.me/talagoo_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                >
                  <TelegramIcon className="h-3.5 w-3.5" />
                  <span>Message @talagoo_bot</span>
                </a>
              </div>
            ) : (
              <div className="text-center rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400 w-full">
                <p className="font-semibold text-slate-300">Telegram Bot Setup Notice</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  To enable Telegram Login, configure <code className="text-sky-300">TELEGRAM_BOT_TOKEN</code> and OIDC credentials in your environment variables.
                </p>
              </div>
            )}

            <p className="text-[11px] text-center text-slate-500">
              Your Telegram identity is verified cryptographically via server-side OIDC token validation.
            </p>
          </div>
        )}

        {/* ── TAB 2: GOOGLE ── */}
        {authMethod === 'GOOGLE' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <div className="flex justify-center mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <GoogleIcon className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Continue with Google</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Fast and secure sign in using your Google account. Your bookings and itineraries will be linked to your email address.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/[0.06] py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:bg-white/[0.12] hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <GoogleIcon className="h-5 w-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              OAuth 2.0 authenticated directly via Supabase Auth without storing your password.
            </p>
          </div>
        )}

        {/* ── TAB 3: EMAIL ── */}
        {authMethod === 'EMAIL' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center text-xs text-slate-400">
              Email sign-in is optional. Use Telegram or Google for faster, passwordless access.
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">
                {dict?.authPage?.emailLabel || 'Email Address'}
              </span>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder={dict?.authPage?.emailPlaceholder || 'you@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white outline-none transition-all duration-300 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] text-sm"
                />
              </div>
            </label>

            {isPasswordMode && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-300">
                  {dict?.authPage?.passwordLabel || 'Password'}
                </span>
                <input
                  type="password"
                  required
                  placeholder={dict?.authPage?.passwordPlaceholder || '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white outline-none transition-all duration-300 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] text-sm"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EAB308] py-3.5 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-xl shadow-[#EAB308]/20 transition-all duration-300 hover:scale-[1.02] hover:bg-[#FACC15] disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPasswordMode ? (
                dict?.authPage?.signInRegister || 'Sign In / Register'
              ) : (
                dict?.authPage?.sendMagicLink || 'Send Sign-In Link'
              )}
            </button>

            <div className="mt-4 text-center border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => { setIsPasswordMode((prev) => !prev); setMessage(null); }}
                className="text-xs font-bold text-[#06B6D4] hover:text-[#EAB308] transition-colors"
              >
                {isPasswordMode
                  ? (dict?.authPage?.useMagicLink || 'Use passwordless sign-in link instead')
                  : (dict?.authPage?.usePassword || 'Use email password instead')}
              </button>
            </div>
          </form>
        )}

        {/* Guest Booking Lookup link */}
        <div className="mt-6 pt-4 text-center border-t border-white/10">
          <p className="text-xs text-slate-400">
            Booked as a guest?{' '}
            <Link href="/my-bookings" className="font-bold text-[#00E5FF] hover:underline">
              Lookup your booking with reference &amp; phone
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070F1E] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
