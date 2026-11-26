import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { resolveRequestUser } from '@/server/customerSession';
import { adoptOwnedBookings, resolveCustomerProfileForUser } from '@/server/customerBookings';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/public/my-bookings/adopt
 * Claims guest bookings matching the signed-in customer's email/phone by
 * linking them to their CustomerProfile (adoptOwnedBookings).
 *
 * This is the ONLY place adoption runs outside sign-in: it exists so the
 * account page can trigger adoption once per sign-in for every auth
 * method (email login/register adopt server-side already, but Google OAuth
 * session sync and Telegram OIDC do not). It is deliberately separate
 * from GET /api/public/my-bookings so that reads never write: adoption
 * used to run an UPDATE on every list request, which serialized on
 * Booking row locks and made My Bookings slow.
 *
 * The account page calls this once after authentication and then loads
 * the first page of bookings. The call is idempotent and rate-limited;
 * calling it again (e.g. after linking a guest booking) is harmless.
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
      profile = await prisma.customerProfile.findUnique({
        where: { id: session.id },
      });
    }
    if (!profile && session?.telegramId) {
      profile = await prisma.customerProfile.findUnique({
        where: { telegramId: session.telegramId },
      });
    }
    if (!profile && session?.email) {
      profile = await prisma.customerProfile.findUnique({
        where: { email: session.email },
      });
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
      return NextResponse.json(
        { authenticated: false, adopted: false },
        { status: 200, headers: NO_STORE }
      );
    }

    const phones = [
      profile.phone,
      profile.telegramPhone,
      session?.phone,
      session?.telegramPhone,
    ].filter(Boolean);

    const emails = [profile.email, session?.email].filter(Boolean) as string[];

    await adoptOwnedBookings({ profileId: profile.id, emails, phones });

    return NextResponse.json(
      { authenticated: true, adopted: true },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error('[my-bookings-adopt] Error:', err);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to adopt bookings' },
      { status: 500, headers: NO_STORE }
    );
  }
}
