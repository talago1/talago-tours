import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BOOKING_STATUS_VALUES } from '@/types/booking';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        tour: {
          select: {
            translations: true,
            destination: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
        transaction: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('GET /api/admin/bookings/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.status !== undefined) {
      if (!BOOKING_STATUS_VALUES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${BOOKING_STATUS_VALUES.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.customerName !== undefined) updateData.customerName = String(body.customerName).trim();
    if (body.customerEmail !== undefined) updateData.customerEmail = String(body.customerEmail).trim();
    if (body.customerPhone !== undefined) updateData.customerPhone = String(body.customerPhone).trim();
    if (body.hotelName !== undefined) updateData.hotelName = body.hotelName ? String(body.hotelName).trim() : null;
    if (body.roomNumber !== undefined) updateData.roomNumber = body.roomNumber ? String(body.roomNumber).trim() : null;
    if (body.travelDate !== undefined) {
      const parsedDate = new Date(body.travelDate);
      if (!isNaN(parsedDate.getTime())) {
        updateData.travelDate = parsedDate;
      }
    }
    if (body.guestCount !== undefined) updateData.guestCount = Number(body.guestCount);
    if (body.adultsCount !== undefined) updateData.adultsCount = Number(body.adultsCount);
    if (body.childrenCount !== undefined) updateData.childrenCount = Number(body.childrenCount);
    if (body.infantsCount !== undefined) updateData.infantsCount = Number(body.infantsCount);
    if (body.totalPriceUSD !== undefined) updateData.totalPriceUSD = Number(body.totalPriceUSD);
    if (body.pickupTime !== undefined) updateData.selectedPickupTime = body.pickupTime ? String(body.pickupTime).trim() : null;
    if (body.selectedPickupTime !== undefined) updateData.selectedPickupTime = body.selectedPickupTime ? String(body.selectedPickupTime).trim() : null;
    if (body.pickupDirectives !== undefined) updateData.pickupDirectives = body.pickupDirectives ? String(body.pickupDirectives).trim() : null;
    if (body.flightNumbers !== undefined) updateData.flightNumbers = body.flightNumbers ? String(body.flightNumbers).trim() : null;
    if (body.bedConfiguration !== undefined) updateData.bedConfiguration = body.bedConfiguration ? String(body.bedConfiguration).trim() : null;
    if (body.specialRequirements !== undefined) updateData.specialRequirements = body.specialRequirements ? String(body.specialRequirements).trim() : null;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus ? String(body.paymentStatus).trim() : null;

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tour: {
          select: {
            translations: true,
            destination: { select: { name: true } },
            zone: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('PATCH /api/admin/bookings/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete transactions linked to this booking
      await tx.transaction.deleteMany({
        where: { bookingId: params.id },
      });

      // 2. Unlink any reviews
      await tx.review.updateMany({
        where: { bookingId: params.id },
        data: { bookingId: null },
      });

      // 3. Delete the booking
      await tx.booking.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/bookings/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
