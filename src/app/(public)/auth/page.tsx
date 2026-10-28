'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Mail,
  ShieldAlert,
  Phone,
  MessageCircle,
  KeyRound,
  CheckCircle2,
  Send,
  SendHorizontal,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export default function AuthPage() {
  // Tabs: 'WHATSAPP' | 'TELEGRAM' | 'EMAIL'
  const [authMethod, setAuthMethod] = useState<'WHATSAPP' | 'TELEGRAM' | 'EMAIL'>('WHATSAPP');

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [otpStep, setOtpStep] = useState<'ENTER_IDENTIFIER' | 'ENTER_OTP'>('ENTER_IDENTIFIER');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Email states (Secondary)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  // Shared states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { dict } = useLanguage();
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Handler 1: Send OTP (WhatsApp or Telegram)
  // ---------------------------------------------------------------------------
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean || clean.length < 3) {
      setMessage({
        type: 'error',
        text: authMethod === 'WHATSAPP'
          ? 'يرجى إدخال رقم هاتف صحيح مع كود الدولة (مثال: +201022243460).'
          : 'يرجى إدخال اسم المستخدم في تليجرام أو رقم هاتفك.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const channel = authMethod === 'TELEGRAM' ? 'telegram' : 'whatsapp';
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: clean, channel }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال كود التحقق. يرجى المحاولة لاحقاً.');
      }

      setOtpStep('ENTER_OTP');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setMessage({
        type: 'success',
        text: authMethod === 'WHATSAPP'
          ? 'تم إرسال كود التأكيد إلى واتساب الخاص بك بنجاح! 📲'
          : 'تم إرسال كود التأكيد عبر تليجرام بنجاح! ✈️',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Handler 2: Verify OTP
  // ---------------------------------------------------------------------------
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setMessage({ type: 'error', text: 'يرجى إدخال كود التحقق المكون من 6 أرقام.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'كود التحقق غير صحيح أو انتهت صلاحيته.');
      }

      setMessage({
        type: 'success',
        text: 'تم تسجيل الدخول بنجاح! جاري تحويلك إلى لوحة رحلاتك...',
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
        text: err?.message || 'فشل التحقق من الكود. يرجى التأكد وإعادة المحاولة.',
      });
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Handler 3: Email Auth (Secondary)
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

          if (signUpError) {
            throw signUpError;
          }

          setMessage({
            type: 'success',
            text: dict?.authPage?.registrationSuccess || 'Registration successful! Check your email.',
          });
        } else if (data.session) {
          document.cookie = `talago_session=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
          setMessage({ type: 'success', text: dict?.authPage?.signedInSuccess || 'Signed in! Redirecting...' });
          setTimeout(() => router.push('/my-bookings'), 1500);
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
          text: dict?.authPage?.magicLinkSent || 'Magic link sent! Check your inbox.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An unexpected error occurred.',
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
          <h1 className="text-2xl font-black text-white">تسجيل الدخول والتسجيل</h1>
          <p className="mt-1 text-xs text-slate-400">
            الدخول الفوري عبر واتساب أو تليجرام بدون تعقيدات
          </p>
        </div>

        {/* Channels Tabs: WhatsApp (Primary) | Telegram (Primary) | Email (Secondary) */}
        <div className="mb-6 grid grid-cols-3 gap-1.5 rounded-2xl bg-white/[0.04] p-1.5 border border-white/10 text-center">
          {/* 1. WhatsApp */}
          <button
            type="button"
            onClick={() => {
              setAuthMethod('WHATSAPP');
              setOtpStep('ENTER_IDENTIFIER');
              setMessage(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all ${
              authMethod === 'WHATSAPP'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>واتساب</span>
          </button>

          {/* 2. Telegram */}
          <button
            type="button"
            onClick={() => {
              setAuthMethod('TELEGRAM');
              setOtpStep('ENTER_IDENTIFIER');
              setMessage(null);
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all ${
              authMethod === 'TELEGRAM'
                ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SendHorizontal className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>تليجرام</span>
          </button>

          {/* 3. Email (Secondary) */}
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
            <span>الإيميل</span>
          </button>
        </div>

        {/* ── METHOD 1 & 2: WHATSAPP / TELEGRAM OTP FLOW ── */}
        {(authMethod === 'WHATSAPP' || authMethod === 'TELEGRAM') && (
          <div>
            {otpStep === 'ENTER_IDENTIFIER' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>
                      {authMethod === 'WHATSAPP' ? 'رقم الهاتف أو واتساب' : 'معرف تليجرام أو رقم الهاتف'}
                    </span>
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${authMethod === 'WHATSAPP' ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {authMethod === 'WHATSAPP' ? (
                        <>
                          <MessageCircle className="h-3 w-3" /> تأكيد فوري عبر واتساب
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="h-3 w-3" /> كود فوري عبر تليجرام
                        </>
                      )}
                    </span>
                  </span>

                  <div className="relative flex items-center">
                    {authMethod === 'WHATSAPP' ? (
                      <Phone className="absolute left-4 h-4 w-4 text-slate-500" />
                    ) : (
                      <SendHorizontal className="absolute left-4 h-4 w-4 text-slate-500" />
                    )}
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder={authMethod === 'WHATSAPP' ? '+20 102 224 3460' : '@username or +2010...'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] font-mono text-sm"
                    />
                  </div>
                  <span className="mt-1.5 block text-[11px] text-slate-400">
                    {authMethod === 'WHATSAPP'
                      ? 'أدخل رقم هاتفك مع كود الدولة لنرسل لك كود الدخول عبر واتساب.'
                      : 'أدخل معرف حساب تليجرام الخاص بك أو رقم هاتفك لاستلام كود التأكيد.'}
                  </span>
                </label>

                {message && (
                  <div
                    className={`rounded-2xl border p-3.5 text-xs font-semibold flex gap-2.5 ${
                      message.type === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-red-500/20 bg-red-500/10 text-red-300'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none ${
                    authMethod === 'WHATSAPP'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/20'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>
                        {authMethod === 'WHATSAPP'
                          ? 'إرسال كود الدخول عبر واتساب'
                          : 'إرسال كود الدخول عبر تليجرام'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className={`rounded-2xl border p-3.5 text-center ${authMethod === 'WHATSAPP' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-sky-500/20 bg-sky-500/5'}`}>
                  <p className="text-xs text-slate-300">
                    تم إرسال كود الدخول المكون من 6 أرقام إلى:
                  </p>
                  <p className="mt-1 font-mono text-sm font-black text-white" dir="ltr">
                    {identifier}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-300">
                    أدخل كود التحقق (6 أرقام)
                  </span>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-4 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      dir="ltr"
                      autoFocus
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-center text-xl font-mono tracking-[0.3em] font-black text-white outline-none transition-all duration-300 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                    />
                  </div>
                </label>

                {devOtp && (
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-2 text-center text-[11px] text-yellow-300 font-mono">
                    💡 كود التحقق السريع: <strong>{devOtp}</strong>
                  </div>
                )}

                {message && (
                  <div
                    className={`rounded-2xl border p-3.5 text-xs font-semibold flex gap-2.5 ${
                      message.type === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border-red-500/20 bg-red-500/10 text-red-300'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none ${
                    authMethod === 'WHATSAPP'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-500/20'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>تأكيد وتسجيل الدخول</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('ENTER_IDENTIFIER');
                      setMessage(null);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← تعديل البيانات
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-[#00E5FF] hover:underline font-bold"
                  >
                    إعادة إرسال الكود
                  </button>
                </div>
              </form>
            )}

            {/* Direct Instant Channels Support */}
            <div className="mt-6 border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <a
                href={`https://wa.me/2010222434602?text=${encodeURIComponent('مرحباً TALAGO Tours، أحتاج مساعدة في تسجيل الدخول لحسابي.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>مساعدة فورية عبر واتساب</span>
              </a>

              <a
                href="https://t.me/talagotours"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors font-semibold"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                <span>فتح قناة تليجرام المباشرة</span>
              </a>
            </div>
          </div>
        )}

        {/* ── METHOD 3: EMAIL (SECONDARY) ── */}
        {authMethod === 'EMAIL' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center text-xs text-slate-400">
              البريد الإلكتروني خيار بديل وثانوي. يُفضل استخدام واتساب أو تليجرام للدخول الأسرع.
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">
                {dict?.authPage?.emailLabel || 'البريد الإلكتروني'}
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
                  {dict?.authPage?.passwordLabel || 'كلمة المرور'}
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

            {message && (
              <div
                className={`rounded-2xl border p-3.5 text-xs font-semibold flex gap-2.5 ${
                  message.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/20 bg-red-500/10 text-red-300'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{message.text}</span>
              </div>
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
                dict?.authPage?.sendMagicLink || 'Send Magic Link'
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
                  ? (dict?.authPage?.useMagicLink || 'Use passwordless magic link instead')
                  : (dict?.authPage?.usePassword || 'Use email password instead')}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
