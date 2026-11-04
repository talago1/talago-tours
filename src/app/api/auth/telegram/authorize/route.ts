import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 5 * 60 * 1000;

/** Base64url-encode a Buffer (no padding, URL-safe chars). */
function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Derive PKCE S256 code_challenge from code_verifier. */
function s256(verifier: string): string {
  return b64url(crypto.createHash('sha256').update(verifier, 'ascii').digest());
}

/** Allow only safe relative paths to prevent open-redirect and login loops. */
function safePath(raw: string | null): string {
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
  return decoded;
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-telegram-authorize'), LIMIT, WINDOW_MS);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Telegram OIDC is not yet configured. Set TELEGRAM_OIDC_CLIENT_ID in your environment.' },
      { status: 503 }
    );
  }

  const returnTo = safePath(request.nextUrl.searchParams.get('returnTo'));

  // Generate cryptographically random values (32 bytes each)
  const state = b64url(crypto.randomBytes(32));
  const codeVerifier = b64url(crypto.randomBytes(32));
  const nonce = b64url(crypto.randomBytes(32));
  const codeChallenge = s256(codeVerifier);

  // Store PKCE state in a short-lived HttpOnly cookie (10 minutes)
  const pkcePayload = JSON.stringify({ state, codeVerifier, nonce, returnTo });

  // Build Telegram OIDC authorization URL
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^[\uFEFF\s]+/, '').replace(/\/+$/, '') ||
    request.nextUrl.origin;

  const redirectUri = `${origin}/api/auth/telegram/oidc-callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile phone telegram:bot_access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    nonce,
  });

  const authUrl = `https://oauth.telegram.org/auth?${params.toString()}`;

  const response = NextResponse.json({ url: authUrl });

  response.cookies.set('tg_pkce', pkcePayload, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
  });

  return response;
}

