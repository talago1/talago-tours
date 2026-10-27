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

    // Synchronize CRM: advance any linked lead from INTERESTED to CONTACTED
    if (conversation.visitorEmail || conversation.visitorPhone) {
      await prisma.bookingLead.updateMany({
        where: {
          status: 'INTERESTED',
          OR: [
            ...(conversation.visitorEmail ? [{ customerEmail: conversation.visitorEmail }] : []),
            ...(conversation.visitorPhone ? [{ customerPhone: conversation.visitorPhone }] : []),
          ],
        },
        data: {
          status: 'CONTACTED',
          updatedAt: new Date(),
        },
      }).catch(() => {});
    }

    // TAL-C6: Record admin reply in NotificationLog for monitoring
    await prisma.notificationLog.create({
      data: {
        bookingId: conversation.id,
        channel: 'ADMIN_CHAT_REPLY',
        recipient: conversation.visitorEmail || conversation.visitorPhone || conversation.visitorName || 'Visitor',
        status: 'SENT',
        messageId: message.id,
      },
    }).catch(() => {});

    // Dispatch branded email notification to visitor if email is present
    if (conversation.visitorEmail && process.env.RESEND_API_KEY) {
      try {
        const { sendAdminReplyEmail } = await import('@/lib/email');
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';
        // Extract any reservation/inquiry reference from the conversation messages
        const refMatch = body.match(/\[((?:RES|INQ)-[A-Z0-9]+)\]/);
        const reference = refMatch?.[1] ?? 'CHAT';
        await sendAdminReplyEmail(conversation.visitorEmail, {
          customerName: conversation.visitorName || 'Traveler',
          reference,
          adminMessage: body,
          replyUrl: `${SITE_URL}/my-bookings`,
        });
      } catch (emailErr) {
        console.warn('[live-chat/reply] Email notification non-fatal error:', emailErr);
      }
    }

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
