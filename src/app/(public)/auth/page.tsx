'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isPasswordMode) {
        // Password Sign In / Sign Up
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If login fails, try signing up the user!
          const { error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
            throw signUpError;
          }

          setMessage({
            type: 'success',
            text: 'Registration successful! Please check your email to confirm your account.',
          });
        } else if (data.session) {
          document.cookie = `talago_session=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
          setMessage({ type: 'success', text: 'Signed in successfully! Redirecting...' });
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      } else {
        // Passwordless Magic Link
        const { error } = await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Magic link sent! Please check your email inbox to sign in instantly.',
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
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with a passwordless magic link or credentials.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Email Address</span>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white outline-none transition-all duration-300 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]"
              />
            </div>
          </label>

          {isPasswordMode && (
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Password</span>
              <input
                type="password"
                required
                placeholder="••••••••"
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
              'Sign In / Register'
            ) : (
              'Send Magic Link'
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
            {isPasswordMode ? 'Use passwordless magic link instead' : 'Use email password instead'}
          </button>
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
