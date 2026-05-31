import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || '', 10);
  const month = parseInt(searchParams.get('month') || '', 10);

  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: 'Invalid year/month' }, { status: 400 });
  }

  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));

  const results = await prisma.booking.groupBy({
    by: ['travelDate'],
    where: {
      travelDate: { gte: start, lt: end },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    _count: true,
  });

  const dates = results.map((r) => {
    const d = new Date(r.travelDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  return NextResponse.json({ dates });
}
