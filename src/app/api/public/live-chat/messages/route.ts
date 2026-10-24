import { NextRequest, NextResponse } from 'next/server';
import { LiveChatSender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizeText } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';
const COOKIE_NAME = 'talago_live_chat';

async function currentConversation(request: NextRequest) {
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
    select: { id: true, sender: true, body: true, createdAt: true },
  });
  await prisma.liveChatMessage.updateMany({
    where: { conversationId: conversation.id, sender: LiveChatSender.ADMIN, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ conversation: { id: conversation.id, status: conversation.status }, messages });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'live-chat-message'), 25, 10 * 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  const conversation = await currentConversation(request);
  if (!conversation || conversation.status === 'CLOSED') {
    return NextResponse.json({ error: 'Chat is unavailable' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const text = sanitizeText(body.text, 1200);
    if (!text) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const message = await prisma.liveChatMessage.create({
      data: { conversationId: conversation.id, sender: LiveChatSender.VISITOR, body: text },
      select: { id: true, sender: true, body: true, createdAt: true },
    });
    await prisma.liveChatConversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Unable to send live chat message:', error);
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}
