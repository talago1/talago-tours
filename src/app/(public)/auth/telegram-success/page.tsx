'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Suspense } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

/** Allow only safe relative paths to prevent open-redirect and login loops. */
function safePath(raw: string | null): string {
  if (!raw) return '/account';
  const decoded = decodeURIComponent(raw).trim();
  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.startsWith('/\\') ||
    decoded.includes('://') ||
    decoded === '/login' ||
    decoded === '/auth' ||
    decoded.startsWith('/login?') ||
    decoded.startsWith('/auth?') ||
    /[\r\n]/.test(decoded)
  ) {
    return '/account';
  }
  return decoded;
}

function TelegramSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'closing' | 'redirecting' | 'done'>('closing');

  useEffect(() => {
    const returnTo = safePath(searchParams.get('returnTo'));

    // Extract access_token and refresh_token from hash fragment if present
    let sessionPayload: { access_token: string; refresh_token: string } | null = null;
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          sessionPayload = {
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          };
        }
      } catch (err) {
        console.warn('[telegram-success] could not parse token hash:', err);
      }
    }

    const tryClosePopup = async () => {
      // If we have a session payload, hydrate client session and sync server cookie
      if (sessionPayload) {
        try {
          await supabaseClient.auth.setSession(sessionPayload);
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: sessionPayload.access_token }),
          });
        } catch (e) {
          console.warn('[telegram-success] session sync warning:', e);
        }
      }

      try {
        if (window.opener && !window.opener.closed) {
          // Post a message with session payload to opener
          window.opener.postMessage(
            {
              type: 'talago_telegram_auth_success',
              returnTo,
              session: sessionPayload,
            },
            window.location.origin
          );

          // Give postMessage 150ms to dispatch before closing
          setTimeout(() => {
            try {
              window.close();
            } catch {}
          }, 150);

          return true;
        }
      } catch (e) {
        // Opener blocked or cross-origin
      }
      return false;
    };

    tryClosePopup().then((closed) => {
      if (!closed) {
        // Not running in an accessible popup — redirect this window directly
        setStatus('redirecting');
        window.location.href = returnTo;
      } else {
        setStatus('done');
        // Fallback in case window.close() is blocked by browser popup policies
        setTimeout(() => {
          setStatus('redirecting');
          window.location.href = returnTo;
        }, 2500);
      }
    });
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center px-4 text-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        {status === 'done' ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-bold text-white">Signed in with Telegram!</p>
            <p className="text-xs text-slate-400">Loading your account…</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <p className="text-sm font-bold text-white">
              {status === 'redirecting' ? 'Redirecting to your account…' : 'Completing sign-in…'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function TelegramSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070F1E] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </main>
      }
    >
      <TelegramSuccessContent />
    </Suspense>
  );
}
