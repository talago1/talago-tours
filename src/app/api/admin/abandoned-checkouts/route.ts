import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { dispatchAbandonedCheckoutReminder } from '@/utils/notificationDispatcher';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [total, recovered, pendingReminder, sentReminder, checkouts] = await Promise.all([
    prisma.abandonedCheckout.count(),
    prisma.abandonedCheckout.count({ where: { isRecovered: true } }),
    prisma.abandonedCheckout.count({ where: { isRecovered: false, reminderSent: false } }),
    prisma.abandonedCheckout.count({ where: { reminderSent: true } }),
    prisma.abandonedCheckout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  // Fetch tour titles for the checkouts
  const tourIds = Array.from(new Set(checkouts.map((c) => c.tourId).filter(Boolean)));
  const tours = await prisma.tour.findMany({
    where: { id: { in: tourIds } },
    select: { id: true, slug: true, translations: true },
  });

  const tourMap = new Map<string, string>();
  for (const t of tours) {
    const translations = t.translations as Record<string, { title?: string }> | null;
    const title = translations?.en?.title || t.slug;
    tourMap.set(t.id, title);
  }

  const enrichedCheckouts = checkouts.map((c) => ({
    ...c,
    tourTitle: tourMap.get(c.tourId) || c.tourId,
  }));

  return NextResponse.json({
    stats: {
      total,
      recovered,
      pendingReminder,
      sentReminder,
      recoveryRate: total > 0 ? Math.round((recovered / total) * 100) : 0,
    },
    checkouts: enrichedCheckouts,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  const candidates = await prisma.abandonedCheckout.findMany({
    where: {
      isRecovered: false,
      reminderSent: false,
      createdAt: { lte: cutoff },
    },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });

  if (candidates.length === 0) {
    return NextResponse.json({
      message: 'No pending abandoned checkouts eligible for recovery (requires >30min inactivity).',
      processed: 0,
      sent: 0,
    });
  }

  const results = await Promise.allSettled(
    candidates.map((entry) => dispatchAbandonedCheckoutReminder(entry.id))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({
    message: `Recovery run completed: ${sent} reminders dispatched (${failed} failed).`,
    processed: candidates.length,
    sent,
    failed,
  });
}
