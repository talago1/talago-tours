import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const search = new URL(request.url).searchParams.get('status');
  const conversations = await prisma.liveChatConversation.findMany({
    where: search === 'CLOSED' ? { status: 'CLOSED' } : search === 'ALL' ? {} : { status: 'OPEN' },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true, createdAt: true } },
      _count: { select: { messages: { where: { sender: 'VISITOR', readAt: null } } } },
    },
  });
  return NextResponse.json({ conversations });
}
