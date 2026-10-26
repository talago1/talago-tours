import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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
