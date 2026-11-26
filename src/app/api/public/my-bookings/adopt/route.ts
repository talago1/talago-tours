import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { resolveRequestUser } from '@/server/customerSession';
import { adoptOwnedBookings, resolveCustomerProfileForUser } from '@/server/customerBookings';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };
const LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/public/my-bookings/adopt
 * Claims guest bookings matching the signed-in customer's email/phone by
 * linking them to their CustomerProfile. Separated from GET /api/public/my-bookings
 * so that list reads are strictly read-only and never block on row locks or
 * full-table phone scans.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'my-bookings-adopt'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const session = await getSessionFromRequest(request);
    let profile = null;

    if (session?.id) {
      profile = await prisma.customerProfile.findUnique({ where: { id: session.id } });
    }
    if (!profile && session?.telegramId) {
      profile = await prisma.customerProfile.findUnique({ where: { telegramId: session.telegramId } });
    }
    if (!profile && session?.email) {
      profile = await prisma.customerProfile.findUnique({ where: { email: session.email } });
    }

    if (!profile) {
      const auth = await resolveRequestUser(request);
      const user = auth?.user;
      if (user?.email) {
        const resolved = await resolveCustomerProfileForUser(user);
        profile = resolved.profile;
      }
    }

    if (!profile) {
      return NextResponse.json({ authenticated: false, adopted: false }, { status: 200, headers: NO_STORE });
    }

    const phones = [
      profile.phone,
      profile.telegramPhone,
      session?.phone,
      session?.telegramPhone,
    ].filter(Boolean);

    const emails = [profile.email, session?.email].filter(Boolean) as string[];

    await adoptOwnedBookings({ profileId: profile.id, emails, phones });

    return NextResponse.json({ authenticated: true, adopted: true }, { headers: NO_STORE });
  } catch (err) {
    console.error('[my-bookings-adopt] Error:', err);
    return NextResponse.json({ authenticated: false, error: 'Failed to adopt bookings' }, { status: 500, headers: NO_STORE });
  }
}
