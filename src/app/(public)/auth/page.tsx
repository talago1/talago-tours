'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { dict } = useLanguage();
  const router = useRouter();

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: dict.authPage.invalidEmail });
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
            text: dict.authPage.registrationSuccess,
          });
        } else if (data.session) {
          document.cookie = `talago_session=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
          setMessage({ type: 'success', text: dict.authPage.signedInSuccess });
          setTimeout(() => router.push('/my-bookings'), 1500);
        }
      } else {
        // Use our custom magic-link endpoint which sends via Resend (reliable
        // delivery) instead of Supabase's built-in SMTP (limited on free tier).
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
          text: dict.authPage.magicLinkSent,
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col justify-center items-center px-5 py-12 text-[#F8FAFC]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#0ea5e9/8,transparent_55%)]" />

      <div className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#0B1528]/80 p-8 md:p-10 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 transition-all hover:scale-[1.02]">
            <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
          </Link>
          <h1 className="text-2xl font-black text-white">{dict.authPage.title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {dict.authPage.subtitle}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{dict.authPage.emailLabel}</span>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                placeholder={dict.authPage.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white outline-none transition-all duration-300 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
              />
            </div>
          </label>

          {isPasswordMode && (
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{dict.authPage.passwordLabel}</span>
              <input
                type="password"
                required
                placeholder={dict.authPage.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white outline-none transition-all duration-300 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
              />
            </label>
          )}

          {message && (
            <div
              className={`rounded-2xl border p-4 text-sm font-semibold flex gap-3 ${
                message.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
              }`}
            >
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#EAB308] py-4 text-sm font-black uppercase tracking-[0.18em] text-[#070F1E] shadow-2xl shadow-[#EAB308]/25 transition-all duration-300 hover:scale-[1.02] hover:bg-[#FACC15] disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPasswordMode ? (
              dict.authPage.signInRegister
            ) : (
              dict.authPage.sendMagicLink
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-white/5 pt-5">
          <button
            type="button"
            onClick={() => {
              setIsPasswordMode((prev) => !prev);
              setMessage(null);
            }}
            className="text-xs font-bold text-[#06B6D4] hover:text-[#EAB308] transition-colors"
          >
            {isPasswordMode ? dict.authPage.useMagicLink : dict.authPage.usePassword}
          </button>
        </div>
      </div>
    </main>
  );
}
