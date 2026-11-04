import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 5 * 60 * 1000;

const TELEGRAM_ISSUER = 'https://oauth.telegram.org';
const TELEGRAM_JWKS_URL = new URL('https://oauth.telegram.org/.well-known/jwks.json');
const jwks = createRemoteJWKSet(TELEGRAM_JWKS_URL);

/** Allow only safe relative paths to prevent open-redirect. */
function safePath(raw: string | null | undefined): string {
  if (!raw) return '/account';
  const decoded = decodeURIComponent(raw).trim();
  if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\r\n]/.test(decoded)) {
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

  let pkce: { state: string; codeVerifier: string; nonce: string; returnTo: string };
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

  // ── One-time state replay protection ─────────────────────────────────────
  const replayKey = `tg_oidc_state_${pkce.state}`;
  const alreadyUsed = await prisma.systemSetting.findUnique({ where: { key: replayKey } });
  if (alreadyUsed) {
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
  const redirectUri = `${origin}/api/auth/telegram/oidc-callback`;

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
          ...(telegramPhone ? { telegramPhone, telegramPhoneVerified: true } : {}),
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
          ...(telegramPhone ? { telegramPhone, telegramPhoneVerified: true } : {}),
        },
        update: {
          name: fullName,
          telegramId,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          isShadow: false,
          ...(telegramPhone ? { telegramPhone, telegramPhoneVerified: true } : {}),
        },
      });
    }
  } catch (err) {
    console.error('[tg-oidc-callback] CustomerProfile upsert error:', err);
  }

  // ── Mint a Supabase Auth session via admin API ────────────────────────────
  // Uses admin.createSession() which is reliable: no OTP tokens, no magic link
  // race conditions, no email-confirmation dependency. The admin API mints a
  // session directly for the Supabase user identified by user_id.
  const returnTo = safePath(pkce.returnTo);
  let session: { access_token: string; refresh_token: string } | null = null;

  try {
    // Step 1: Ensure the Supabase Auth user exists (createUser is idempotent-safe
    // because we catch "already exists" and fall back to lookup).
    let supabaseUserId: string | null = null;

    const { data: createdUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: {
        name: fullName,
        full_name: fullName,
        preferred_username: telegramUsername,
        picture: telegramPhotoUrl,
        avatar_url: telegramPhotoUrl,
        telegram_id: telegramId,
      },
    });

    if (!createError && createdUserData?.user?.id) {
      // Newly created
      supabaseUserId = createdUserData.user.id;
    } else {
      // User already exists — scan listUsers to find by email
      // (Admin API does not expose getUserByEmail directly; listUsers is the workaround)
      const pageSize = 1000;
      let page = 1;
      let found = false;
      while (!found) {
        const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: pageSize,
          page,
        });
        if (listError || !usersPage?.users?.length) break;
        const match = usersPage.users.find((u: { email?: string; id?: string }) => u.email === syntheticEmail);
        if (match?.id) {
          supabaseUserId = match.id;
          found = true;
          // Refresh metadata for returning users
          await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
            user_metadata: {
              name: fullName,
              full_name: fullName,
              preferred_username: telegramUsername,
              picture: telegramPhotoUrl,
              avatar_url: telegramPhotoUrl,
              telegram_id: telegramId,
            },
          }).catch(() => {});
        }
        if (usersPage.users.length < pageSize) break;
        page++;
      }
      if (createError) {
        console.warn('[tg-oidc-callback] createUser note:', createError.message);
      }
    }

    // Step 2: Mint session directly — no OTP, no magic link consumption
    if (supabaseUserId) {
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
        user_id: supabaseUserId,
      });
      if (!sessionError && sessionData?.session) {
        session = {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        };
      } else if (sessionError) {
        console.warn('[tg-oidc-callback] createSession warning:', sessionError.message);
      }
    } else {
      console.error('[tg-oidc-callback] Could not resolve Supabase user ID for', syntheticEmail);
    }
  } catch (err) {
    console.warn('[tg-oidc-callback] Supabase session error (non-fatal):', err);
  }

  // ── Redirect to success page ──────────────────────────────────────────────
  // Pass tokens in hash fragment so client can hydrate Supabase localStorage,
  // while HttpOnly cookie talago_session handles authoritative server authentication.
  const successUrl = new URL(`/auth/telegram-success`, request.nextUrl.origin);
  successUrl.searchParams.set('returnTo', returnTo);

  let redirectTarget = successUrl.toString();
  if (session?.access_token && session?.refresh_token) {
    redirectTarget += `#access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
  }

  const response = NextResponse.redirect(redirectTarget);

  // Clear the PKCE cookie
  response.cookies.set('tg_pkce', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });

  // Set the authoritative talago_session cookie (7 days)
  if (session?.access_token) {
    response.cookies.set('talago_session', session.access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
