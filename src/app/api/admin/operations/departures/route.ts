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

  const bookings = await prisma.booking.findMany({
    where: {
      travelDate: { gte: start, lt: end },
      status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING'] },
    },
    select: {
      travelDate: true,
      guestCount: true,
      tourId: true,
      tour: {
        select: {
          maxCapacity: true,
        },
      },
    },
  });

  const dayMap: Record<
    string,
    {
      totalPassengers: number;
      tours: Record<string, { passengers: number; maxCapacity: number }>;
    }
  > = {};

  for (const b of bookings) {
    const d = new Date(b.travelDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dayMap[dateStr]) {
      dayMap[dateStr] = { totalPassengers: 0, tours: {} };
    }
    dayMap[dateStr].totalPassengers += b.guestCount;
    if (!dayMap[dateStr].tours[b.tourId]) {
      dayMap[dateStr].tours[b.tourId] = {
        passengers: 0,
        maxCapacity: b.tour?.maxCapacity ?? 0,
      };
    }
    dayMap[dateStr].tours[b.tourId].passengers += b.guestCount;
  }

  const departures: Record<
    string,
    {
      totalPassengers: number;
      status: 'OPEN' | 'SELLING_FAST' | 'SOLD_OUT' | 'OVERBOOKED';
    }
  > = {};

  for (const [dateStr, info] of Object.entries(dayMap)) {
    let dayStatus: 'OPEN' | 'SELLING_FAST' | 'SOLD_OUT' | 'OVERBOOKED' = 'OPEN';
    for (const t of Object.values(info.tours)) {
      if (t.maxCapacity > 0) {
        if (t.passengers > t.maxCapacity) {
          dayStatus = 'OVERBOOKED';
          break;
        }
        if (t.passengers === t.maxCapacity) {
          dayStatus = 'SOLD_OUT';
        } else if (t.passengers >= t.maxCapacity * 0.8 && dayStatus === 'OPEN') {
          dayStatus = 'SELLING_FAST';
        }
      }
    }
    departures[dateStr] = {
      totalPassengers: info.totalPassengers,
      status: dayStatus,
    };
  }

  const dates = Object.keys(departures).sort();

  return NextResponse.json({ dates, departures });
}
