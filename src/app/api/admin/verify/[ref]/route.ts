import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCheckInLogEntry } from '@/utils/voucherLogManager';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import type { VerifyResponse } from '@/types/voucher';
import type { Prisma } from '@prisma/client';

// Defence in depth. The endpoint is admin-gated by middleware, but a stolen or
// borrowed admin cookie plus a guessable bookingReference would otherwise let
// someone burn through references. Check-in is one-way (ALREADY_CHECKED_IN
// afterwards), so bulk enumeration is destructive, not just a read.
const LIMIT = 60;
const WINDOW_MS = 10 * 60 * 1000;

const NO_STORE = { 'cache-control': 'no-store, private' };

type VerifyParams = { params: { ref: string } };

/**
 * GET /api/admin/verify/[ref]
 *
 * Read-only. Reports the current check-in state and never mutates the booking.
 *
 * This used to be a GET that performed the check-in, which the admin page then
 * fired from a useEffect on mount. That made check-in happen on mere page
 * load - no staff confirmation, and any prefetch, reload or stray visit to the
 * URL permanently consumed the passenger's voucher.
 */
export async function GET(
  request: NextRequest,
  { params }: VerifyParams,
): Promise<NextResponse<VerifyResponse>> {
  const limit = rateLimit(clientKey(request, 'admin-verify-read'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds) as NextResponse<VerifyResponse>;
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: params.ref },
    select: { isCheckedIn: true, checkedInAt: true },
  });

  if (!booking) {
    return NextResponse.json(
      { success: false, error: 'Booking not found', isCheckedIn: false },
      { status: 404, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    {
      success: true,
      checkedInAt: booking.checkedInAt?.toISOString() ?? '',
      message: booking.isCheckedIn ? 'Already checked in' : 'Not checked in',
      isCheckedIn: booking.isCheckedIn,
    },
    { status: 200, headers: NO_STORE },
  );
}

/**
 * POST /api/admin/verify/[ref]
 *
 * Performs the check-in. Kept as an explicit POST so it can only happen from a
 * deliberate staff action.
 */
export async function POST(
  request: NextRequest,
  { params }: VerifyParams,
): Promise<NextResponse<VerifyResponse>> {
  const limit = rateLimit(clientKey(request, 'admin-verify-write'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds) as NextResponse<VerifyResponse>;
  }

  const ref = params.ref;

  // Guard the write on isCheckedIn inside the update itself rather than
  // read-then-write, so two concurrent scans cannot both succeed.
  const claimed = await prisma.booking.updateMany({
    where: { bookingReference: ref, isCheckedIn: false },
    data: { isCheckedIn: true, checkedInAt: new Date() },
  });

  if (claimed.count === 0) {
    const existing = await prisma.booking.findUnique({
      where: { bookingReference: ref },
      select: { isCheckedIn: true, checkedInAt: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Booking not found', isCheckedIn: false },
        { status: 404, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      {
        success: true,
        checkedInAt: existing.checkedInAt?.toISOString() ?? '',
        message: 'Already checked in',
        isCheckedIn: true,
      },
      { status: 200, headers: NO_STORE },
    );
  }

  // `checkInLog` is a scalar Json column, not a Json list, so Prisma does not
  // implement a JSON push for it: `checkInLog: { push: entry }` stores the
  // literal object {"push": entry} instead of appending, which then fails
  // Array.isArray() in hasExistingCheckIn(). Read, append in JS, write back.
  // The updateMany claim above already serialises this, so there is no race.
  const logEntry = createCheckInLogEntry();
  const current = await prisma.booking.findUnique({
    where: { bookingReference: ref },
    select: { checkInLog: true },
  });
  const logs = Array.isArray(current?.checkInLog) ? current.checkInLog : [];

  const updated = await prisma.booking.update({
    where: { bookingReference: ref },
    data: {
      isCheckedIn: true,
      checkedInAt: new Date(logEntry.timestamp),
      checkInLog: [...logs, logEntry] as unknown as Prisma.InputJsonValue,
    },
    select: { checkedInAt: true },
  });

  return NextResponse.json(
    {
      success: true,
      checkedInAt: updated.checkedInAt?.toISOString() ?? '',
      message: 'Check-in successful',
      isCheckedIn: true,
    },
    { status: 200, headers: NO_STORE },
  );
}
