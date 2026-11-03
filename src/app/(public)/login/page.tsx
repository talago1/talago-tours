'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let active = true;

    async function checkAndRedirect() {
      const returnTo = safePath(searchParams.get('returnTo'));

      // 1. Check server session cookie first
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();
        if (data?.authenticated && active) {
          window.location.href = returnTo;
          return;
        }
      } catch {}

      // 2. Check client Supabase session
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token && active) {
          // Sync cookie and redirect
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: session.access_token }),
          }).catch(() => {});
          window.location.href = returnTo;
          return;
        }
      } catch {}

      // 3. Not authenticated -> redirect to /auth preserving query parameters
      if (active) {
        const params = searchParams.toString();
        const authPath = params ? `/auth?${params}` : '/auth';
        router.replace(authPath);
      }
    }

    checkAndRedirect();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#070F1E] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#070F1E] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
        </main>
      }
    >
      <LoginRedirectContent />
    </Suspense>
  );
}

