/**
 * POST /api/auth/magic-link
 *
 * Accepts an email address and sends a Supabase magic-link (OTP) email via
 * Resend instead of Supabase's built-in SMTP (which has strict rate limits on
 * the free tier and fails silently when unconfigured).
 *
 * Flow:
 *  1. Rate-limit by IP (5 requests / 10 min) to prevent spam.
 *  2. Validate the email address.
 *  3. Ask Supabase to generate a one-time token for that email.
 *  4. Send the magic link ourselves via Resend so we control the from-address,
 *     branding, and delivery reliability.
 *
 * Required env vars:
 *   RESEND_API_KEY             — Resend API key
 *   SUPABASE_SERVICE_ROLE_KEY  — needed to call supabaseAdmin.auth.admin.*
 *   NEXT_PUBLIC_APP_URL        — used to build the redirect URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendMagicLinkEmail } from '@/lib/email';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

// 5 magic-link requests per IP per 10 minutes — aggressive enough to blunt
// enumeration / spam without blocking legitimate retries.
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

const NO_STORE = { 'cache-control': 'no-store, private' };

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const limit = rateLimit(clientKey(request, 'auth-magic-link'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email, redirectTo } = body as { email?: string; redirectTo?: string };

    // 2. Validate email
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400, headers: NO_STORE },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Build the redirect target (where the user lands after clicking the link)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.nextUrl.origin;
    const finalRedirect = redirectTo
      ? redirectTo.startsWith('/')
        ? `${appUrl}${redirectTo}`
        : redirectTo
      : `${appUrl}/my-bookings`;

    // 3. Generate a magic-link token via Supabase Admin API.
    //    generateLink returns the full magic-link URL that we embed in the email.
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: finalRedirect },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error('[magic-link] Supabase generateLink error:', linkError);
      return NextResponse.json(
        { error: 'Unable to generate sign-in link. Please try again later.' },
        { status: 500, headers: NO_STORE },
      );
    }

    const magicLink = data.properties.action_link;

    // 4. Send via Resend
    await sendMagicLinkEmail(normalizedEmail, magicLink);

    return NextResponse.json(
      { message: 'Magic link sent. Check your inbox.' },
      { status: 200, headers: NO_STORE },
    );
  } catch (err) {
    console.error('[magic-link] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
