import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail } from '@/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    const customerPhone = body.customerPhone ? sanitizePhone(body.customerPhone) : null;
    let customerEmail = body.customerEmail ? sanitizeEmail(body.customerEmail) : null;
    const travelDate = body.travelDate ? sanitizePlain(body.travelDate, 30) : null;
    const adults = parseGuestCount(body.adults, 1, 1);
    const children = parseGuestCount(body.children, 0, 0);
    const totalEstimatedPrice = parseEstimatedPrice(body.totalEstimatedPrice);
    const currency = body.currency ? sanitizePlain(body.currency, 10).toUpperCase() : 'USD';
    const source = body.source ? sanitizePlain(body.source, 50) : 'BOOK_BUTTON';
    const sessionId = body.sessionId ? sanitizePlain(body.sessionId, 100) : null;
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

    // A signed-in customer is the source of truth for the profile email. Do
    // not let a browser claim another person's address just to place a draft
    // reservation in their account.
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;
    if (accessToken) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
      if (user?.email) {
        customerEmail = user.email.toLowerCase();
        customerName = sanitizePlain(user.user_metadata?.name, 100) || customerName;
      }
    }

    // Never create leads for a client-invented trip or use a client-supplied
    // title in admin notifications. The catalog is the source of truth.
    const tour = requestedTourId
      ? await prisma.tour.findUnique({
          where: { id: requestedTourId },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true },
        })
      : await prisma.tour.findUnique({
          where: { slug: requestedTourSlug! },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true },
        });

    if (!tour || tour.status?.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tourId = tour.id;
    const tourSlug = tour.slug;
    const tourTranslations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = tourTranslations?.en?.title || tour.slug;

    // TAL-O3: Overbooking prevention check
    const requestedGuests = (adults || 1) + (children || 0);
    if (travelDate && tour.maxCapacity && tour.maxCapacity > 0) {
      const parsedDate = new Date(travelDate);
      if (!isNaN(parsedDate.getTime())) {
        const dayStart = new Date(parsedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const existingPax = await prisma.booking.aggregate({
          where: {
            tourId: tour.id,
            travelDate: { gte: dayStart, lt: dayEnd },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          _sum: { guestCount: true },
        });

        const currentOccupancy = existingPax._sum.guestCount ?? 0;
        const availableSpots = Math.max(0, tour.maxCapacity - currentOccupancy);

        if (requestedGuests > availableSpots) {
          return NextResponse.json({
            error: availableSpots <= 0
              ? `This experience is fully booked for ${parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
              : `Only ${availableSpots} spot${availableSpots === 1 ? '' : 's'} remaining for ${parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
            code: 'CAPACITY_EXCEEDED',
            availableSpots,
          }, { status: 409 });
        }
      }
    }

    // Deduplication check: recent active lead within last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const existingLead = await prisma.bookingLead.findFirst({
      where: {
        createdAt: { gte: tenMinutesAgo },
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED'] },
        OR: [
          ...(sessionId ? [{ sessionId }] : []),
          ...(customerPhone ? [{ customerPhone }] : []),
          ...(customerEmail ? [{ customerEmail }] : []),
        ],
        ...(tourId ? { tourId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    let lead;
    let isNewNotificationNeeded = false;
    let isNewReservation = false;
    const existingChatToken = request.cookies.get('talago_live_chat')?.value;
    const chatToken = existingChatToken || crypto.randomUUID();

    if (existingLead) {
      lead = await prisma.bookingLead.update({
        where: { id: existingLead.id },
        data: {
          customerName: customerName || existingLead.customerName,
          customerPhone: customerPhone || existingLead.customerPhone,
          customerEmail: customerEmail || existingLead.customerEmail,
          travelDate: travelDate || existingLead.travelDate,
          adults: adults || existingLead.adults,
          children: children || existingLead.children,
          totalEstimatedPrice: totalEstimatedPrice ?? existingLead.totalEstimatedPrice,
          currency: currency || existingLead.currency,
          source: source || existingLead.source,
          notes: notes ? `${existingLead.notes ? existingLead.notes + ' | ' : ''}${notes}` : existingLead.notes,
          updatedAt: new Date(),
        },
      });

      // If contact info was just added to an previously anonymous lead, alert admin
      if (!existingLead.customerPhone && !existingLead.customerEmail && (customerPhone || customerEmail)) {
        isNewNotificationNeeded = true;
      }
    } else {
      lead = await prisma.bookingLead.create({
        data: {
          tourId,
          tourSlug,
          tourTitle,
          customerName,
          customerEmail,
          customerPhone,
          travelDate,
          adults,
          children,
          totalEstimatedPrice,
          currency,
          status: 'INTERESTED',
          source,
          sessionId,
          notes,
        },
      });
      isNewNotificationNeeded = true;
      isNewReservation = true;
    }

    const reservationReference = `RES-${lead.id.slice(-8).toUpperCase()}`;

    // Book now is the customer's explicit initial reservation action. Mirror
    // it into the live inbox so the marketplace team can respond immediately.
    // The browser's existing chat token keeps that conversation visible to the
    // same visitor when the team replies.
    if (isNewReservation) {
      const reservationMessage = `[${reservationReference}] New reservation interest: ${tourTitle}. Guests: ${adults} adult${adults === 1 ? '' : 's'}${children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}.${totalEstimatedPrice ? ` Estimated value: ${totalEstimatedPrice} ${currency}.` : ''}`;
      try {
        const conversation = await prisma.liveChatConversation.upsert({
          where: { visitorToken: chatToken },
          create: { visitorToken: chatToken, visitorName: customerName || undefined, visitorEmail: customerEmail || undefined, visitorPhone: customerPhone || undefined, lastPagePath: `/tours/${tourSlug}` },
          update: { visitorName: customerName || undefined, visitorEmail: customerEmail || undefined, visitorPhone: customerPhone || undefined, lastPagePath: `/tours/${tourSlug}`, status: 'OPEN', lastMessageAt: new Date() },
          select: { id: true },
        });
        await prisma.liveChatMessage.create({ data: { conversationId: conversation.id, sender: 'VISITOR', body: reservationMessage } });
      } catch (chatError) {
        // The reservation itself must remain available even if inbox logging
        // is temporarily unavailable.
        console.error('[booking-interest] inbox mirror failed:', chatError);
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
        `🧾 *Reference:* ${reservationReference}\n` +
        `🏝️ *Tour:* ${tourTitle || tourSlug || tourId}\n` +
        `👤 *Guest:* ${guestDisplay}\n` +
        (contactInfo ? `📱 *Contact:* ${contactInfo}\n` : '') +
        (travelDate ? `📅 *Date:* ${travelDate}\n` : '') +
        `👥 *Guests:* ${adults} Adults${children > 0 ? `, ${children} Children` : ''}\n` +
        (totalEstimatedPrice ? `💰 *Est. Value:* $${totalEstimatedPrice} ${currency}\n` : '') +
        `📍 *Source:* ${source}`;

      // 1. Log to NotificationLog
      await prisma.notificationLog.create({
        data: {
          bookingId: lead.id, // Using lead id as reference
          channel: 'LEAD_INTEREST_ALERT',
          recipient: 'Admin Dashboard',
          status: 'LOGGED',
          messageId: lead.id,
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

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      reservationReference,
      status: lead.status,
    }, {
      headers: existingChatToken ? undefined : {
        'Set-Cookie': `talago_live_chat=${chatToken}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    });
  } catch (err) {
    console.error('Failed to record booking interest:', err);
    return NextResponse.json({ error: 'Failed to record booking interest' }, { status: 500 });
  }
}
