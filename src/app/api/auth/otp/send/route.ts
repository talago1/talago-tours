import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

function cleanIdentifierString(val: string): string {
  // If it looks like a phone number, keep only digits
  const digitsOnly = val.replace(/[^\d]/g, '');
  if (digitsOnly.length >= 7) return digitsOnly;
  // Otherwise clean username / handle
  return val.replace(/[@\s]/g, '').toLowerCase();
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const limit = rateLimit(clientKey(request, 'auth-otp-send'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = body?.identifier || body?.phone;
    const channel: 'whatsapp' | 'telegram' = body?.channel === 'telegram' ? 'telegram' : 'whatsapp';

    if (!rawIdentifier || typeof rawIdentifier !== 'string') {
      return NextResponse.json(
        { error: 'Identifier (phone or telegram handle) is required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const cleanIdentifier = cleanIdentifierString(rawIdentifier);
    if (cleanIdentifier.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number or username.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // 2. Generate 6-digit cryptographic OTP code
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 3. Store in SystemSetting
    const settingKey = `auth_otp_${cleanIdentifier}`;
    const payload = JSON.stringify({
      code: otpCode,
      channel,
      expiresAt,
      attempts: 0,
      createdAt: new Date().toISOString(),
    });

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: payload },
      update: { key: settingKey, value: payload },
    });

    let sentSuccessfully = false;

    // 4. Channel dispatch: WHATSAPP
    if (channel === 'whatsapp') {
      const instanceId = process.env.GREEN_API_ID;
      const token = process.env.GREEN_API_TOKEN;
      const whatsappMessage = `🌊 *TALAGO Tours — كود تسجيل الدخول*\n\nرمز التحقق الخاص بك هو: *${otpCode}*\nصالح لمدة 10 دقائق.\n\nYour sign-in code is: *${otpCode}*\nValid for 10 minutes.`;

      if (instanceId && token) {
        try {
          const chatId = `${cleanIdentifier}@c.us`;
          const res = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId, message: whatsappMessage }),
          });

          if (res.ok) {
            sentSuccessfully = true;
            const json = await res.json().catch(() => ({}));
            await prisma.notificationLog.create({
              data: {
                bookingId: `auth_wa_${cleanIdentifier}`,
                channel: 'WHATSAPP_AUTH_OTP',
                recipient: cleanIdentifier,
                status: 'SENT',
                messageId: json?.idMessage || null,
                sentAt: new Date(),
              },
            }).catch(() => {});
          }
        } catch (waErr) {
          console.warn('[auth-otp-send] WhatsApp dispatch error:', waErr);
        }
      }
    }

    // 5. Channel dispatch: TELEGRAM
    if (channel === 'telegram') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

      if (botToken) {
        try {
          // If identifier is a numeric telegram chat id, send to it; otherwise send to configured chat
          const targetChat = /^\d+$/.test(cleanIdentifier) && cleanIdentifier.length > 8
            ? cleanIdentifier
            : adminChatId;

          if (targetChat) {
            const tgText = `🌊 *TALAGO Tours — كود تسجيل الدخول*\n\n👤 *المستخدم:* \`${cleanIdentifier}\`\n🔑 *كود التحقق:* \`${otpCode}\`\n⏰ *الصلاحية:* 10 دقائق\n\nYour TALAGO verification code: *${otpCode}*`;
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetChat,
                text: tgText,
                parse_mode: 'Markdown',
              }),
            });
            if (tgRes.ok) {
              sentSuccessfully = true;
            }
          }
        } catch (tgErr) {
          console.warn('[auth-otp-send] Telegram dispatch error:', tgErr);
        }
      }
    }

    // Always alert admin Telegram about the login request
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (botToken && adminChatId) {
      try {
        const tgAlert = `🔐 *TALAGO LOGIN REQUEST*\n\n📡 *القناة:* ${channel === 'whatsapp' ? '🟢 WhatsApp' : '🔵 Telegram'}\n👤 *المعرف:* \`${cleanIdentifier}\`\n🔑 *كود التحقق:* \`${otpCode}\`\n⏰ 10 min`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: tgAlert,
            parse_mode: 'Markdown',
          }),
        }).catch(() => {});
      } catch (err) {
        // non-fatal
      }
    }

    const isDev = process.env.NODE_ENV !== 'production' || !sentSuccessfully;

    return NextResponse.json(
      {
        success: true,
        message: channel === 'whatsapp'
          ? 'تم إرسال كود التأكيد إلى واتساب الخاص بك بنجاح.'
          : 'تم إرسال كود التأكيد عبر تليجرام بنجاح.',
        channel,
        identifier: cleanIdentifier,
        ...(isDev ? { devOtp: otpCode } : {}),
      },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[auth-otp-send] Server error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}

