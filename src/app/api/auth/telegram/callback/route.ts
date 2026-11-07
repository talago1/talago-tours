import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;
const FRESHNESS_WINDOW_SEC = 600; // 10 minutes max payload age

function cleanBaseUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');
  return cleaned || fallback;
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-telegram-callback'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const first_name = searchParams.get('first_name') || '';
  const last_name = searchParams.get('last_name') || '';
  const username = searchParams.get('username') || '';
  const photo_url = searchParams.get('photo_url') || '';
  const auth_date = searchParams.get('auth_date');
  const hash = searchParams.get('hash');

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const appUrl = cleanBaseUrl(rawAppUrl, request.nextUrl.origin);
  const failureRedirect = `${appUrl}/auth?error=telegram_failed`;
  const successRedirect = `${appUrl}/account`;

  if (!id || !auth_date || !hash) {
    return NextResponse.redirect(`${failureRedirect}&reason=incomplete_payload`);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.redirect(`${failureRedirect}&reason=unconfigured`);
  }

  try {
    // 1. Verify HMAC signature
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    const paramsObj: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      if (key !== 'hash') {
        paramsObj[key] = val;
      }
    });

    const checkString = Object.keys(paramsObj)
      .sort()
      .map((k) => `${k}=${paramsObj[k]}`)
      .join('\n');

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    const hashBuf = Buffer.from(String(hash), 'utf8');
    const expectedBuf = Buffer.from(expectedHash, 'utf8');

    if (hashBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hashBuf, expectedBuf)) {
      return NextResponse.redirect(`${failureRedirect}&reason=invalid_signature`);
    }

    // 2. Strict freshness check (10-minute maximum age)
    const nowSec = Math.floor(Date.now() / 1000);
    const authDateNum = Number(auth_date);
    if (isNaN(authDateNum) || nowSec - authDateNum > FRESHNESS_WINDOW_SEC || authDateNum > nowSec + 60) {
      return NextResponse.redirect(`${failureRedirect}&reason=expired`);
    }

    // 3. Single-use replay protection
    const replayKey = `tg_used_${hash}`;
    const alreadyUsed = await prisma.systemSetting.findUnique({
      where: { key: replayKey },
    });

    if (alreadyUsed) {
      return NextResponse.redirect(`${failureRedirect}&reason=replay_detected`);
    }

    await prisma.systemSetting.create({
      data: {
        key: replayKey,
        value: JSON.stringify({
          consumedAt: new Date().toISOString(),
          telegramId: String(id),
          authDate: String(auth_date),
        }),
      },
    }).catch(() => {
      // Catch concurrent collision
    });

    // 4. Stable customer profile
    const syntheticEmail = `telegram-${id}@noreply.talago.com`;
    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || (username ? `@${username}` : `Traveler #${id}`);

    await prisma.customerProfile.upsert({
      where: { email: syntheticEmail },
      create: {
        email: syntheticEmail,
        name: fullName,
        isShadow: false,
      },
      update: {
        name: fullName,
        isShadow: false,
      },
    });

    // 5. Session generation
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
        options: { redirectTo: successRedirect },
      });

      if (!linkError && linkData?.properties) {
        const tokenHash = linkData.properties.hashed_token;
        const verificationType = (linkData.properties.verification_type === 'signup' ? 'signup' : 'magiclink') as 'signup' | 'magiclink';

        if (tokenHash && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );

          const { data: verifyData } = await supabaseAnon.auth.verifyOtp({
            token_hash: tokenHash,
            type: verificationType,
          });

          if (verifyData?.session?.access_token) {
            accessToken = verifyData.session.access_token;
            refreshToken = verifyData.session.refresh_token;
          }
        }
      }
    } catch (err) {
      console.warn('[auth-telegram-callback] Supabase session generation error:', err);
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
      const accessToken = ${JSON.stringify(accessToken || '')};
      const refreshToken = ${JSON.stringify(refreshToken || '')};
      const successRedirect = ${JSON.stringify(successRedirect)};
      const supabaseUrl = ${JSON.stringify(supabaseUrl)};

      // 1. Populate Supabase client localStorage
      try {
        if (supabaseUrl && accessToken) {
          const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
          const storageKey = 'sb-' + projectRef + '-auth-token';
          const sessionPayload = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: 'bearer',
            user: {
              id: ${JSON.stringify(id ? String(id) : '')},
              email: ${JSON.stringify(syntheticEmail)},
              user_metadata: {
                name: ${JSON.stringify(fullName)},
                full_name: ${JSON.stringify(fullName)},
                telegram_id: ${JSON.stringify(id)}
              }
            }
          };
          localStorage.setItem(storageKey, JSON.stringify(sessionPayload));
        }
      } catch (e) {}

      // 2. Synchronize server session cookie via same-origin first-party POST
      if (accessToken) {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
          });
        } catch (e) {}
      }

      // 3. Clean navigation to destination
      window.location.replace(successRedirect);
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

    if (accessToken) {
      response.cookies.set('talago_session', accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    if (refreshToken) {
      response.cookies.set('talago_refresh', refreshToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err) {
    console.error('[auth-telegram-callback] Unexpected error:', err);
    return NextResponse.redirect(`${failureRedirect}&reason=server_error`);
  }
}
