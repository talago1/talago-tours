import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  if (isAdminRequest(request)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (token === cronSecret) return true;
  }
  // In local development without CRON_SECRET or ADMIN_API_TOKEN, allow internal testing
  if (!cronSecret && !process.env.ADMIN_API_TOKEN && process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  return handleReviewInvitations(request);
}

export async function GET(request: NextRequest) {
  return handleReviewInvitations(request);
}

async function handleReviewInvitations(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Look for departures that took place between 4 hours ago and 48 hours ago
    const minHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const maxHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find confirmed or completed bookings within the window that have not had a review invite logged yet
    const candidateBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        travelDate: {
          gte: maxHoursAgo,
          lte: minHoursAgo,
        },
        reviews: {
          none: {},
        },
      },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
      },
      take: 50,
      orderBy: { travelDate: 'asc' },
    });

    if (candidateBookings.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No candidate bookings for review invitation' });
    }

    const { dispatchPostTourReviewInvitation } = await import('@/utils/notificationDispatcher');

    const results = await Promise.allSettled(
      candidateBookings.map((b) => dispatchPostTourReviewInvitation(b.id))
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.filter((r) => r.status === 'rejected' || !(r.value as any)?.success).length;

    console.log(`[post-tour-reviews] Processed: ${candidateBookings.length}, Sent: ${sent}, Failed: ${failed}`);

    return NextResponse.json({
      processed: candidateBookings.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error('[post-tour-reviews] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

