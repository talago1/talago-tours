import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCheckInLogEntry } from '@/utils/voucherLogManager';
import type { VerifyResponse } from '@/types/voucher';
import type { Prisma } from '@prisma/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { ref: string } }
): Promise<NextResponse<VerifyResponse>> {
  const ref = params.ref;

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: ref },
    select: { isCheckedIn: true, checkedInAt: true, checkInLog: true },
  });

  if (!booking) {
    return NextResponse.json(
      { success: false, error: 'Booking not found' },
      { status: 404 }
    );
  }

  if (booking.isCheckedIn) {
    return NextResponse.json(
      {
        success: true,
        checkedInAt: booking.checkedInAt?.toISOString() ?? '',
        message: 'Already checked in',
      },
      { status: 200 }
    );
  }

  const logEntry = createCheckInLogEntry();

  const updatedBooking = await prisma.booking.update({
    where: { bookingReference: ref },
    data: {
      isCheckedIn: true,
      checkedInAt: new Date(logEntry.timestamp),
      checkInLog: {
        push: logEntry as unknown as Prisma.InputJsonValue,
      },
    },
    select: { isCheckedIn: true, checkedInAt: true },
  });

  return NextResponse.json(
    {
      success: true,
      checkedInAt: updatedBooking.checkedInAt?.toISOString() ?? '',
      message: 'Check-in successful',
    },
    { status: 200 }
  );
}
