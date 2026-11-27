import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie } from '@/server/auth';
import { adoptOwnedBookings } from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const TELEGRAM_ISSUER = 'https://oauth.telegram.org';
const jwks = createRemoteJWKSet(new URL('https://oauth.telegram.org/.well-known/jwks.json'));

/** Allow only safe relative paths to prevent open-redirect vulnerabilities. */
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
  if (decoded === '/my-bookings') return '/account?tab=bookings';
  return decoded;
}

function cleanBaseUrl(url?: string | null, fallback = ''): string {
  if (!url) return fallback;
  return url.replace(/^[\uFEFF\s]+/, '').replace(/\/+$/, '');
}

/**
 * Creates an authoritative HTML bridge response that sets the session cookie
 * on a first-party 200 OK document response, then navigates directly to target.
 * This guarantees 100% cookie acceptance across all browsers including Safari ITP and mobile WebViews.
 */
function createAuthBridgeResponse(targetUrl: string, sessionToken: string): NextResponse {
  const safeTarget = safePath(targetUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${safeTarget}">
  <title>Authenticating with Talago...</title>
  <style>
    body {
      background: #070F1E;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      text-align: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 360px;
      width: 100%;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(0, 229, 255, 0.2);
      border-top-color: #00E5FF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin:0 0 8px;font-size:16px;font-weight:700;">Welcome to Talago</h3>
    <p style="margin:0;font-size:13px;color:#94A3B8;">Finalizing secure login...</p>
  </div>
  <script>
    try {
      window.location.replace(${JSON.stringify(safeTarget)});
    } catch (e) {
      window.location.href = ${JSON.stringify(safeTarget)};
    }
  </script>
</body>
</html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  setSessionCookie(response, sessionToken);

  // Clear transient PKCE cookie
  response.cookies.set('tg_pkce', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const stateFromQuery = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || !code || !stateFromQuery) {
    const errorMsg = errorDescription || error || 'Telegram authorization cancelled or missing parameters.';
    console.warn('[tg-oidc-callback] authorization failed or cancelled:', { error, errorDescription });
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(errorMsg)}`, request.nextUrl.origin));
  }

  // 1. Retrieve PKCE state from cookie or DB fallback
  let pkceRaw = request.cookies.get('tg_pkce')?.value;
  if (!pkceRaw) {
    const dbState = await prisma.systemSetting.findUnique({
      where: { key: `tg_pkce_${stateFromQuery}` },
    });
    pkceRaw = dbState?.value;
    if (pkceRaw) {
      await prisma.systemSetting.delete({ where: { key: `tg_pkce_${stateFromQuery}` } }).catch(() => {});
    }
  }

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
    const msg = encodeURIComponent('State mismatch. Please try again.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  const returnTo = safePath(pkce.returnTo);

  const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID;
  const clientSecret = process.env.TELEGRAM_OIDC_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const msg = encodeURIComponent('Telegram OIDC is not fully configured on the server.');
    return NextResponse.redirect(new URL(`/auth?error=${msg}`, request.nextUrl.origin));
  }

  const origin = cleanBaseUrl(process.env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin);
  const redirectUri = pkce.redirectUri || `${origin}/api/auth/telegram/oidc-callback`;

  // 2. Exchange authorization code for tokens
  let idToken: string;
  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://oauth.telegram.org/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: pkce.codeVerifier,
      }),
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

  // 3. Verify ID token via Telegram JWKS
  let claims: any;
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: TELEGRAM_ISSUER,
      audience: clientId,
    });

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

  // 4. Extract verified Telegram identity
  const telegramId = String(claims.sub);
  const rawFullName =
    (typeof claims.name === 'string' && claims.name.trim()) ||
    [claims.given_name, claims.family_name].filter(Boolean).join(' ').trim() ||
    (claims.preferred_username ? `@${claims.preferred_username}` : null);

  const fullName = rawFullName && rawFullName !== 'User' ? rawFullName : `Traveler #${telegramId}`;
  const telegramUsername = (claims.preferred_username as string) || null;
  const telegramPhotoUrl = (claims.picture as string) || null;
  const telegramBotAccess = !!claims['telegram:bot_access'];
  const rawPhone = (claims.phone_number as string) || null;
  const telegramPhone = rawPhone && rawPhone.trim().length > 0 ? rawPhone.trim() : null;
  const telegramPhoneVerified = Boolean(claims.phone_number_verified === true);

  // 5. Upsert CustomerProfile in database (preserve custom Talago display name & phone)
  const { phoneMatchKey } = await import('@/utils/phoneMatch');
  const { normalizePhoneNumber } = await import('@/utils/sanitize');
  const normalizedTgPhone = telegramPhone ? normalizePhoneNumber(telegramPhone) : null;

  let profile = await prisma.customerProfile.findUnique({
    where: { telegramId },
  });

  if (profile) {
    const shouldBackfillName =
      !profile.name ||
      profile.name === 'User' ||
      profile.name.startsWith('Traveler #');
    const shouldBackfillPhone = !profile.phone && telegramPhoneVerified && normalizedTgPhone;

    profile = await prisma.customerProfile.update({
      where: { id: profile.id },
      data: {
        ...(shouldBackfillName ? { name: fullName } : {}),
        telegramUsername,
        telegramPhotoUrl,
        telegramBotAccess,
        telegramConnectedAt: new Date(),
        isShadow: false,
        ...(normalizedTgPhone
          ? {
              ...(shouldBackfillPhone
                ? {
                    phone: normalizedTgPhone,
                    phoneNormalized: phoneMatchKey(normalizedTgPhone) ?? undefined,
                  }
                : {}),
              telegramPhone: normalizedTgPhone,
              telegramPhoneVerified,
            }
          : {}),
      },
    });
  } else {
    // Check if a profile with verified phone already exists to merge
    let existingByPhone = null;
    if (normalizedTgPhone && telegramPhoneVerified) {
      const tgPhoneKey = phoneMatchKey(normalizedTgPhone);
      existingByPhone = await prisma.customerProfile.findFirst({
        where: {
          OR: [
            ...(tgPhoneKey ? [{ phoneNormalized: tgPhoneKey }] : []),
            { phone: normalizedTgPhone },
            { telegramPhone: normalizedTgPhone },
          ],
        },
      });
    }

    if (existingByPhone) {
      profile = await prisma.customerProfile.update({
        where: { id: existingByPhone.id },
        data: {
          telegramId,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          telegramPhone: normalizedTgPhone,
          telegramPhoneVerified,
          ...(!existingByPhone.phone && normalizedTgPhone
            ? {
                phone: normalizedTgPhone,
                phoneNormalized: phoneMatchKey(normalizedTgPhone) ?? undefined,
              }
            : {}),
          isShadow: false,
        },
      });
    } else {
      const syntheticEmail = `telegram-${telegramId}@noreply.talago.com`;
      profile = await prisma.customerProfile.create({
        data: {
          telegramId,
          email: syntheticEmail,
          name: fullName,
          telegramUsername,
          telegramPhotoUrl,
          telegramBotAccess,
          telegramConnectedAt: new Date(),
          phone: telegramPhoneVerified ? normalizedTgPhone : null,
          phoneNormalized: telegramPhoneVerified && normalizedTgPhone ? phoneMatchKey(normalizedTgPhone) ?? undefined : null,
          telegramPhone: normalizedTgPhone || null,
          telegramPhoneVerified,
          isShadow: false,
        },
      });
    }
  }

  // 6. Adopt historical bookings linked to phone
  if (profile?.id && telegramPhone) {
    adoptOwnedBookings({
      profileId: profile.id,
      phones: [telegramPhone],
      emails: profile.email ? [profile.email] : [],
    }).catch((e) => console.warn('[tg-oidc] booking adoption warning:', e));
  }

  // 7. Mint authoritative Talago session token
  const sessionToken = await createSessionToken({
    id: profile.id,
    name: profile.name,
    email: profile.email || null,
    phone: profile.phone || profile.telegramPhone || null,
    telegramId: profile.telegramId,
    telegramUsername: profile.telegramUsername,
    telegramPhone: profile.telegramPhone,
    telegramPhotoUrl: profile.telegramPhotoUrl,
    role: 'CUSTOMER',
    authProvider: 'telegram',
  });

  // 8. Return authoritative First-Party HTML Document Bridge Response
  return createAuthBridgeResponse(returnTo, sessionToken);
}
