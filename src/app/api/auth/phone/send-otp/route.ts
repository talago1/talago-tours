import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

function sanitizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-phone-send-otp'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phone;

    if (!rawPhone || typeof rawPhone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
    if (cleanPhone.length < 8 || cleanPhone.length > 16) {
      return NextResponse.json(
        { error: 'Please enter a valid international phone number with country code (e.g. +201222434602).' },
        { status: 400, headers: NO_STORE }
      );
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const settingKey = `auth_otp_${cleanPhone}`;
    const payload = JSON.stringify({
      code: otpCode,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: payload },
      update: { key: settingKey, value: payload },
    });

    const instanceId = process.env.GREEN_API_ID;
    const token = process.env.GREEN_API_TOKEN;
    let whatsappSent = false;

    const whatsappMessage = `TALAGO Tours verification code: ${otpCode}. Valid for 10 minutes.`;

    if (instanceId && token) {
      try {
        const chatId = `${cleanPhone}@c.us`;
        const res = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message: whatsappMessage }),
        });

        if (res.ok) {
          whatsappSent = true;
          const json = await res.json().catch(() => ({}));
          await prisma.notificationLog.create({
            data: {
              bookingId: `auth_${cleanPhone}`,
              channel: 'WHATSAPP_AUTH_OTP',
              recipient: cleanPhone,
              status: 'SENT',
              messageId: json?.idMessage || null,
              sentAt: new Date(),
            },
          }).catch(() => {});
        }
      } catch (waErr) {
        console.warn('[auth-phone-send-otp] Green-API dispatch failed:', waErr);
      }
    }

    const isDev = process.env.NODE_ENV !== 'production' || !whatsappSent;

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code dispatched.',
        phone: cleanPhone,
        ...(isDev ? { devOtp: otpCode } : {}),
      },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[auth-phone-send-otp] Server error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
