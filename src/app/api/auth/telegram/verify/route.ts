import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;
const FRESHNESS_WINDOW_SEC = 600; // 10 minutes max payload age
const NO_STORE = { 'cache-control': 'no-store, private' };

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const limit = rateLimit(clientKey(request, 'auth-telegram-verify'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;

    if (!id || !auth_date || !hash) {
      return NextResponse.json(
        { error: 'Incomplete Telegram authentication payload.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'Telegram authentication is not configured on this server (missing TELEGRAM_BOT_TOKEN).' },
        { status: 503, headers: NO_STORE }
      );
    }

    // 2. Validate Telegram signature
    // The secret key is the SHA-256 hash of the bot token.
    const secretKey = crypto.createHash('sha256').update(botToken).digest();

    // Data-check-string: alphabetical sort of all key=value pairs, joined with '\n', excluding 'hash'.
    const checkString = Object.keys(body)
      .filter((k) => k !== 'hash' && body[k] !== undefined && body[k] !== null)
      .sort()
      .map((k) => `${k}=${body[k]}`)
      .join('\n');

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const hashBuf = Buffer.from(String(hash), 'utf8');
    const expectedBuf = Buffer.from(expectedHash, 'utf8');

    if (hashBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hashBuf, expectedBuf)) {
      return NextResponse.json(
        { error: 'Invalid Telegram authentication signature. Verification failed.' },
        { status: 401, headers: NO_STORE }
      );
    }

    // 3. Strict freshness check (10-minute maximum age)
    const nowSec = Math.floor(Date.now() / 1000);
    const authDateNum = Number(auth_date);

    if (isNaN(authDateNum) || nowSec - authDateNum > FRESHNESS_WINDOW_SEC || authDateNum > nowSec + 60) {
      return NextResponse.json(
        { error: 'Telegram authentication token has expired. Please try again.' },
        { status: 401, headers: NO_STORE }
      );
    }

    // 4. One-time replay prevention: ensure hash has not been consumed previously
    const replayKey = `tg_used_${hash}`;
    const alreadyUsed = await prisma.systemSetting.findUnique({
      where: { key: replayKey },
    });

    if (alreadyUsed) {
      return NextResponse.json(
        { error: 'This Telegram authorization response has already been used. Please log in again.' },
        { status: 401, headers: NO_STORE }
      );
    }

    // Mark hash as consumed immediately in PostgreSQL
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

    // 5. Stable customer identity
    const syntheticEmail = `telegram-${id}@noreply.talago.com`;
    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || (username ? `@${username}` : `Traveler #${id}`);

    // Create or update CustomerProfile in PostgreSQL
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

    // 6. Generate and exchange authentic Supabase Auth session
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.nextUrl.origin;
    const finalRedirect = `${appUrl}/my-bookings`;

    let session: any = null;

    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
        options: { redirectTo: finalRedirect },
      });

      if (!linkError && linkData?.properties) {
        const tokenHash = linkData.properties.hashed_token;
        const verificationType = (linkData.properties.verification_type === 'signup' ? 'signup' : 'magiclink') as 'signup' | 'magiclink';

        if (tokenHash && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const supabaseAnon = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );

          const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
            token_hash: tokenHash,
            type: verificationType,
          });

          if (!verifyError && verifyData?.session) {
            session = {
              access_token: verifyData.session.access_token,
              refresh_token: verifyData.session.refresh_token,
              expires_in: verifyData.session.expires_in,
              token_type: verifyData.session.token_type,
              user: {
                id: verifyData.session.user.id,
                email: verifyData.session.user.email,
              },
            };
          }
        }
      } else if (linkError) {
        console.warn('[auth-telegram-verify] Supabase generateLink notice:', linkError.message);
      }
    } catch (sbErr) {
      console.warn('[auth-telegram-verify] Supabase session generation notice:', sbErr);
    }

    // 7. Return verified response with session and set authoritative cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Successfully authenticated via Telegram.',
        session,
        redirectUrl: '/my-bookings',
        user: {
          id: String(id),
          name: fullName,
          username: username || null,
          photoUrl: photo_url || null,
        },
      },
      { status: 200, headers: NO_STORE }
    );

    if (session?.access_token) {
      response.cookies.set('talago_session', session.access_token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    console.error('[auth-telegram-verify] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during verification.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
