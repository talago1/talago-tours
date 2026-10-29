import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.nextUrl.origin;
  const failureRedirect = `${appUrl}/auth?error=telegram_failed`;
  const successRedirect = `${appUrl}/my-bookings`;

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

    // Collect all query parameters except 'hash'
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

    // 2. Freshness check
    const nowSec = Math.floor(Date.now() / 1000);
    const authDateNum = Number(auth_date);
    if (isNaN(authDateNum) || nowSec - authDateNum > 86400 || authDateNum > nowSec + 300) {
      return NextResponse.redirect(`${failureRedirect}&reason=expired`);
    }

    // 3. Stable profile
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

    // 4. Session generation
    let accessToken: string | null = null;
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
          }
        }
      }
    } catch (err) {
      console.warn('[auth-telegram-callback] Supabase session generation error:', err);
    }

    const response = NextResponse.redirect(successRedirect);
    if (accessToken) {
      response.cookies.set('talago_session', accessToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    console.error('[auth-telegram-callback] Unexpected error:', err);
    return NextResponse.redirect(`${failureRedirect}&reason=server_error`);
  }
}

