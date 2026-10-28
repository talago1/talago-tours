import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePhone } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

function sanitizePhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned;
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
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
        { error: 'Please enter a valid international phone number with country code (e.g. +201022243460).' },
        { status: 400, headers: NO_STORE }
      );
    }

    // 2. Generate 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 3. Store OTP in SystemSetting key
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

    // 4. Send WhatsApp message via Green-API
    const instanceId = process.env.GREEN_API_ID;
    const token = process.env.GREEN_API_TOKEN;
    let whatsappSent = false;

    const whatsappMessage = `🌊 *TALAGO Tours — Verification Code*\n\nYour sign-in code is: *${otpCode}*\n\nرمز تسجيل الدخول الخاص بك هو: *${otpCode}*\n\nValid for 10 minutes. If you did not request this, please ignore.\nصالح لمدة 10 دقائق.`;

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
        } else {
          const errText = await res.text().catch(() => '');
          console.warn('[auth-phone-send-otp] Green-API error:', res.status, errText);
        }
      } catch (waErr) {
        console.warn('[auth-phone-send-otp] Green-API dispatch failed:', waErr);
      }
    } else {
      console.log(`[auth-phone-send-otp] GREEN_API credentials missing. OTP for +${cleanPhone}: ${otpCode}`);
    }

    // 5. Send Telegram alert to admin
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      try {
        const tgText = `🔐 *TALAGO AUTH LOGIN OTP*\n\n📱 *Phone:* \`+${cleanPhone}\`\n🔑 *Code:* \`${otpCode}\`\n⏰ *Expires:* 10 minutes\n📡 *WhatsApp Sent:* ${whatsappSent ? '✅ Yes' : '⚠️ No (fallback)'}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: tgText,
            parse_mode: 'Markdown',
          }),
        }).catch(() => {});
      } catch (tgErr) {
        console.warn('[auth-phone-send-otp] Telegram alert failed:', tgErr);
      }
    }

    // Return response. If credentials are not set on environment, expose code in dev for smooth developer testing.
    const isDev = process.env.NODE_ENV !== 'production' || !instanceId;

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to WhatsApp.',
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
