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

    // Dispatch email notification to visitor if email is present
    if (conversation.visitorEmail && process.env.RESEND_API_KEY) {
      try {
        const { sendEmail } = await import('@/lib/email');
        const subject = 'New message from TALAGO Tours Concierge';
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#070F1E;color:#F8FAFC;border-radius:12px;">
            <p style="font-size:12px;color:#00E5FF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">TALAGO Tours · Customer Concierge</p>
            <h2 style="color:#ffffff;margin-top:0;">New reply from our team</h2>
            <p style="color:#94A3B8;font-size:13px;line-height:1.6;">Hello ${conversation.visitorName || 'Traveler'}, our concierge team has replied to your conversation:</p>
            <div style="background:#0B1528;border-left:3px solid #00E5FF;padding:16px;border-radius:6px;margin:20px 0;font-size:14px;color:#F8FAFC;white-space:pre-wrap;">${body}</div>
            <p style="color:#64748B;font-size:12px;">You can view and continue this conversation on the website via our live chat widget.</p>
          </div>
        `;
        await sendEmail({ to: conversation.visitorEmail, subject, html });
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
