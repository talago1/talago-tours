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
  // In development without CRON_SECRET or ADMIN_API_TOKEN, allow internal testing
  if (!cronSecret && !process.env.ADMIN_API_TOKEN && process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  return handleRecovery(request);
}

export async function GET(request: NextRequest) {
  return handleRecovery(request);
}

async function handleRecovery(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const candidates = await prisma.abandonedCheckout.findMany({
      where: {
        isRecovered: false,
        reminderSent: false,
        createdAt: { lte: cutoff },
      },
      take: 50, // Process max 50 per run to avoid timeouts
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No candidates found' });
    }

    const { dispatchAbandonedCheckoutReminder } = await import('@/utils/notificationDispatcher');

    const results = await Promise.allSettled(
      candidates.map((entry: { id: string }) => dispatchAbandonedCheckoutReminder(entry.id))
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`[abandoned-recovery] Processed: ${candidates.length}, Sent: ${sent}, Failed: ${failed}`);

    return NextResponse.json({
      processed: candidates.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error('[abandoned-recovery] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
