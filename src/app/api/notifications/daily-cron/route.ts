/**
 * /api/notifications/daily-cron
 *
 * Single Vercel Hobby-plan daily cron endpoint (runs once per day at 06:00 UTC).
 * Combines:
 *   1. Abandoned checkout recovery — sends reminder to guests who started but
 *      never completed checkout (reminderSent = false, isRecovered = false).
 *   2. Post-tour review invitations — sends WhatsApp/email invite to guests
 *      whose tour departed 1–48 hours ago and who have not yet reviewed.
 *
 * Both individual endpoints (/api/notifications/abandoned-recovery and
 * /api/notifications/post-tour-reviews) remain operational for manual admin
 * triggers and local testing.
 *
 * Auth: CRON_SECRET Bearer token (Vercel injects automatically for cron jobs),
 *       or ADMIN_API_TOKEN for manual admin calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds — give both tasks time to complete

function isAuthorized(request: NextRequest): boolean {
  if (isAdminRequest(request)) return true;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (token === cronSecret) return true;
  }
  if (!cronSecret && !process.env.ADMIN_API_TOKEN && process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Abandoned checkout recovery (daily window: past 24h, unsent reminders)
// ---------------------------------------------------------------------------

async function runAbandonedRecovery(): Promise<{ processed: number; sent: number; failed: number }> {
  // The window is generous — the flag `reminderSent: true` prevents duplicates.
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // at least 30 min old
  const candidates = await prisma.abandonedCheckout.findMany({
    where: {
      isRecovered: false,
      reminderSent: false,
      createdAt: { lte: cutoff },
    },
    take: 100,
    orderBy: { createdAt: 'asc' },
  });

  if (candidates.length === 0) return { processed: 0, sent: 0, failed: 0 };

  const { dispatchAbandonedCheckoutReminder } = await import('@/utils/notificationDispatcher');
  const results = await Promise.allSettled(
    candidates.map((entry: { id: string }) => dispatchAbandonedCheckoutReminder(entry.id))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[daily-cron:abandoned-recovery] processed=${candidates.length} sent=${sent} failed=${failed}`);
  return { processed: candidates.length, sent, failed };
}

// ---------------------------------------------------------------------------
// Post-tour review invitations (daily window: departed 4–48 hours ago)
// ---------------------------------------------------------------------------

async function runReviewInvitations(): Promise<{ processed: number; sent: number; failed: number }> {
  const now = new Date();
  // On a daily run we look at a wide window (1–48 h) so no departure is missed
  // between daily executions. NotificationLog dedup prevents double-sending.
  const minHoursAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);   // at least 1h after tour
  const maxHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);  // but no more than 48h ago

  const candidateBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      travelDate: { gte: maxHoursAgo, lte: minHoursAgo },
      reviews: { none: {} },
    },
    select: { id: true, bookingReference: true },
    take: 100,
    orderBy: { travelDate: 'asc' },
  });

  if (candidateBookings.length === 0) return { processed: 0, sent: 0, failed: 0 };

  const { dispatchPostTourReviewInvitation } = await import('@/utils/notificationDispatcher');
  const results = await Promise.allSettled(
    candidateBookings.map((b) => dispatchPostTourReviewInvitation(b.id))
  );

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success
  ).length;
  const failed = results.length - sent;
  console.log(`[daily-cron:review-invites] processed=${candidateBookings.length} sent=${sent} failed=${failed}`);
  return { processed: candidateBookings.length, sent, failed };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handleDailyCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [abandoned, reviews] = await Promise.allSettled([
      runAbandonedRecovery(),
      runReviewInvitations(),
    ]);

    return NextResponse.json({
      ok: true,
      abandonedRecovery: abandoned.status === 'fulfilled' ? abandoned.value : { error: String(abandoned.reason) },
      reviewInvitations: reviews.status === 'fulfilled' ? reviews.value : { error: String(reviews.reason) },
    });
  } catch (err) {
    console.error('[daily-cron] Fatal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleDailyCron(request);
}

export async function POST(request: NextRequest) {
  return handleDailyCron(request);
}

