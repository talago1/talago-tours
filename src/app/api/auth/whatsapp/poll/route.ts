import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { deriveGuestEmail } from '@/utils/bookingValidation';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 60; // 60 polls per 10 minutes
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

export async function GET(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-whatsapp-poll'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (!challenge || !challenge.startsWith('TALAGO-AUTH-')) {
    return NextResponse.json({ status: 'INVALID', error: 'Invalid challenge token' }, { status: 400, headers: NO_STORE });
  }

  try {
    const settingKey = `wa_auth_${challenge}`;
    const record = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!record) {
      return NextResponse.json({ status: 'EXPIRED', message: 'Challenge has expired or does not exist.' }, { headers: NO_STORE });
    }

    let parsed: { challenge: string; expiresAt: number; verified: boolean; phone: string | null };
    try {
      parsed = JSON.parse(record.value);
    } catch {
      return NextResponse.json({ status: 'EXPIRED' }, { headers: NO_STORE });
    }

    if (Date.now() > parsed.expiresAt) {
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json({ status: 'EXPIRED', message: 'Challenge expired.' }, { headers: NO_STORE });
    }

    if (!parsed.verified || !parsed.phone) {
      return NextResponse.json({ status: 'PENDING', message: 'Waiting for incoming verification message.' }, { headers: NO_STORE });
    }

    // Challenge has been verified by the inbound webhook!
    // Consume challenge immediately to prevent replay
    await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});

    const cleanPhone = parsed.phone.replace(/[^\d]/g, '');
    const syntheticEmail = deriveGuestEmail(cleanPhone);

    // Upsert CustomerProfile
    const profile = await prisma.customerProfile.upsert({
      where: { email: syntheticEmail },
      create: {
        email: syntheticEmail,
        name: `Traveler +${cleanPhone.slice(-4)}`,
        phone: `+${cleanPhone}`,
        isShadow: false,
      },
      update: {
        phone: `+${cleanPhone}`,
        isShadow: false,
      },
    });

    // Generate Supabase session
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
      }
    } catch (sbErr) {
      console.warn('[auth-whatsapp-poll] Supabase link generation notice:', sbErr);
    }

    return NextResponse.json(
      {
        status: 'VERIFIED',
        phone: `+${cleanPhone}`,
        actionLink,
        redirectUrl: '/my-bookings',
      },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[auth-whatsapp-poll] Error:', err);
    return NextResponse.json({ status: 'ERROR', error: 'Internal polling error' }, { status: 500, headers: NO_STORE });
  }
}

