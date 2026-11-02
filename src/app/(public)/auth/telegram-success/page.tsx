'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Suspense } from 'react';

/** Allow only safe relative paths to prevent open-redirect. */
function safePath(raw: string | null): string {
  if (!raw) return '/my-bookings';
  const decoded = decodeURIComponent(raw).trim();
  if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\r\n]/.test(decoded)) {
    return '/my-bookings';
  }
  return decoded;
}

function TelegramSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'closing' | 'redirecting' | 'done'>('closing');

  useEffect(() => {
    const returnTo = safePath(searchParams.get('returnTo'));

    // Signal to the opener window that auth succeeded, then close the popup.
    // If we're not in a popup (direct navigation), fall through to a redirect.
    const tryClosePopup = () => {
      try {
        if (window.opener && !window.opener.closed) {
          // Post a message to the opener so it can detect auth completion
          window.opener.postMessage(
            { type: 'talago_telegram_auth_success', returnTo },
            window.location.origin
          );
          // Also navigate the opener in case postMessage isn't caught quickly
          window.opener.location.href = returnTo;
          window.close();
          return true;
        }
      } catch {
        // Opener might be cross-origin or blocked
      }
      return false;
    };

    const closed = tryClosePopup();

    if (!closed) {
      // Not a popup — just redirect this window
      setStatus('redirecting');
      router.replace(returnTo);
    } else {
      setStatus('done');
      // Fallback in case window.close() is blocked
      setTimeout(() => {
        setStatus('redirecting');
        router.replace(returnTo);
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center px-4 text-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        {status === 'done' ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="text-sm font-bold text-white">Signed in with Telegram!</p>
            <p className="text-xs text-slate-400">You can close this window.</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <p className="text-sm font-bold text-white">
              {status === 'redirecting' ? 'Redirecting…' : 'Completing sign-in…'}
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

