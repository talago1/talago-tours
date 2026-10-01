import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/qrTokenCrypto';
import { createCheckInLogEntry } from '@/utils/voucherLogManager';
import type { ScanVerificationResult } from '@/types/voucher';
import type { Prisma } from '@prisma/client';

function getTourTitle(translations: unknown): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of ['en', 'de', 'ru', 'fr', 'it', 'tr']) {
      const entry = t[key];
      if (entry && typeof entry.title === 'string') return entry.title;
    }
  }
  return 'Tour';
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ScanVerificationResult>> {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired QR token' },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: payload.bookingId },
        include: { tour: true },
      });

      if (!booking || !booking.tour) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new Error('BOOKING_NOT_CONFIRMED');
      }

      // Claim the check-in atomically. Reading isCheckedIn and then updating
      // leaves a window where two simultaneous scans both pass the check and
      // check the same passenger in twice.
      const claim = await tx.booking.updateMany({
        where: { id: payload.bookingId, isCheckedIn: false },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      });
      if (claim.count === 0) {
        throw new Error('ALREADY_CHECKED_IN');
      }

      const logEntry = createCheckInLogEntry();

      // `checkInLog` is a scalar Json column, not a Json list. Prisma does not
      // provide a JSON push for it, so `{ push: entry }` would store the literal
      // object {"push": entry} rather than appending to the array, and
      // hasExistingCheckIn() would then reject it via Array.isArray().
      const existing = await tx.booking.findUnique({
        where: { id: payload.bookingId },
        select: { checkInLog: true },
      });
      const logs = Array.isArray(existing?.checkInLog) ? existing.checkInLog : [];

      const updated = await tx.booking.update({
        where: { id: payload.bookingId },
        data: {
          isCheckedIn: true,
          checkedInAt: new Date(logEntry.timestamp),
          checkInLog: [...logs, logEntry] as unknown as Prisma.InputJsonValue,
        },
        include: { tour: true },
      });

      return {
        passengerName: updated.customerName,
        tourTitle: getTourTitle(updated.tour.translations),
        paxCount: updated.guestCount,
        hotelName: updated.hotelName ?? undefined,
        roomNumber: updated.roomNumber,
      };
    });

    return NextResponse.json(
      { success: true, ...result },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';

    switch (message) {
      case 'BOOKING_NOT_FOUND':
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      case 'BOOKING_NOT_CONFIRMED':
        return NextResponse.json(
          { success: false, error: 'Booking is not in CONFIRMED status' },
          { status: 400 }
        );
      case 'ALREADY_CHECKED_IN':
        return NextResponse.json(
          { success: false, error: 'This passenger has already been checked in' },
          { status: 400 }
        );
      default:
        console.error('Verify QR error:', error);
        return NextResponse.json(
          { success: false, error: 'Verification failed' },
          { status: 500 }
        );
    }
  }
}
