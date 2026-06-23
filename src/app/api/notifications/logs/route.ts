import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [total, rows] = await Promise.all([
      prisma.notificationLog.count({ where }),
      prisma.notificationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      channel: row.channel as 'WHATSAPP' | 'EMAIL',
      recipient: row.recipient,
      status: row.status as 'SENT' | 'DELIVERED' | 'FAILED',
      errorMessage: row.errorMessage,
      sentAt: row.sentAt.toISOString(),
      deliveredAt: null,
    }));

    return NextResponse.json({
      data,
      meta: { total, page, limit },
    });
  } catch {
    return NextResponse.json(
      { data: [], meta: { total: 0, page: 1, limit: 20 } },
      { status: 500 },
    );
  }
}
