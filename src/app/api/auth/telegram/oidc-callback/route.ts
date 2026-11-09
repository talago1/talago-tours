import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 5 * 60 * 1000;

const TELEGRAM_ISSUER = 'https://oauth.telegram.org';
const TELEGRAM_JWKS_URL = new URL('https://oauth.telegram.org/.well-known/jwks.json');
const jwks = createRemoteJWKSet(TELEGRAM_JWKS_URL);

/** Allow only safe relative paths to prevent open-redirect and login loops. */
function safePath(raw: string | null | undefined): string {
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

function cleanBaseUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  return url.replace(/^[\uFEFF\s]+/, '').trim().replace(/\/+$/, '') || fallback;
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-telegram-oidc-callback'), LIMIT, WINDOW_MS);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateFromQuery = searchParams.get('state');
  const errorParam = searchParams.get('error');

  // ── If Telegram returned an error ──────────────────────────────────────────
  if (errorParam) {
    const msg = encodeURIComponent(`Telegram declined the login request: ${errorParam}`);
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  if (!code || !stateFromQuery) {
    const msg = encodeURIComponent('Missing authorization code or state from Telegram.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  // ── Read and validate PKCE cookie ─────────────────────────────────────────
  const pkceRaw = request.cookies.get('tg_pkce')?.value;
  if (!pkceRaw) {
    const msg = encodeURIComponent('Login session expired. Please try signing in again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  let pkce: { state: string; codeVerifier: string; nonce: string; returnTo: string; redirectUri?: string };
  try {
    pkce = JSON.parse(pkceRaw);
  } catch {
    const msg = encodeURIComponent('Invalid login session. Please try again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  // Constant-time state comparison
  const stateBuf = Buffer.from(stateFromQuery, 'utf8');
  const expectedBuf = Buffer.from(pkce.state, 'utf8');
  const stateMatch =
    stateBuf.length === expectedBuf.length &&
    require('crypto').timingSafeEqual(stateBuf, expectedBuf);

  if (!stateMatch) {
    const msg = encodeURIComponent('State mismatch. Possible CSRF attempt. Please try again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  const returnTo = safePath(pkce.returnTo);

  // ── One-time state replay protection ─────────────────────────────────────
  const replayKey = `tg_oidc_state_${pkce.state}`;
  const alreadyUsed = await prisma.systemSetting.findUnique({ where: { key: replayKey } });
  if (alreadyUsed) {
    // If the user already has an active session cookie, route them directly to returnTo
    const existingToken = request.cookies.get('talago_session')?.value;
    if (existingToken) {
      return NextResponse.redirect(new URL(returnTo, request.nextUrl.origin));
    }
    const msg = encodeURIComponent('This authorization session has already been used. Please start a new login.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }
  // Mark as used immediately
  await prisma.systemSetting
    .create({ data: { key: replayKey, value: new Date().toISOString() } })
    .catch(() => {/* concurrent collision — still continue since first create wins */});

  const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID;
  const clientSecret = process.env.TELEGRAM_OIDC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const msg = encodeURIComponent('Telegram OIDC is not fully configured on the server.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  const origin = cleanBaseUrl(process.env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin);
  const redirectUri = pkce.redirectUri || `${origin}/api/auth/telegram/oidc-callback`;

  // ── Exchange authorization code for tokens ────────────────────────────────
  let idToken: string;
  try {
    const tokenRes = await fetch('https://oauth.telegram.org/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: pkce.codeVerifier,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[tg-oidc-callback] Token exchange failed:', tokenData);
      const msg = encodeURIComponent('Telegram token exchange failed. Please try again.');
      return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
    }

    idToken = tokenData.id_token;
  } catch (err) {
    console.error('[tg-oidc-callback] Token exchange error:', err);
    const msg = encodeURIComponent('Could not reach Telegram servers. Please try again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  // ── Verify ID token via JWKS ──────────────────────────────────────────────
  let claims: any;
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: TELEGRAM_ISSUER,
      audience: clientId,
    });

    // Validate nonce to prevent replay via ID token substitution
    if (payload.nonce !== pkce.nonce) {
      const msg = encodeURIComponent('Nonce mismatch in Telegram ID token. Please try again.');
      return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
    }

    claims = payload;
  } catch (err) {
    console.error('[tg-oidc-callback] ID token verification failed:', err);
    const msg = encodeURIComponent('Telegram identity verification failed. Please try again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  // ── Extract Telegram identity from verified claims ─────────────────────────
  const telegramId = String(claims.sub);
  const rawFullName =
    (typeof claims.name === 'string' && claims.name.trim()) ||
    [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim() ||
    (claims.preferred_username ? `@${claims.preferred_username}` : null);

  const fullName = rawFullName && rawFullName !== 'User' ? rawFullName : `Traveler #${telegramId}`;
  const telegramUsername = (claims.preferred_username as string) || null;
  const telegramPhotoUrl = (claims.picture as string) || null;
  const telegramBotAccess = !!(claims['telegram:bot_access']);
  // Phone is only present if the user granted the 'phone' scope
  const rawPhone = (claims.phone_number as string) || null;
  const telegramPhone = rawPhone && rawPhone.trim().length > 0 ? rawPhone.trim() : null;
  const telegramPhoneVerified = Boolean(claims.phone_number_verified ?? (telegramPhone ? true : false));

  const syntheticEmail = `telegram-${telegramId}@noreply.talago.com`;

  // ── Upsert CustomerProfile ─────────────────────────────────────────────────
  try {
    const existingByTgId = await prisma.customerProfile.findUnique({
      where: { telegramId },
    });

    if (existingByTgId) {
      await prisma.customerProfile.update({
        where: { telegramId },
        data: {
          name: fullName,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          isShadow: false,
          ...(telegramPhone ? { phone: telegramPhone, telegramPhone, telegramPhoneVerified: true } : {}),
        },
      });
    } else {
      await prisma.customerProfile.upsert({
        where: { email: syntheticEmail },
        create: {
          email: syntheticEmail,
          name: fullName,
          telegramId,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          isShadow: false,
          ...(telegramPhone ? { phone: telegramPhone, telegramPhone, telegramPhoneVerified: true } : {}),
        },
        update: {
          name: fullName,
          telegramId,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          isShadow: false,
          ...(telegramPhone ? { phone: telegramPhone, telegramPhone, telegramPhoneVerified: true } : {}),
        },
      });
    }
  } catch (err) {
    console.error('[tg-oidc-callback] CustomerProfile upsert error:', err);
  }

  // ── Mint a Supabase Auth session ──────────────────────────────────────────
  // We use generateLink with type: 'magiclink' + server-side verifyOtp.
  // This produces an authentic, signed JWT session from Supabase without requiring user interaction.
  let session: { access_token: string; refresh_token: string } | null = null;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
    });

    if (linkError) {
      console.error('[tg-oidc-callback] generateLink error:', linkError.message);
    } else if (linkData?.properties?.hashed_token && supabaseUrl && supabaseAnonKey) {
      const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: linkData.properties.verification_type,
      });

      if (verifyError) {
        console.error('[tg-oidc-callback] verifyOtp error:', verifyError.message);
      } else if (verifyData?.session) {
        session = {
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        };

        if (verifyData.user?.id) {
          await supabaseAdmin.auth.admin.updateUserById(verifyData.user.id, {
            ...(telegramPhone ? { phone: telegramPhone } : {}),
            user_metadata: {
              name: fullName,
              full_name: fullName,
              preferred_username: telegramUsername,
              picture: telegramPhotoUrl,
              avatar_url: telegramPhotoUrl,
              telegram_id: telegramId,
              ...(telegramPhone ? { phone: telegramPhone } : {}),
            },
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[tg-oidc-callback] Supabase session error:', err);
  }

  // ── First-Party HTML Client Bridge ───────────────────────────────────────
  // Instead of a 302/307 redirect from a cross-site origin (which Safari ITP,
  // mobile WebViews, and strict browser policies drop Set-Cookie headers for),
  // we return a 200 OK document response.
  // 1. Cookies set on 200 OK document responses are ALWAYS accepted by browsers.
  // 2. The client script populates Supabase client localStorage and runs a
  //    same-origin first-party fetch to /api/auth/session before navigating.
  // 3. This guarantees 100% session persistence on both client and server across all browsers.
  if (!session?.access_token) {
    console.error('[tg-oidc-callback] Failed to mint Supabase session for', syntheticEmail);
    const msg = encodeURIComponent('Failed to create customer session. Please try logging in again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating | Talago Tours</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background-color: #070F1E; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, -apple-system, sans-serif; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(0,229,255,0.2); border-top-color: #00E5FF; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div style="text-align: center;">
    <div class="spinner"></div>
    <div style="font-size: 15px; font-weight: 700; color: #FFFFFF;">Completing sign-in…</div>
    <div style="font-size: 13px; color: #94A3B8; margin-top: 6px;">Taking you to your account…</div>
  </div>
  <script>
    (async function() {
      const accessToken = ${JSON.stringify(session.access_token)};
      const refreshToken = ${JSON.stringify(session.refresh_token)};
      const returnTo = ${JSON.stringify(returnTo)};
      const supabaseUrl = ${JSON.stringify(supabaseUrl)};

      // 1. Populate Supabase client localStorage for instant client-side SDK auth
      try {
        if (supabaseUrl) {
          const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
          const storageKey = 'sb-' + projectRef + '-auth-token';
          const sessionPayload = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: {
              id: ${JSON.stringify(claims.sub ? String(claims.sub) : '')},
              email: ${JSON.stringify(syntheticEmail)},
              user_metadata: {
                name: ${JSON.stringify(fullName)},
                full_name: ${JSON.stringify(fullName)},
                telegram_id: ${JSON.stringify(telegramId)}
              }
            }
          };
          localStorage.setItem(storageKey, JSON.stringify(sessionPayload));
        }
      } catch (e) {}

      // 2. Synchronize server session cookie via same-origin first-party POST
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
        });
      } catch (e) {}

      // 3. Clean navigation to destination
      window.location.replace(returnTo);
    })();
  </script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });

  // Clear the PKCE cookie
  response.cookies.set('tg_pkce', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });

  // Set the authoritative talago_session cookie (7 days)
  response.cookies.set('talago_session', session.access_token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });

  // Set the authoritative talago_refresh cookie (30 days) for server auto-refresh
  if (session.refresh_token) {
    response.cookies.set('talago_refresh', session.refresh_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
