import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BOOKING_STATUS_VALUES, VALID_TRANSITIONS } from '@/types/booking';
import type { BookingStatus } from '@/types/booking';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (!status || !BOOKING_STATUS_VALUES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${BOOKING_STATUS_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Admins can set any valid status (or enforce transitions unless admin override)
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('PATCH /api/admin/bookings/[id]/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
