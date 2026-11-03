import { NextRequest, NextResponse } from 'next/server';
import { LiveChatSender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizeText, sanitizePlain } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';
const COOKIE_NAME = 'talago_live_chat';

async function currentConversation(request: NextRequest, body?: any) {
  const url = request.nextUrl;
  const bookingReference =
    sanitizePlain(url.searchParams.get('bookingReference') || request.headers.get('x-booking-ref') || body?.bookingReference, 50) || undefined;
  const leadId =
    sanitizePlain(url.searchParams.get('leadId') || request.headers.get('x-lead-id') || body?.leadId, 60) || undefined;
  const conversationId =
    sanitizePlain(url.searchParams.get('conversationId') || request.headers.get('x-conversation-id') || body?.conversationId, 60) || undefined;

  if (conversationId) {
    const conv = await prisma.liveChatConversation.findUnique({ where: { id: conversationId } });
    if (conv) return conv;
  }

  if (bookingReference) {
    let conv = await prisma.liveChatConversation.findFirst({
      where: {
        OR: [
          { bookingReference },
          { visitorToken: `booking:${bookingReference}` },
        ],
      },
    });
    if (!conv) {
      conv = await prisma.liveChatConversation.create({
        data: {
          visitorToken: `booking:${bookingReference}`,
          bookingReference,
          lastPagePath: `/account/bookings/${bookingReference}`,
        },
      });
    }
    return conv;
  }

  if (leadId) {
    let conv = await prisma.liveChatConversation.findFirst({
      where: {
        OR: [
          { leadId },
          { visitorToken: `lead:${leadId}` },
        ],
      },
    });
    if (!conv) {
      conv = await prisma.liveChatConversation.create({
        data: {
          visitorToken: `lead:${leadId}`,
          leadId,
          lastPagePath: `/account/requests/${leadId}`,
        },
      });
    }
    return conv;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.liveChatConversation.findUnique({ where: { visitorToken: token } });
}

export async function GET(request: NextRequest) {
  const conversation = await currentConversation(request);
  if (!conversation) return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });

  const messages = await prisma.liveChatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: { id: true, sender: true, body: true, createdAt: true, readAt: true },
  });

  await prisma.liveChatMessage.updateMany({
    where: { conversationId: conversation.id, sender: LiveChatSender.ADMIN, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      bookingReference: conversation.bookingReference,
      leadId: conversation.leadId,
      tourTitle: conversation.tourTitle,
    },
    messages,
  });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'live-chat-message'), 35, 10 * 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const conversation = await currentConversation(request, body);
  if (!conversation || conversation.status === 'CLOSED') {
    return NextResponse.json({ error: 'Chat is unavailable' }, { status: 404 });
  }

  try {
    const text = sanitizeText(body.text, 1200);
    if (!text) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const message = await prisma.liveChatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: LiveChatSender.VISITOR,
        body: text,
      },
      select: { id: true, sender: true, body: true, createdAt: true },
    });

    await prisma.liveChatConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: 'OPEN',
        ...(body.tourTitle && !conversation.tourTitle ? { tourTitle: sanitizePlain(body.tourTitle, 150) } : {}),
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Unable to send live chat message:', error);
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}
