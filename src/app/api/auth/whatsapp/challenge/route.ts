import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuthoritativeContactSettings, buildWhatsAppLink } from '@/lib/contactSettings';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'auth-whatsapp-challenge'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const contact = await getAuthoritativeContactSettings();
    const businessPhone = contact.whatsappNumber;

    // Generate single-use random 6-character hex challenge token
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const challenge = `TALAGO-AUTH-${randomSuffix}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const settingKey = `wa_auth_${challenge}`;
    const payload = JSON.stringify({
      challenge,
      businessPhone,
      expiresAt,
      verified: false,
      phone: null,
      createdAt: new Date().toISOString(),
    });

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: payload },
      update: { key: settingKey, value: payload },
    });

    const verificationMessage = `TALAGO verification challenge: ${challenge}`;
    const whatsappUrl = buildWhatsAppLink(businessPhone, verificationMessage);

    // Is inbound webhook configured?
    const hasWebhookConfigured = Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);

    return NextResponse.json(
      {
        success: true,
        challenge,
        businessPhone,
        whatsappUrl,
        expiresAt,
        hasWebhookConfigured,
      },
      { status: 200, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[auth-whatsapp-challenge] Error:', err);
    return NextResponse.json(
      { error: 'Failed to initiate WhatsApp verification challenge.' },
      { status: 500, headers: NO_STORE }
    );
  }
}

