import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { dispatchPostTourReviewInvitation } from '@/utils/notificationDispatcher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const result = await dispatchPostTourReviewInvitation(booking.id);

    return NextResponse.json({
      success: result.success,
      bookingReference: booking.bookingReference,
      customerName: booking.customerName,
      error: result.error,
    });
  } catch (err: any) {
    console.error('[send-review-invite] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch review invitation' },
      { status: 500 }
    );
  }
}
