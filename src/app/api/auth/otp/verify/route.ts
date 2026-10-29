import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { deriveGuestEmail } from '@/utils/bookingValidation';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

function cleanIdentifierString(val: string): string {
  const digitsOnly = val.replace(/[^\d]/g, '');
  if (digitsOnly.length >= 7) return digitsOnly;
  return val.replace(/[@\s]/g, '').toLowerCase();
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-otp-verify'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body?.identifier || body?.phone;
    const submittedCode = String(body?.code || '').trim();

    if (!rawIdentifier || !submittedCode) {
      return NextResponse.json(
        { error: 'Identifier and verification code are required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const cleanIdentifier = cleanIdentifierString(rawIdentifier);
    const settingKey = `auth_otp_${cleanIdentifier}`;

    const record = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Verification code has expired or was not requested.' },
        { status: 400, headers: NO_STORE }
      );
    }

    let parsed: { code: string; expiresAt: number; attempts: number; channel?: string };
    try {
      parsed = JSON.parse(record.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid verification record.' },
        { status: 400, headers: NO_STORE }
      );
    }

    if (Date.now() > parsed.expiresAt) {
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    if (parsed.code !== submittedCode) {
      const attempts = (parsed.attempts || 0) + 1;
      if (attempts >= 5) {
        await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Please request a new code.' },
          { status: 429, headers: NO_STORE }
        );
      }

      await prisma.systemSetting.update({
        where: { key: settingKey },
        data: { value: JSON.stringify({ ...parsed, attempts }) },
      });

      return NextResponse.json(
        { error: 'Incorrect verification code. Please check and try again.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // Code verified! Remove record
    await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});

    // Resolve user email
    const isPhone = /^\d+$/.test(cleanIdentifier);
    const syntheticEmail = isPhone
      ? deriveGuestEmail(cleanIdentifier)
      : `telegram-${cleanIdentifier}@noreply.talago.com`;

    const existingProfile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          ...(isPhone ? [{ phone: cleanIdentifier }, { phone: `+${cleanIdentifier}` }] : []),
          { email: syntheticEmail },
        ],
      },
    });

    const targetEmail = (existingProfile?.email && !existingProfile.email.endsWith('@noreply.talago.com'))
      ? existingProfile.email
      : syntheticEmail;

    const profileName = existingProfile?.name || (isPhone ? `Traveler +${cleanIdentifier.slice(-4)}` : `@${cleanIdentifier}`);

    await prisma.customerProfile.upsert({
      where: { email: targetEmail },
      create: {
        email: targetEmail,
        name: profileName,
        phone: isPhone ? `+${cleanIdentifier}` : undefined,
        isShadow: false,
      },
      update: {
        phone: isPhone ? `+${cleanIdentifier}` : undefined,
        isShadow: false,
      },
    });

    // Build the redirect URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.nextUrl.origin;
    const finalRedirect = `${appUrl}/my-bookings`;

    let actionLink: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetEmail,
        options: { redirectTo: finalRedirect },
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      }
    } catch (sbErr) {
      console.warn('[auth-otp-verify] Supabase generateLink notice:', sbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully verified.',
        actionLink,
        redirectUrl: '/my-bookings',
        email: targetEmail,
      },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[auth-otp-verify] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
