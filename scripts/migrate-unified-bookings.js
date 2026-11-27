/**
 * One-time idempotent migration from BookingLead + LiveChatConversation + LiveChatMessage
 * into the unified Booking + BookingConversation + BookingMessage model.
 *
 * Run with: node scripts/migrate-unified-bookings.js
 */
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function phoneDigits(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

function phoneMatchKey(raw) {
  let digits = phoneDigits(raw);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith('20') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 10) digits = digits.slice(1);
  if (digits.length < 8 || digits.length > 12) return null;
  return digits;
}

function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

function parseTravelDate(raw, fallbackDate) {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallbackDate || new Date();
}

async function main() {
  console.log('[migrate-unified-bookings] Starting migration...');

  // 1. Backfill CustomerProfile.phoneNormalized
  const profiles = await prisma.customerProfile.findMany();
  let profilesUpdated = 0;
  for (const prof of profiles) {
    const norm = phoneMatchKey(prof.phone || prof.telegramPhone);
    if (norm && prof.phoneNormalized !== norm) {
      await prisma.customerProfile.update({
        where: { id: prof.id },
        data: { phoneNormalized: norm },
      });
      profilesUpdated++;
    }
  }
  console.log(`Updated ${profilesUpdated}/${profiles.length} CustomerProfile.phoneNormalized`);

  // 2. Backfill existing Booking.customerPhoneNormalized
  const existingBookings = await prisma.booking.findMany();
  let bookingsNormalized = 0;
  const usedRefs = new Set(existingBookings.map((b) => b.bookingReference));
  const usedIdempotencyKeys = new Set(existingBookings.map((b) => b.idempotencyKey).filter(Boolean));

  for (const b of existingBookings) {
    const norm = phoneMatchKey(b.customerPhone);
    if (norm && b.customerPhoneNormalized !== norm) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { customerPhoneNormalized: norm },
      });
      bookingsNormalized++;
    }
  }
  console.log(`Normalized phone on ${bookingsNormalized}/${existingBookings.length} existing Bookings`);

  // 3. Migrate BookingLead records
  const leads = await prisma.bookingLead.findMany({ orderBy: { createdAt: 'asc' } });
  const leadToBookingId = new Map();
  let reconciledLeads = 0;
  let migratedLeads = 0;

  for (const lead of leads) {
    if (lead.bookingId) {
      // Already linked to a canonical Booking — reconcile source/notes if missing
      leadToBookingId.set(lead.id, lead.bookingId);
      const existing = existingBookings.find((b) => b.id === lead.bookingId);
      if (existing) {
        const patch = {};
        if (lead.source && (!existing.source || existing.source === 'WEBSITE')) {
          patch.source = lead.source;
        }
        if (lead.notes && !existing.notes) {
          patch.notes = lead.notes;
        }
        if (Object.keys(patch).length > 0) {
          await prisma.booking.update({ where: { id: existing.id }, data: patch });
        }
      }
      reconciledLeads++;
      continue;
    }

    // Check if an existing booking was already created with the same idempotencyKey/sessionId
    if (lead.sessionId && usedIdempotencyKeys.has(lead.sessionId)) {
      const matched = await prisma.booking.findUnique({ where: { idempotencyKey: lead.sessionId } });
      if (matched) {
        leadToBookingId.set(lead.id, matched.id);
        reconciledLeads++;
        continue;
      }
    }

    // Check if we already migrated this lead in an earlier run (using id: lead.id or ref)
    let baseRef = `RES-${lead.id.slice(-8).toUpperCase()}`;
    const alreadyMigrated = await prisma.booking.findFirst({
      where: {
        OR: [{ id: lead.id }, { bookingReference: baseRef }],
      },
    });
    if (alreadyMigrated) {
      leadToBookingId.set(lead.id, alreadyMigrated.id);
      reconciledLeads++;
      continue;
    }

    let ref = baseRef;
    let suffix = 1;
    while (usedRefs.has(ref)) {
      ref = `${baseRef}-${suffix++}`;
    }
    usedRefs.add(ref);

    const idemKey = lead.sessionId && !usedIdempotencyKeys.has(lead.sessionId) ? lead.sessionId : null;
    if (idemKey) usedIdempotencyKeys.add(idemKey);

    const status = lead.status === 'ABANDONED' ? 'CANCELLED' : 'INTERESTED';
    const adults = Math.max(1, lead.adults || 1);
    const children = Math.max(0, lead.children || 0);

    const created = await prisma.booking.create({
      data: {
        id: lead.id, // Preserve lead ID as canonical Booking ID for continuity!
        bookingReference: ref,
        accessToken: generateAccessToken(),
        idempotencyKey: idemKey,
        tourId: lead.tourId || null,
        tourTitleSnapshot: lead.tourTitle || null,
        tourSlugSnapshot: lead.tourSlug || null,
        travelDate: parseTravelDate(lead.travelDate, lead.createdAt),
        adultsCount: adults,
        childrenCount: children,
        infantsCount: 0,
        guestCount: adults + children,
        totalPriceUSD: typeof lead.totalEstimatedPrice === 'number' ? lead.totalEstimatedPrice : 0,
        currency: lead.currency || 'USD',
        customerName: lead.customerName || '',
        customerEmail: lead.customerEmail || '',
        customerPhone: lead.customerPhone || '',
        customerPhoneNormalized: phoneMatchKey(lead.customerPhone),
        status,
        source: lead.source || 'BOOK_BUTTON',
        notes: lead.notes || null,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
    });

    leadToBookingId.set(lead.id, created.id);
    migratedLeads++;
  }
  console.log(`Leads processed: ${reconciledLeads} reconciled, ${migratedLeads} migrated to INTERESTED/CANCELLED Bookings`);

  // 4. Migrate LiveChatConversation & LiveChatMessage -> BookingConversation & BookingMessage
  const oldConvs = await prisma.liveChatConversation.findMany({
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });

  let migratedConvs = 0;
  let mergedConvs = 0;
  let migratedMsgs = 0;
  const oldConvToNewConv = new Map();

  for (const conv of oldConvs) {
    let targetBookingId = conv.bookingId || null;

    if (!targetBookingId && conv.leadId) {
      targetBookingId = leadToBookingId.get(conv.leadId) || null;
    }

    if (!targetBookingId && conv.bookingReference) {
      const b = await prisma.booking.findUnique({
        where: { bookingReference: conv.bookingReference },
        select: { id: true },
      });
      if (b) targetBookingId = b.id;
    }

    // Also handle visitorToken patterns: "lead:<id>" or "booking:<ref>"
    if (!targetBookingId && conv.visitorToken?.startsWith('lead:')) {
      const lid = conv.visitorToken.slice(5);
      targetBookingId = leadToBookingId.get(lid) || null;
    }
    if (!targetBookingId && conv.visitorToken?.startsWith('booking:')) {
      const ref = conv.visitorToken.slice(8);
      const b = await prisma.booking.findUnique({ where: { bookingReference: ref }, select: { id: true } });
      if (b) targetBookingId = b.id;
    }

    let targetConv = null;
    if (targetBookingId) {
      targetConv = await prisma.bookingConversation.findUnique({ where: { bookingId: targetBookingId } });
    } else if (conv.visitorToken) {
      targetConv = await prisma.bookingConversation.findUnique({ where: { visitorToken: conv.visitorToken } });
    }

    if (!targetConv) {
      targetConv = await prisma.bookingConversation.create({
        data: {
          id: conv.id, // Preserve conversation ID where possible
          bookingId: targetBookingId,
          visitorToken: targetBookingId ? null : conv.visitorToken,
          visitorName: conv.visitorName,
          visitorEmail: conv.visitorEmail,
          visitorPhone: conv.visitorPhone,
          tourTitle: conv.tourTitle,
          lastPagePath: conv.lastPagePath,
          status: conv.status,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        },
      });
      migratedConvs++;
    } else {
      mergedConvs++;
      if (conv.lastMessageAt > targetConv.lastMessageAt) {
        await prisma.bookingConversation.update({
          where: { id: targetConv.id },
          data: { lastMessageAt: conv.lastMessageAt },
        });
      }
    }

    oldConvToNewConv.set(conv.id, targetConv.id);

    for (const msg of conv.messages) {
      const existingMsg = await prisma.bookingMessage.findUnique({ where: { id: msg.id } });
      if (!existingMsg) {
        await prisma.bookingMessage.create({
          data: {
            id: msg.id,
            conversationId: targetConv.id,
            sender: msg.sender,
            body: msg.body,
            readAt: msg.readAt,
            createdAt: msg.createdAt,
          },
        });
        migratedMsgs++;
      }
    }
  }
  console.log(`Conversations: ${migratedConvs} created, ${mergedConvs} merged into canonical booking, ${migratedMsgs} messages migrated`);

  // 5. Update NotificationLog records so all point to canonical bookingId & bookingReference
  const logs = await prisma.notificationLog.findMany({
    where: { channel: { in: ['NEW_BOOKING_ALERT', 'LEAD_INTEREST_ALERT', 'CUSTOMER_MESSAGE_ALERT'] } },
  });
  let logsUpdated = 0;

  for (const log of logs) {
    let meta = {};
    try {
      meta = log.errorMessage ? JSON.parse(log.errorMessage) : {};
    } catch {
      meta = {};
    }

    let canonicalBookingId = log.bookingId;
    if (leadToBookingId.has(log.bookingId)) {
      canonicalBookingId = leadToBookingId.get(log.bookingId);
    } else if (meta.leadId && leadToBookingId.has(meta.leadId)) {
      canonicalBookingId = leadToBookingId.get(meta.leadId);
    } else if (meta.conversationId && oldConvToNewConv.has(meta.conversationId)) {
      const conv = await prisma.bookingConversation.findUnique({
        where: { id: oldConvToNewConv.get(meta.conversationId) },
        select: { bookingId: true },
      });
      if (conv?.bookingId) canonicalBookingId = conv.bookingId;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: canonicalBookingId },
      select: { id: true, bookingReference: true },
    });

    if (booking) {
      const nextMeta = {
        ...meta,
        bookingReference: booking.bookingReference,
        bookingId: booking.id,
      };
      if (meta.conversationId && oldConvToNewConv.has(meta.conversationId)) {
        nextMeta.conversationId = oldConvToNewConv.get(meta.conversationId);
      }
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          bookingId: booking.id,
          errorMessage: JSON.stringify(nextMeta),
        },
      });
      logsUpdated++;
    }
  }
  console.log(`Updated ${logsUpdated}/${logs.length} NotificationLog records to canonical Booking references`);

  // 6. Verify totals
  const [totalBookings, totalConvs, totalMsgs] = await Promise.all([
    prisma.booking.count(),
    prisma.bookingConversation.count(),
    prisma.bookingMessage.count(),
  ]);
  console.log('[migrate-unified-bookings] Final counts:', { totalBookings, totalConvs, totalMsgs });
}

main()
  .catch((err) => {
    console.error('[migrate-unified-bookings] FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
