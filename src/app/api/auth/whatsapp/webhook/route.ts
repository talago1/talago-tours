import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/whatsapp/webhook
 * Meta WhatsApp Business Platform webhook verification handshake.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
    console.log('[whatsapp-webhook] Webhook verified successfully with Meta.');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Unauthorized webhook verification.' }, { status: 403 });
}

/**
 * POST /api/auth/whatsapp/webhook
 * Receives incoming WhatsApp messages from verified business webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Check entry structure from Meta WhatsApp Cloud API
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      // Event is not an incoming message (e.g. status update), acknowledge 200
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const message = messages[0];
    const fromPhone = message?.from; // e.g. "201222434602"
    const textBody = message?.text?.body || '';

    // Match challenge pattern: TALAGO-AUTH-XXXXXX
    const match = textBody.match(/TALAGO-AUTH-[A-F0-9]{6}/i);
    if (!match || !fromPhone) {
      return NextResponse.json({ status: 'no_matching_challenge' }, { status: 200 });
    }

    const challenge = match[0].toUpperCase();
    const settingKey = `wa_auth_${challenge}`;

    const record = await prisma.systemSetting.findUnique({
      where: { key: settingKey },
    });

    if (!record) {
      console.warn(`[whatsapp-webhook] Challenge ${challenge} not found or already consumed.`);
      return NextResponse.json({ status: 'challenge_not_found' }, { status: 200 });
    }

    let parsed: { challenge: string; expiresAt: number; verified: boolean; phone: string | null };
    try {
      parsed = JSON.parse(record.value);
    } catch {
      return NextResponse.json({ status: 'invalid_record' }, { status: 200 });
    }

    if (Date.now() > parsed.expiresAt) {
      console.warn(`[whatsapp-webhook] Challenge ${challenge} received after expiration.`);
      await prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      return NextResponse.json({ status: 'challenge_expired' }, { status: 200 });
    }

    // Mark challenge as verified by sender phone!
    await prisma.systemSetting.update({
      where: { key: settingKey },
      data: {
        value: JSON.stringify({
          ...parsed,
          verified: true,
          phone: fromPhone,
          verifiedAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[whatsapp-webhook] Challenge ${challenge} verified for phone +${fromPhone}`);

    return NextResponse.json({ status: 'verified', challenge }, { status: 200 });
  } catch (err: any) {
    console.error('[whatsapp-webhook] Error processing inbound webhook:', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

