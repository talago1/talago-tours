'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import CountryCodeSelector from '@/components/checkout/CountryCodeSelector';

function safeReturnTarget(raw: string | null | undefined): string {
  if (!raw) return '/account';
  const decoded = decodeURIComponent(raw).trim();
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded === '/login' ||
    decoded === '/auth' ||
    decoded.startsWith('/login?') ||
    decoded.startsWith('/auth?') ||
    /[\r\n]/.test(decoded)
  ) {
    return '/account';
  }
  if (decoded === '/my-bookings') return '/account?tab=bookings';
  return decoded;
}

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
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshAuth } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const targetReturn = safeReturnTarget(searchParams.get('returnTo'));

  // Initialize mode and prefill email from query params
  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setMode('REGISTER');
    }
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    const err = searchParams.get('error');
    if (err) {
      setMessage({ type: 'error', text: decodeURIComponent(err) });
    }
  }, [searchParams]);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace(targetReturn);
    }
  }, [isAuthenticated, targetReturn]);

  // 1. One-Click Telegram Login
  const handleTelegramLogin = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/auth/telegram/authorize?returnTo=${encodeURIComponent(targetReturn)}`, {
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Telegram login unavailable. Please use email or Google.');
      }
      window.location.href = data.url;
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err?.message || 'Could not connect to Telegram.' });
    }
  }, [targetReturn]);

  // 2. One-Click Google Login
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const cleanOrigin = window.location.origin.replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');
      const redirectUri = `${cleanOrigin}/auth/callback?next=${encodeURIComponent(targetReturn)}`;

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: err?.message || 'Google sign-in is currently unavailable. Please use Telegram or Email.',
      });
    }
  }, [targetReturn]);

  // 3. Email & Password Submission (Login or Register)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (mode === 'REGISTER' && !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'LOGIN' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'LOGIN' ? { email, password } : { email, password, name, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      setMessage({ type: 'success', text: mode === 'LOGIN' ? 'Signed in! Redirecting…' : 'Account created! Redirecting…' });
      await refreshAuth();
      window.location.replace(targetReturn);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An error occurred during authentication.' });
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col justify-center items-center px-4 py-12 text-[#F8FAFC]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#0ea5e9/8,transparent_55%)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group transition-transform active:scale-95">
            <span className="text-3xl font-black tracking-tight text-white group-hover:text-[#00E5FF] transition-colors">
              TALAGO<span className="text-[#FF5B00]">.</span>
            </span>
          </Link>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#00E5FF]">
            Traveler Account & Bookings
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1528]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => { setMode('LOGIN'); setMessage(null); }}
              className={`py-2.5 rounded-xl text-xs font-black tracking-wider transition-all ${
                mode === 'LOGIN'
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#070F1E] shadow-lg shadow-[#00E5FF]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('REGISTER'); setMessage(null); }}
              className={`py-2.5 rounded-xl text-xs font-black tracking-wider transition-all ${
                mode === 'REGISTER'
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#070F1E] shadow-lg shadow-[#00E5FF]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-xs font-medium ${
                message.type === 'error'
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 1-Click Instant Social Auth */}
          <div className="space-y-3 mb-6">
            {/* Telegram 1-Click */}
            <button
              type="button"
              onClick={handleTelegramLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white py-3 px-4 text-xs font-black tracking-wide shadow-lg shadow-[#229ED9]/25 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
            >
              <TelegramIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Telegram</span>
            </button>

            {/* Google 1-Click */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white py-3 px-4 text-xs font-bold tracking-wide hover:border-white/30 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0B1528] px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              or with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name *</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 focus-within:border-[#00E5FF] focus-within:bg-white/[0.08] transition">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Schmidt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address *</label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 focus-within:border-[#00E5FF] focus-within:bg-white/[0.08] transition">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Phone / WhatsApp <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <CountryCodeSelector
                  value={phone}
                  onChange={(val) => setPhone(val)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password *</label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 focus-within:border-[#00E5FF] focus-within:bg-white/[0.08] transition">
                <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-3 px-4 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#070F1E]" />
              ) : (
                <>
                  <span>{mode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Guest Booking Lookup link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Have an existing reservation?{' '}
              <Link
                href="/account?tab=lookup"
                className="text-[#00E5FF] font-bold hover:underline"
              >
                Look up booking as guest →
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Encrypted 256-bit secure session • Zero spam guarantee</span>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070F1E] flex flex-col justify-center items-center px-4 py-12 text-[#F8FAFC]">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
        </main>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
