import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { deriveGuestEmail } from '@/utils/bookingValidation';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

function sanitizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const limit = rateLimit(clientKey(request, 'auth-phone-verify-otp'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phone;
    const submittedCode = String(body?.code || '').trim();

    if (!rawPhone || !submittedCode) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
    const settingKey = `auth_otp_${cleanPhone}`;

    const record = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Code expired or not requested. Please request a new code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    let parsed: { code: string; expiresAt: number; attempts: number };
    try {
      parsed = JSON.parse(record.value);
    } catch {
      return NextResponse.json(
        { error: 'Invalid verification record. Please request a new code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // Check expiration
    if (Date.now() > parsed.expiresAt) {
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // Check code match
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
        data: {
          value: JSON.stringify({ ...parsed, attempts }),
        },
      });

      return NextResponse.json(
        { error: 'Incorrect verification code. Please check and try again.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // Code matches! Clear the OTP from storage
    await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});

    // Resolve target email:
    // Look up existing CustomerProfile by phone number to see if they have a real email
    const existingProfile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
        ],
      },
    });

    const syntheticEmail = deriveGuestEmail(cleanPhone);
    const targetEmail = (existingProfile?.email && !existingProfile.email.endsWith('@noreply.talago.com'))
      ? existingProfile.email
      : syntheticEmail;

    // Create or update CustomerProfile
    const profileName = existingProfile?.name || `Traveler +${cleanPhone.slice(-4)}`;
    await prisma.customerProfile.upsert({
      where: { email: targetEmail },
      create: {
        email: targetEmail,
        name: profileName,
        phone: `+${cleanPhone}`,
        isShadow: false,
      },
      update: {
        phone: `+${cleanPhone}`,
        isShadow: false,
      },
    });

    // Build the redirect URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.nextUrl.origin;
    const finalRedirect = `${appUrl}/my-bookings`;

    // Generate Supabase sign-in link (creates user automatically if missing)
    let actionLink: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetEmail,
        options: { redirectTo: finalRedirect },
      });

      if (!linkError && linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      } else {
        console.warn('[auth-phone-verify-otp] Supabase generateLink warning:', linkError);
      }
    } catch (sbErr) {
      console.warn('[auth-phone-verify-otp] Supabase admin error:', sbErr);
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Successfully verified.',
        actionLink,
        redirectUrl: '/my-bookings',
        email: targetEmail,
      },
      { status: 200, headers: NO_STORE }
    );

    return response;
  } catch (err: any) {
    console.error('[auth-phone-verify-otp] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
