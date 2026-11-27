import { NextRequest, NextResponse } from 'next/server';
import { BookingMessageSender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizeText, sanitizePlain } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';
const COOKIE_NAME = 'talago_live_chat';

async function currentConversation(request: NextRequest, body?: any) {
  const url = request.nextUrl;
  let bookingReference =
    sanitizePlain(url.searchParams.get('bookingReference') || request.headers.get('x-booking-ref') || body?.bookingReference, 50) || undefined;
  let bookingId =
    sanitizePlain(url.searchParams.get('bookingId') || url.searchParams.get('leadId') || request.headers.get('x-lead-id') || body?.bookingId || body?.leadId, 60) || undefined;
  if (bookingReference?.startsWith('lead:')) {
    bookingId = bookingReference.replace(/^lead:/, '');
    bookingReference = undefined;
  }
  const conversationId =
    sanitizePlain(url.searchParams.get('conversationId') || request.headers.get('x-conversation-id') || body?.conversationId, 60) || undefined;

  if (conversationId) {
    const conv = await prisma.bookingConversation.findUnique({
      where: { id: conversationId },
      include: { booking: { select: { id: true, bookingReference: true } } },
    });
    if (conv) return conv;
  }

  if (!bookingId && bookingReference) {
    const b = await prisma.booking.findUnique({ where: { bookingReference }, select: { id: true } });
    if (b) bookingId = b.id;
  }

  if (bookingId) {
    const conv = await prisma.bookingConversation.upsert({
      where: { bookingId },
      create: {
        bookingId,
        lastPagePath: `/account?tab=bookings`,
      },
      update: {},
      include: { booking: { select: { id: true, bookingReference: true } } },
    });
    return conv;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return prisma.bookingConversation.findUnique({
    where: { visitorToken: token },
    include: { booking: { select: { id: true, bookingReference: true } } },
  });
}

export async function GET(request: NextRequest) {
  const conversation = await currentConversation(request);
  if (!conversation) return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });

  const messages = await prisma.bookingMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: { id: true, sender: true, body: true, createdAt: true, readAt: true },
  });

  await prisma.bookingMessage.updateMany({
    where: { conversationId: conversation.id, sender: BookingMessageSender.ADMIN, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      status: conversation.status,
      bookingId: conversation.bookingId,
      bookingReference: conversation.booking?.bookingReference || null,
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

    const message = await prisma.bookingMessage.create({
      data: {
        conversationId: conversation.id,
        sender: BookingMessageSender.VISITOR,
        body: text,
      },
      select: { id: true, sender: true, body: true, createdAt: true },
    });

    await prisma.bookingConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: 'OPEN',
        ...(body.tourTitle && !conversation.tourTitle ? { tourTitle: sanitizePlain(body.tourTitle, 150) } : {}),
      },
    });

    // Persist in-app Admin Notification pointing directly to canonical Booking + conversation
    await prisma.notificationLog.create({
      data: {
        bookingId: conversation.bookingId || conversation.id,
        channel: 'CUSTOMER_MESSAGE_ALERT',
        recipient: 'Admin Dashboard',
        status: 'UNREAD',
        messageId: `msg-${message.id}`,
        errorMessage: JSON.stringify({
          conversationId: conversation.id,
          bookingId: conversation.bookingId || null,
          bookingReference: conversation.booking?.bookingReference || null,
          customerName: conversation.visitorName || conversation.visitorEmail || 'Customer',
          tourTitle: conversation.tourTitle || (body.tourTitle ? sanitizePlain(body.tourTitle, 150) : null),
          preview: text.slice(0, 140),
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Unable to send live chat message:', error);
    return NextResponse.json({ error: 'Unable to send message' }, { status: 500 });
  }
}
