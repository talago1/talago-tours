import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;
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

    // 3. Replay protection: auth_date must be fresh (within 24 hours) and not in future
    const nowSec = Math.floor(Date.now() / 1000);
    const authDateNum = Number(auth_date);

    if (isNaN(authDateNum) || nowSec - authDateNum > 86400 || authDateNum > nowSec + 300) {
      return NextResponse.json(
        { error: 'Telegram authentication token has expired. Please try again.' },
        { status: 401, headers: NO_STORE }
      );
    }

    // 4. Stable customer identity
    const syntheticEmail = `telegram-${id}@noreply.talago.com`;
    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || (username ? `@${username}` : `Traveler #${id}`);

    // Create or update CustomerProfile in PostgreSQL
    const profile = await prisma.customerProfile.upsert({
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

    // 5. Generate Supabase Auth session link
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.nextUrl.origin;
    const finalRedirect = `${appUrl}/my-bookings`;

    let actionLink: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: syntheticEmail,
        options: { redirectTo: finalRedirect },
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      } else {
        console.warn('[auth-telegram-verify] Supabase generateLink notice:', linkError);
      }
    } catch (sbErr) {
      console.warn('[auth-telegram-verify] Supabase admin error:', sbErr);
    }

    // 6. Return verified response
    return NextResponse.json(
      {
        success: true,
        message: 'Successfully authenticated via Telegram.',
        actionLink,
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
  } catch (err: any) {
    console.error('[auth-telegram-verify] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during verification.' },
      { status: 500, headers: NO_STORE }
    );
  }
}

