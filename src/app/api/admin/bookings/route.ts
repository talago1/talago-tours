export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        tour: {
          select: { translations: true, itinerary: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tickets: ActiveQueueTicket[] = bookings.map((b) => {
      const translations = b.tour.translations as Record<string, { title?: string }> | null;
      const itinerary = b.tour.itinerary as { time?: string }[] | null;
      return {
        id: b.id,
        bookingReference: b.bookingReference,
        tourTitle: translations?.en?.title ?? 'Unknown Tour',
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        travelDate: b.travelDate.toISOString().split('T')[0],
        guestCount: b.guestCount,
        totalPriceUSD: b.totalPriceUSD,
        hotelName: b.hotelName,
        pickupTime: itinerary?.[0]?.time ?? null,
        status: b.status as BookingStatus,
        language: b.language,
      };
    });

    return NextResponse.json({ bookings: tickets });
  } catch (error) {
    console.error('GET /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
