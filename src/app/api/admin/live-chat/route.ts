import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LiveChatSender, LiveChatStatus } from '@prisma/client';
import { sanitizeText, sanitizePlain } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingReference = searchParams.get('bookingReference')?.trim();
  const leadId = searchParams.get('leadId')?.trim();
  const conversationId = searchParams.get('conversationId')?.trim();

  // If fetching for a specific booking or lead:
  if (bookingReference || leadId || conversationId) {
    let conv = null;
    if (conversationId) {
      conv = await prisma.liveChatConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
      });
    } else if (bookingReference) {
      conv = await prisma.liveChatConversation.findFirst({
        where: {
          OR: [
            { bookingReference },
            { visitorToken: `booking:${bookingReference}` },
          ],
        },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
      });
    } else if (leadId) {
      conv = await prisma.liveChatConversation.findFirst({
        where: {
          OR: [
            { leadId },
            { visitorToken: `lead:${leadId}` },
          ],
        },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
      });
    }

    if (conv) {
      const messages = (conv.messages || []).map((m) => ({
        id: m.id,
        body: m.body,
        text: m.body,
        sender: m.sender,
        senderRole: m.sender,
        createdAt: m.createdAt,
      }));
      return NextResponse.json({
        conversation: conv,
        messages,
      });
    }

    return NextResponse.json({
      conversation: null,
      messages: [],
    });
  }

  const statusParam = searchParams.get('status');
  const query = searchParams.get('search')?.trim() || '';

  const where: any = {};

  if (statusParam === 'CLOSED') {
    where.status = 'CLOSED';
  } else if (statusParam !== 'ALL') {
    where.status = 'OPEN';
  }

  if (query) {
    where.OR = [
      { visitorName: { contains: query, mode: 'insensitive' } },
      { visitorEmail: { contains: query, mode: 'insensitive' } },
      { visitorPhone: { contains: query, mode: 'insensitive' } },
      { bookingReference: { contains: query, mode: 'insensitive' } },
      { tourTitle: { contains: query, mode: 'insensitive' } },
      { lastPagePath: { contains: query, mode: 'insensitive' } },
      { messages: { some: { body: { contains: query, mode: 'insensitive' } } } },
    ];
  }

  const conversations = await prisma.liveChatConversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true, createdAt: true } },
      _count: { select: { messages: { where: { sender: 'VISITOR', readAt: null } } } },
    },
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = sanitizeText(body.text || body.message, 1200);
    if (!text) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const bookingReference = sanitizePlain(body.bookingReference, 50) || undefined;
    const leadId = sanitizePlain(body.leadId, 60) || undefined;
    const conversationId = sanitizePlain(body.conversationId, 60) || undefined;

    let conv = null;
    if (conversationId) {
      conv = await prisma.liveChatConversation.findUnique({ where: { id: conversationId } });
    } else if (bookingReference) {
      conv = await prisma.liveChatConversation.findFirst({
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
            visitorName: sanitizePlain(body.customerName, 100) || undefined,
            visitorEmail: sanitizePlain(body.customerEmail, 100) || undefined,
            visitorPhone: sanitizePlain(body.customerPhone, 50) || undefined,
            tourTitle: sanitizePlain(body.tourTitle, 150) || undefined,
          },
        });
      }
    } else if (leadId) {
      conv = await prisma.liveChatConversation.findFirst({
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
            visitorName: sanitizePlain(body.customerName, 100) || undefined,
            visitorEmail: sanitizePlain(body.customerEmail, 100) || undefined,
            visitorPhone: sanitizePlain(body.customerPhone, 50) || undefined,
            tourTitle: sanitizePlain(body.tourTitle, 150) || undefined,
          },
        });
      }
    }

    if (!conv) {
      return NextResponse.json({ error: 'Target conversation not found' }, { status: 404 });
    }

    const message = await prisma.liveChatMessage.create({
      data: {
        conversationId: conv.id,
        sender: LiveChatSender.ADMIN,
        body: text,
      },
      select: { id: true, sender: true, body: true, createdAt: true },
    });

    await prisma.liveChatConversation.update({
      where: { id: conv.id },
      data: {
        status: LiveChatStatus.OPEN,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ message, conversationId: conv.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to send admin chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length <= 80).slice(0, 100) : [];
    if (ids.length === 0) return NextResponse.json({ error: 'Select at least one conversation.' }, { status: 400 });
    const result = await prisma.liveChatConversation.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch {
    return NextResponse.json({ error: 'Unable to delete conversations' }, { status: 500 });
  }
}
