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
        roomNumber: b.roomNumber,
        pickupTime: itinerary?.[0]?.time ?? null,
        pickupDirectives: b.pickupDirectives,
        flightNumbers: b.flightNumbers,
        bedConfiguration: b.bedConfiguration ?? b.bedConfig,
        bedConfig: b.bedConfig ?? b.bedConfiguration,
        specialRequirements: b.specialRequirements,
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids, all, status, tourId, startDate, endDate, month } = body as {
      ids?: string[];
      all?: boolean;
      status?: string;
      tourId?: string;
      startDate?: string;
      endDate?: string;
      month?: string;
    };

    let whereClause: any = {};

    if (all === true) {
      whereClause = {};
    } else if (Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      const filters: any[] = [];
      if (status && status !== 'ALL') {
        filters.push({ status });
      }
      if (tourId && tourId !== 'ALL') {
        filters.push({ tourId });
      }
      if (month) {
        const [y, m] = month.split('-').map(Number);
        if (y && m) {
          const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
          const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59));
          filters.push({ travelDate: { gte: startOfMonth, lte: endOfMonth } });
        }
      } else if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00Z`);
        if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59Z`);
        filters.push({ travelDate: dateFilter });
      }

      if (filters.length === 0) {
        return NextResponse.json(
          { error: 'Provide ids array, filter criteria (tourId, date, month, status), or all=true to delete' },
          { status: 400 }
        );
      }

      whereClause = { AND: filters };
    }

    const bookingsToDelete = await prisma.booking.findMany({
      where: whereClause,
      select: { id: true },
    });

    const targetIds = bookingsToDelete.map((b) => b.id);

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No bookings matched' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated transactions
      await tx.transaction.deleteMany({
        where: { bookingId: { in: targetIds } },
      });

      // 2. Unlink associated reviews
      await tx.review.updateMany({
        where: { bookingId: { in: targetIds } },
        data: { bookingId: null },
      });

      // 3. Delete the bookings
      await tx.booking.deleteMany({
        where: { id: { in: targetIds } },
      });
    });

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `Successfully deleted ${targetIds.length} booking(s)`,
    });
  } catch (error) {
    console.error('DELETE /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Failed to delete bookings' }, { status: 500 });
  }
}
