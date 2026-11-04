'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

function safePath(raw: string | null): string {
  if (!raw) return '/account';
  const decoded = decodeURIComponent(raw).trim();
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.startsWith('/\\') ||
    decoded.includes('://') ||
    /[\r\n]/.test(decoded)
  ) {
    return '/account';
  }
  return decoded;
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      try {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (error || errorDescription) {
          throw new Error(errorDescription || error || 'Authentication failed');
        }

        const rawNext = searchParams.get('next') || searchParams.get('returnTo');
        const next = safePath(rawNext);
        const code = searchParams.get('code');

        let session = null;

        // 1. If code param is present, perform PKCE exchange via client (uses localStorage verifier)
        if (code) {
          try {
            const { data, error: exchangeError } = await supabaseClient.auth.exchangeCodeForSession(code);
            if (!exchangeError && data?.session) {
              session = data.session;
            } else if (exchangeError) {
              console.warn('[auth-callback] exchangeCodeForSession notice:', exchangeError.message);
            }
          } catch (e) {
            console.warn('[auth-callback] exchange exception:', e);
          }
        }

        // 2. If session wasn't retrieved by exchange, check if client already auto-resolved it
        if (!session) {
          const { data: sessionData } = await supabaseClient.auth.getSession();
          if (sessionData?.session) {
            session = sessionData.session;
          }
        }

        // 3. Check hash fragment for access_token & refresh_token (implicit OAuth or direct token)
        if (!session && typeof window !== 'undefined' && window.location.hash) {
          try {
            const hash = window.location.hash.replace(/^#/, '');
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { data: setSessionData, error: setSessionError } = await supabaseClient.auth.setSession({
                access_token: decodeURIComponent(accessToken),
                refresh_token: decodeURIComponent(refreshToken),
              });
              if (!setSessionError && setSessionData?.session) {
                session = setSessionData.session;
              }
            }
          } catch (e) {
            console.warn('[auth-callback] hash parse notice:', e);
          }
        }

        // 4. If we have a session, sync it to the server cookie
        if (session?.access_token) {
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            });
          } catch (e) {
            console.warn('[auth-callback] session cookie sync notice:', e);
          }

          if (!cancelled) {
            window.location.href = next;
          }
          return;
        }

        // 5. If client had no session, check if the server session cookie is already active
        const sessionCheck = await fetch('/api/auth/session');
        const sessionCheckData = await sessionCheck.json().catch(() => ({}));
        if (sessionCheckData?.authenticated) {
          if (!cancelled) {
            window.location.href = next;
          }
          return;
        }

        throw new Error('Could not establish an authenticated session. Please try logging in again.');
      } catch (err: any) {
        console.error('[auth-callback] Callback handling error:', err);
        if (!cancelled) {
          setErrorMsg(err?.message || 'Authentication failed');
          setTimeout(() => {
            window.location.href = `/auth?error=${encodeURIComponent(err?.message || 'Authentication failed')}`;
          }, 1500);
        }
      }
    }

    handleAuth();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center px-4 text-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {errorMsg ? (
          <>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm font-bold text-white">Sign-in Issue</p>
            <p className="text-xs text-rose-300">{errorMsg}</p>
            <p className="text-xs text-slate-400">Redirecting to login…</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
            <p className="text-sm font-bold text-white">Completing sign-in…</p>
            <p className="text-xs text-slate-400">Redirecting to your account…</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070F1E] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

