import { NextRequest, NextResponse } from 'next/server';
import { LiveChatSender, LiveChatStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { conversationId: string } }) {
  const conversation = await prisma.liveChatConversation.findUnique({
    where: { id: params.conversationId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
  });
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  await prisma.liveChatMessage.updateMany({
    where: { conversationId: conversation.id, sender: LiveChatSender.VISITOR, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ conversation });
}

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { text } = await request.json();
    const body = sanitizeText(text, 1200);
    if (!body) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    const conversation = await prisma.liveChatConversation.findUnique({ where: { id: params.conversationId } });
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    const message = await prisma.liveChatMessage.create({ data: { conversationId: conversation.id, sender: LiveChatSender.ADMIN, body } });
    await prisma.liveChatConversation.update({ where: { id: conversation.id }, data: { status: LiveChatStatus.OPEN, lastMessageAt: new Date() } });
    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { conversationId: string } }) {
  const { status } = await request.json();
  if (!Object.values(LiveChatStatus).includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const conversation = await prisma.liveChatConversation.update({ where: { id: params.conversationId }, data: { status } });
  return NextResponse.json({ conversation });
}

export async function DELETE(_: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    await prisma.liveChatConversation.delete({ where: { id: params.conversationId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
}
