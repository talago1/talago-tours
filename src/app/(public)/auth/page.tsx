'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Mail,
  ShieldAlert,
  MessageCircle,
  Send,
  SendHorizontal,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useContactSettings } from '@/hooks/useContactSettings';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function AuthPage() {
  const { dict } = useLanguage();
  const router = useRouter();
  const { whatsappNumber, getWhatsAppUrl } = useContactSettings();

  // Active Auth Tab: 'TELEGRAM' | 'WHATSAPP' | 'EMAIL'
  const [authMethod, setAuthMethod] = useState<'TELEGRAM' | 'WHATSAPP' | 'EMAIL'>('TELEGRAM');

  // Shared states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Telegram states
  const [telegramConfig, setTelegramConfig] = useState<{ configured: boolean; botUsername: string | null } | null>(null);
  const telegramContainerRef = useRef<HTMLDivElement>(null);

  // WhatsApp states (Inbound challenge flow)
  const [waChallenge, setWaChallenge] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [waPolling, setWaPolling] = useState(false);
  const [waWebhookConfigured, setWaWebhookConfigured] = useState(false);

  // Email states (Secondary)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Load Telegram Bot Configuration
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch('/api/auth/telegram/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTelegramConfig(data);
        }
      })
      .catch(() => {
        setTelegramConfig({ configured: false, botUsername: null });
      });
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Telegram Auth Handler Callback
  // ---------------------------------------------------------------------------
  const handleTelegramAuth = useCallback(async (telegramUser: any) => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Telegram verification failed. Please try again.');
      }

      setMessage({
        type: 'success',
        text: 'Successfully authenticated with Telegram! Redirecting to your dashboard...',
      });

      if (data.actionLink) {
        window.location.href = data.actionLink;
      } else {
        setTimeout(() => {
          router.push('/my-bookings');
        }, 1200);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'An error occurred during Telegram verification.',
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Bind Telegram callback to window
  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;
    return () => {
      delete window.onTelegramAuth;
    };
  }, [handleTelegramAuth]);

  // Render official Telegram Widget when tab is active and botUsername is available
  useEffect(() => {
    if (authMethod !== 'TELEGRAM' || !telegramConfig?.botUsername || !telegramContainerRef.current) {
      return;
    }

    // Clear previous widget iframe if any
    telegramContainerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', telegramConfig.botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '14');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'window.onTelegramAuth(user)');
    script.async = true;

    telegramContainerRef.current.appendChild(script);
  }, [authMethod, telegramConfig]);

  // ---------------------------------------------------------------------------
  // 3. WhatsApp Challenge Initiation & Polling
  // ---------------------------------------------------------------------------
  async function handleStartWhatsAppChallenge() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/whatsapp/challenge', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate verification challenge.');
      }

      setWaChallenge(data.challenge);
      setWaUrl(data.whatsappUrl);
      setWaWebhookConfigured(Boolean(data.hasWebhookConfigured));
      setWaPolling(true);

      // Open WhatsApp in new tab
      window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');

      setMessage({
        type: 'info',
        text: 'WhatsApp opened with your single-use verification message. Send the message, then return here.',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Could not initiate WhatsApp verification.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Poll WhatsApp challenge status
  useEffect(() => {
    if (!waPolling || !waChallenge) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/whatsapp/poll?challenge=${encodeURIComponent(waChallenge)}`);
        const data = await res.json();

        if (data.status === 'VERIFIED') {
          clearInterval(interval);
          setWaPolling(false);
          setMessage({
            type: 'success',
            text: `WhatsApp verified (+${data.phone})! Redirecting...`,
          });

          if (data.actionLink) {
            window.location.href = data.actionLink;
          } else {
            router.push('/my-bookings');
          }
        } else if (data.status === 'EXPIRED') {
          clearInterval(interval);
          setWaPolling(false);
          setMessage({
            type: 'error',
            text: 'Verification challenge expired. Please generate a new one.',
          });
        }
      } catch {
        // silent retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waPolling, waChallenge, router]);

  // ---------------------------------------------------------------------------
  // 4. Email Auth Handler (Secondary & Backward-compatible)
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
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const { error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
          });

          if (signUpError) throw signUpError;

          setMessage({
            type: 'success',
            text: dict?.authPage?.registrationSuccess || 'Registration successful! Check your email to confirm.',
          });
        } else if (data.session) {
          document.cookie = `talago_session=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
          setMessage({ type: 'success', text: dict?.authPage?.signedInSuccess || 'Signed in successfully! Redirecting...' });
          setTimeout(() => router.push('/my-bookings'), 1200);
        }
      } else {
        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/my-bookings`,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Failed to send magic link.');
        }

        setMessage({
          type: 'success',
          text: dict?.authPage?.magicLinkSent || 'Sign-in link sent! Please check your email inbox.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  }

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
          {/* 1. Telegram (Zero cost / Primary) */}
          <button
            type="button"
            onClick={() => {
              setAuthMethod('TELEGRAM');
              setMessage(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all ${
              authMethod === 'TELEGRAM'
                ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SendHorizontal className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Telegram</span>
          </button>

          {/* 2. WhatsApp (Customer-sent message / No OTP fees) */}
          <button
            type="button"
            onClick={() => {
              setAuthMethod('WHATSAPP');
              setMessage(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all ${
              authMethod === 'WHATSAPP'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>WhatsApp</span>
          </button>

          {/* 3. Email (Secondary / Optional) */}
          <button
            type="button"
            onClick={() => {
              setAuthMethod('EMAIL');
              setMessage(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium transition-all ${
              authMethod === 'EMAIL'
                ? 'bg-white/10 border border-white/20 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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

        {/* ── TAB 1: TELEGRAM LOGIN ── */}
        {authMethod === 'TELEGRAM' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-center">
              <div className="flex justify-center mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                  <SendHorizontal className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Instant Sign In with Telegram</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Log in seamlessly using your verified Telegram account. No SMS, no password, and no mandatory email required.
              </p>
            </div>

            {/* Telegram Official Widget Container */}
            <div className="flex flex-col items-center justify-center min-h-[56px] py-2">
              {telegramConfig?.configured && telegramConfig.botUsername ? (
                <div ref={telegramContainerRef} className="flex justify-center" />
              ) : telegramConfig === null ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                  <span>Loading Telegram login...</span>
                </div>
              ) : (
                <div className="text-center rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400 w-full">
                  <p className="font-semibold text-slate-300">Telegram Bot Setup Notice</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    To enable 1-click Telegram Login on your custom domain, set <code className="text-sky-300">TELEGRAM_BOT_TOKEN</code> in your environment variables and authorize your domain with <code className="text-sky-300">@BotFather</code> (/setdomain).
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://t.me/talagotours"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                      <span>Open Telegram Concierge</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-500">
              Your Telegram identity is verified cryptographically via server-side signature validation.
            </p>
          </div>
        )}

        {/* ── TAB 2: WHATSAPP VERIFICATION ── */}
        {authMethod === 'WHATSAPP' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <div className="flex justify-center mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </span>
              </div>
              <h2 className="text-sm font-bold text-white">Continue with WhatsApp</h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Avoid SMS OTP fees. Send a single-use verification message from your own WhatsApp to our concierge business number.
              </p>
            </div>

            {!waChallenge ? (
              <button
                type="button"
                onClick={handleStartWhatsAppChallenge}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    <span>Open WhatsApp &amp; Send Verification</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Waiting for your WhatsApp message...</span>
                </div>

                <p className="font-mono text-xs text-slate-300 bg-white/5 py-1.5 px-3 rounded-xl inline-block">
                  Challenge: <strong className="text-white">{waChallenge}</strong>
                </p>

                {waUrl && (
                  <div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:underline"
                    >
                      <span>Re-open WhatsApp chat</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {!waWebhookConfigured && (
                  <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300 text-left">
                    <p className="font-bold">Provider Configuration Note:</p>
                    <p className="mt-0.5">
                      Inbound webhook receiver is awaiting Meta Cloud API token (<code className="text-white font-mono">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code>). For instant login without webhook setup, please use <strong>Telegram</strong> or <strong>Email</strong>.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartWhatsAppChallenge}
                  className="mt-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Generate a new challenge
                </button>
              </div>
            )}

            {/* Direct Support fallback */}
            <div className="pt-2 text-center border-t border-white/5">
              <a
                href={getWhatsAppUrl('Hello TALAGO Support! I need assistance signing in to my account.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Need concierge help? Chat with us on WhatsApp ({whatsappNumber})</span>
              </a>
            </div>
          </div>
        )}

        {/* ── TAB 3: EMAIL (SECONDARY) ── */}
        {authMethod === 'EMAIL' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center text-xs text-slate-400">
              Email sign-in is optional. Use Telegram or WhatsApp for faster, passwordless access.
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
                onClick={() => {
                  setIsPasswordMode((prev) => !prev);
                  setMessage(null);
                }}
                className="text-xs font-bold text-[#06B6D4] hover:text-[#EAB308] transition-colors"
              >
                {isPasswordMode
                  ? (dict?.authPage?.useMagicLink || 'Use passwordless sign-in link instead')
                  : (dict?.authPage?.usePassword || 'Use email password instead')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
