import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail } from '@/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/server/auth';
import { deriveGuestEmail } from '@/utils/bookingValidation';
import { generateBookingReference } from '@/utils/bookingReference';
import { generateAccessToken } from '@/utils/bookingToken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/public/booking-interest — the single-booking entry point.
 *
 * One Book click creates ONE preliminary Booking in INTERESTED status and
 * opens its LiveChat conversation immediately. The SAME booking row then
 * moves INTERESTED -> PENDING_PAYMENT -> CONFIRMED / CANCELLED (or
 * INTERESTED -> CONFIRMED for pay on arrival) when the guest completes
 * checkout via /api/checkout/initialize with reservationId = booking id.
 *
 * This route used to create a BookingLead and only later a separate
 * Booking, which produced two records (and two chats) for one booking.
 * It no longer creates or reads BookingLead at all: BookingLead is kept
 * only for genuine tour inquiries and as the admin leads archive.
 *
 * Idempotency: the caller's stable attempt id (attemptId /
 * idempotencyKey / sessionId) is stored as Booking.idempotencyKey, so a
 * retry, a double click, or a modal reopen resumes the same INTERESTED
 * booking instead of creating a second one. A concurrent duplicate that
 * slips past the lookup is caught on the unique-key violation (P2002)
 * and also resolves to the same booking.
 *
 * Resume: the response carries bookingId, bookingReference and the
 * 256-bit accessToken; /booking/<accessToken> (and the resume endpoint)
 * reopen this exact booking at any later step.
 */

const LIMIT = 40;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_INTEREST_GUESTS = 100;
const MAX_ESTIMATED_PRICE = 1_000_000;

function parseGuestCount(value: unknown, fallback: number, minimum: number): number | null {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > MAX_INTEREST_GUESTS) {
    return null;
  }
  return value;
}

function parseEstimatedPrice(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_ESTIMATED_PRICE) {
    return undefined;
  }
  return value;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'booking-interest'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();

    const requestedTourId = body.tourId ? sanitizePlain(body.tourId, 50) : null;
    const requestedTourSlug = body.tourSlug ? sanitizePlain(body.tourSlug, 100) : null;
    let customerName = body.customerName ? sanitizePlain(body.customerName, 100) : null;
    let customerPhone = body.customerPhone ? sanitizePhone(body.customerPhone) : null;
    let customerEmail = body.customerEmail ? sanitizeEmail(body.customerEmail) : null;
    const travelDate = body.travelDate ? sanitizePlain(body.travelDate, 30) : null;
    const adults = parseGuestCount(body.adults, 1, 1);
    const children = parseGuestCount(body.children, 0, 0);
    const totalEstimatedPrice = parseEstimatedPrice(body.totalEstimatedPrice);
    const currency = body.currency ? sanitizePlain(body.currency, 10).toUpperCase() : 'USD';
    const source = body.source ? sanitizePlain(body.source, 50) : 'BOOK_BUTTON';
    const rawAttemptId = body.attemptId || body.idempotencyKey || body.sessionId;
    const attemptId = rawAttemptId ? sanitizePlain(String(rawAttemptId), 100) : null;
    const notes = body.notes ? sanitizePlain(body.notes, 500) : null;

    if (!requestedTourId && !requestedTourSlug) {
      return NextResponse.json({ error: 'Tour information is required' }, { status: 400 });
    }

    if (adults === null || children === null || adults + children > MAX_INTEREST_GUESTS) {
      return NextResponse.json({ error: `Guest counts must be whole numbers totaling at most ${MAX_INTEREST_GUESTS}.` }, { status: 400 });
    }

    if (totalEstimatedPrice === undefined) {
      return NextResponse.json({ error: 'Estimated price must be a valid non-negative amount.' }, { status: 400 });
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'Currency must be a three-letter ISO code.' }, { status: 400 });
    }

    // A preliminary Booking needs a real travel date: Booking.travelDate is
    // NOT NULL and a fabricated date would mislead guests, admins and
    // capacity. Callers without a date yet (e.g. a freshly opened modal)
    // must wait until the guest picks one instead of calling this route.
    if (!travelDate) {
      return NextResponse.json(
        { error: 'Please select a travel date first.', code: 'TRAVEL_DATE_REQUIRED' },
        { status: 400 }
      );
    }
    const parsedTravelDate = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(travelDate) ? `${travelDate}T00:00:00` : travelDate
    );
    if (isNaN(parsedTravelDate.getTime())) {
      return NextResponse.json({ error: 'Travel date is invalid.' }, { status: 400 });
    }

    // A signed-in customer is the source of truth for the profile identity.
    const authSession = await getSessionFromRequest(request);
    if (authSession) {
      if (authSession.email && !authSession.email.endsWith('@noreply.talago.com')) {
        customerEmail = customerEmail || authSession.email.toLowerCase();
      }
      if (authSession.phone || authSession.telegramPhone) {
        customerPhone = customerPhone || sanitizePhone(authSession.phone || authSession.telegramPhone);
      }
      if (authSession.name && !customerName) {
        customerName = sanitizePlain(authSession.name, 100);
      }
    } else {
      const authHeader = request.headers.get('authorization');
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null;
      if (accessToken) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken).catch(() => ({ data: { user: null } }));
        if (user?.email) {
          customerEmail = user.email.toLowerCase();
          customerName = sanitizePlain(user.user_metadata?.name, 100) || customerName;
        }
      }
    }

    // Never create bookings for a client-invented trip or use a client-supplied
    // title in admin notifications. The catalog is the source of truth.
    const tour = requestedTourId
      ? await prisma.tour.findUnique({
          where: { id: requestedTourId },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true, adultPrice: true, childPrice: true, infantPrice: true },
        })
      : await prisma.tour.findUnique({
          where: { slug: requestedTourSlug! },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true, adultPrice: true, childPrice: true, infantPrice: true },
        });

    if (!tour || tour.status?.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tourId = tour.id;
    const tourSlug = tour.slug;
    const tourTranslations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = tourTranslations?.en?.title || tour.slug;

    // TAL-O3: Overbooking prevention check. INTERESTED bookings never
    // count: interest alone holds no inventory (same as the old leads).
    // Only bookings that already committed to a payment path count.
    const requestedGuests = (adults || 1) + (children || 0);
    if (tour.maxCapacity && tour.maxCapacity > 0) {
      const dayStart = new Date(parsedTravelDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const existingPax = await prisma.booking.aggregate({
        where: {
          tourId: tour.id,
          travelDate: { gte: dayStart, lt: dayEnd },
          status: { in: ['CONFIRMED', 'PENDING', 'PENDING_PAYMENT'] },
        },
        _sum: { guestCount: true },
      });

      const currentOccupancy = existingPax._sum.guestCount ?? 0;
      const availableSpots = Math.max(0, tour.maxCapacity - currentOccupancy);

      if (requestedGuests > availableSpots) {
        return NextResponse.json({
          error: availableSpots <= 0
            ? `This experience is fully booked for ${parsedTravelDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
            : `Only ${availableSpots} spot${availableSpots === 1 ? '' : 's'} remaining for ${parsedTravelDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
          code: 'CAPACITY_EXCEEDED',
          availableSpots,
        }, { status: 409 });
      }
    }

    // Contact placeholders: Booking requires name/email/phone strings, but
    // interest can be anonymous. These are honest placeholders, replaced
    // with the real details by /api/checkout/initialize before anything
    // is confirmed or charged. The synthetic email follows the existing
    // phone-only booking convention (noreply.talago.com).
    const finalName = customerName || 'Guest';
    const finalPhone = customerPhone || '';
    const finalEmail = customerEmail
      || (customerPhone ? deriveGuestEmail(customerPhone) : `guest-${crypto.randomUUID().slice(0, 8)}@noreply.talago.com`);

    // Price estimate: prefer the caller's estimate, else price it from the
    // catalog. Recomputed authoritatively at checkout; this is only the
    // preliminary total shown before confirmation.
    const catalogEstimate = (adults || 1) * (tour.adultPrice || 0)
      + (children || 0) * (tour.childPrice ?? tour.adultPrice ?? 0);
    const finalTotal = totalEstimatedPrice ?? catalogEstimate;

    // Deduplication: resume the in-flight INTERESTED booking for this
    // attempt (or, without an attempt id, the same tour/date/contact
    // from the last 10 minutes) instead of creating a second booking.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingBooking = attemptId
      ? await prisma.booking.findUnique({ where: { idempotencyKey: attemptId } })
      : await prisma.booking.findFirst({
          where: {
            tourId,
            travelDate: parsedTravelDate,
            status: 'INTERESTED',
            createdAt: { gte: tenMinutesAgo },
            OR: [
              ...(customerPhone ? [{ customerPhone }] : []),
              ...(customerEmail ? [{ customerEmail }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

    const existingChatToken = request.cookies.get('talago_live_chat')?.value;

    let booking;
    let isNewReservation = false;
    let isNewNotificationNeeded = false;

    if (existingBooking && existingBooking.status !== 'INTERESTED') {
      // This attempt already moved past interest (confirmed, awaiting
      // payment, or cancelled). Never create a second booking for the
      // same attempt: hand the existing one back untouched, with no
      // new-reservation alert.
      booking = existingBooking;
    } else if (existingBooking && existingBooking.tourId === tourId) {
      booking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: {
          customerName: customerName || existingBooking.customerName,
          customerPhone: customerPhone || existingBooking.customerPhone,
          customerEmail: customerEmail || existingBooking.customerEmail,
          travelDate: parsedTravelDate,
          guestCount: requestedGuests,
          adultsCount: adults || existingBooking.adultsCount,
          childrenCount: children || existingBooking.childrenCount,
          totalPriceUSD: totalEstimatedPrice ?? existingBooking.totalPriceUSD,
          currency,
          specialRequirements: notes
            ? `${existingBooking.specialRequirements ? existingBooking.specialRequirements + ' | ' : ''}${notes}`
            : existingBooking.specialRequirements,
          updatedAt: new Date(),
        },
      });
      // If contact info was just added to a previously anonymous booking, alert admin
      if ((!existingBooking.customerPhone || existingBooking.customerPhone === '') && (!existingBooking.customerEmail || existingBooking.customerEmail.endsWith('@noreply.talago.com')) && (customerPhone || customerEmail)) {
        isNewNotificationNeeded = true;
      }
    } else {
      // One Book click = one Booking + its conversation, atomically.
      // The conversation token is `booking:<bookingReference>` so the
      // live-chat session/messages routes resolve it by bookingReference,
      // by token, or by bookingId — no separate lead chat ever exists.
      const bookingReference = generateBookingReference();
      const accessTokenValue = generateAccessToken();
      const conversationToken = `booking:${bookingReference}`;
      const reservationMessage = `[${bookingReference}] New preliminary booking request: ${tourTitle}. Travel Date: ${travelDate}. Guests: ${adults} adult${adults === 1 ? '' : 's'}${(children || 0) > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}.${totalEstimatedPrice ? ` Estimated value: ${totalEstimatedPrice} ${currency}.` : ''}`;
      try {
        booking = await prisma.$transaction(async (tx) => {
          const created = await tx.booking.create({
            data: {
              bookingReference,
              accessToken: accessTokenValue,
              idempotencyKey: attemptId,
              tourId,
              tourTitleSnapshot: tourTitle,
              tourSlugSnapshot: tourSlug,
              travelDate: parsedTravelDate,
              guestCount: requestedGuests,
              adultsCount: adults || 1,
              childrenCount: children || 0,
              totalPriceUSD: finalTotal,
              customerName: finalName,
              customerEmail: finalEmail,
              customerPhone: finalPhone,
              currency,
              language: 'en',
              status: 'INTERESTED',
              specialRequirements: notes,
            },
          });

          const conversation = await tx.liveChatConversation.upsert({
            where: { visitorToken: conversationToken },
            create: {
              visitorToken: conversationToken,
              visitorName: finalName !== 'Guest' ? finalName : undefined,
              visitorEmail: customerEmail || undefined,
              visitorPhone: customerPhone || undefined,
              bookingId: created.id,
              bookingReference,
              tourTitle,
              lastPagePath: `/tours/${tourSlug}`,
            },
            update: {
              visitorName: finalName !== 'Guest' ? finalName : undefined,
              visitorEmail: customerEmail || undefined,
              visitorPhone: customerPhone || undefined,
              bookingId: created.id,
              bookingReference,
              tourTitle,
              lastPagePath: `/tours/${tourSlug}`,
              status: 'OPEN',
              lastMessageAt: new Date(),
            },
            select: { id: true },
          });

          const existingSystemMsg = await tx.liveChatMessage.findFirst({
            where: {
              conversationId: conversation.id,
              body: { contains: bookingReference },
            },
          });
          if (!existingSystemMsg) {
            await tx.liveChatMessage.create({
              data: { conversationId: conversation.id, sender: 'SYSTEM', body: reservationMessage },
            });
          }

          return created;
        });
        isNewReservation = true;
        isNewNotificationNeeded = true;
      } catch (txErr: any) {
        // Concurrent duplicate attempt: the unique idempotencyKey lost the
        // race after the lookup. Resolve to the winning booking instead
        // of surfacing a 500 or creating a second record — with no
        // new-reservation alert (the winner may already be confirmed).
        if (txErr?.code === 'P2002' && attemptId) {
          const winner = await prisma.booking.findUnique({ where: { idempotencyKey: attemptId } });
          if (winner) {
            booking = winner;
          } else {
            throw txErr;
          }
        } else {
          throw txErr;
        }
      }
    }

    // Trigger Admin Notification for the interest event
    if (isNewNotificationNeeded) {
      const guestDisplay = customerName || (customerPhone ? `Guest (${customerPhone})` : customerEmail ? `Guest (${customerEmail})` : 'Anonymous Visitor');
      const contactInfo = [
        customerPhone ? `📞 ${customerPhone}` : null,
        customerEmail ? `✉️ ${customerEmail}` : null,
      ].filter(Boolean).join(' | ');

      const alertText = `🔔 *New Pending Reservation!*\n\n` +
        `🧾 *Reference:* ${booking.bookingReference}\n` +
        `🏝️ *Tour:* ${tourTitle || tourSlug || tourId}\n` +
        `👤 *Guest:* ${guestDisplay}\n` +
        (contactInfo ? `📱 *Contact:* ${contactInfo}\n` : '') +
        (travelDate ? `📅 *Date:* ${travelDate}\n` : '') +
        `👥 *Guests:* ${adults} Adults${(children || 0) > 0 ? `, ${children} Children` : ''}\n` +
        (totalEstimatedPrice ? `💰 *Est. Value:* $${totalEstimatedPrice} ${currency}\n` : '') +
        `📍 *Source:* ${source}`;

      // 1. Log to NotificationLog
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'LEAD_INTEREST_ALERT',
          recipient: 'Admin Dashboard',
          status: 'LOGGED',
          messageId: booking.id,
        },
      }).catch(() => {});

      // 2. Telegram Alert if configured
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: alertText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        }).catch(() => {});
      }
    }

    const conversationToken = `booking:${booking.bookingReference}`;
    const response = NextResponse.json({
      success: true,
      // The single booking identity. Clients must pass bookingId as
      // reservationId to /api/checkout/initialize to resume it.
      bookingId: booking.id,
      // Deprecated alias: older clients read leadId. It is the same id.
      leadId: booking.id,
      bookingReference: booking.bookingReference,
      reservationReference: booking.bookingReference,
      accessToken: booking.accessToken,
      confirmationUrl: `/booking/${booking.accessToken}`,
      conversationToken,
      status: booking.status,
      isExisting: !isNewReservation,
    });

    // Point a first-time visitor's chat cookie at this booking's
    // conversation, so the live-chat widget opens the booking thread
    // immediately. An existing cookie is left alone.
    if (!existingChatToken) {
      response.cookies.set('talago_live_chat', conversationToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err) {
    console.error('Failed to record booking interest:', err);
    return NextResponse.json({ error: 'Failed to record booking interest' }, { status: 500 });
  }
}
