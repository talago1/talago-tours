import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizeEmail, sanitizePhone, sanitizePlain } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'talago_live_chat';

function conversationCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'live-chat-session'), 20, 10 * 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const body = await request.json().catch(() => ({}));
    const token = request.cookies.get(COOKIE_NAME)?.value || crypto.randomUUID();
    const visitorName = sanitizePlain(body.name, 100) || undefined;
    const visitorEmail = sanitizeEmail(body.email) || undefined;
    const visitorPhone = sanitizePhone(body.phone) || undefined;
    const lastPagePath = sanitizePlain(body.pagePath, 240) || undefined;

    const conversation = await prisma.liveChatConversation.upsert({
      where: { visitorToken: token },
      create: { visitorToken: token, visitorName, visitorEmail, visitorPhone, lastPagePath },
      update: {
        visitorName,
        visitorEmail,
        visitorPhone,
        lastPagePath,
      },
      select: { id: true, visitorName: true, visitorEmail: true, visitorPhone: true },
    });

    const response = NextResponse.json({ conversation });
    conversationCookie(response, token);
    return response;
  } catch (error) {
    console.error('Unable to start live chat session:', error);
    return NextResponse.json({ error: 'Unable to start chat session' }, { status: 500 });
  }
}
