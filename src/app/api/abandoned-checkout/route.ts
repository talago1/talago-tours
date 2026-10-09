import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/abandoned-checkout
 *
 * Stores or updates a partial checkout entry.
 * Called client-side on blur after name/phone fields are filled.
 * Upserts on phone to avoid duplicate rows per session.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'abandoned-checkout'), LIMIT, WINDOW_MS);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const body = await request.json();

    const tourId = sanitizePlain(body.tourId, 50);
    const name = sanitizePlain(body.name, 100);
    const phone = sanitizePhone(body.phone);
    const email = body.email ? sanitizeEmail(body.email) : null;
    const guestCount = typeof body.guestCount === 'number' ? body.guestCount : 1;
    const travelDate = body.travelDate ? sanitizePlain(body.travelDate, 20) : null;
    const step = body.step === 'form' ? 'form' : 'modal';

    if (!tourId || !name || !phone) {
      return NextResponse.json(
        { error: 'tourId, name, and phone are required' },
        { status: 400 }
      );
    }

    // Upsert: update existing entry for the same phone + tour, or create new
    const existing = await prisma.abandonedCheckout.findFirst({
      where: { phone: phone.trim(), tourId, isRecovered: false },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await prisma.abandonedCheckout.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          email: email?.trim() ?? existing.email,
          guestCount,
          travelDate: travelDate ?? existing.travelDate,
          step,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.abandonedCheckout.create({
        data: {
          tourId,
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() ?? null,
          guestCount,
          travelDate,
          step,
        },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[abandoned-checkout] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
