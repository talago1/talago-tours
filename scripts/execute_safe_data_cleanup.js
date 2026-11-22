/*
 * Safe Production Data Cleanup Script
 * Cleans verified unnecessary development clutter:
 * 1. Anonymous booking leads (no name, no phone, no email, no linked booking).
 * 2. Empty live chat conversations (0 messages, no linked booking).
 * 3. Orphaned test notification logs referencing deleted booking IDs.
 *
 * All real customer accounts, bookings, transactions, reviews, tours, and valid leads are strictly preserved.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`=== TALAGO SAFE DATA CLEANUP ===`);
  console.log(`Mode: ${APPLY ? '🚨 APPLY (Executing deletion)' : '🔍 DRY-RUN (Preview only)'}\n`);

  // 1. Anonymous booking leads
  const anonymousLeads = await prisma.bookingLead.findMany({
    where: {
      customerPhone: null,
      customerEmail: null,
      customerName: null,
      bookingId: null,
    },
    select: { id: true, createdAt: true, tourSlug: true },
  });
  console.log(`Found ${anonymousLeads.length} anonymous booking leads with zero contact info.`);

  // 2. Empty conversations (0 messages)
  const emptyConversations = await prisma.liveChatConversation.findMany({
    where: {
      messages: { none: {} },
      bookingId: null,
    },
    select: { id: true, visitorToken: true, createdAt: true },
  });
  console.log(`Found ${emptyConversations.length} empty live chat conversations with zero messages.`);

  // 3. Orphaned NotificationLog records
  const existingBookings = await prisma.booking.findMany({ select: { id: true } });
  const validBookingIdSet = new Set(existingBookings.map(b => b.id));

  const allLogs = await prisma.notificationLog.findMany({
    select: { id: true, bookingId: true, channel: true, createdAt: true },
  });
  const orphanedLogs = allLogs.filter(log => log.bookingId && !validBookingIdSet.has(log.bookingId));
  console.log(`Found ${orphanedLogs.length} orphaned notification logs referencing dead booking IDs.`);

  // 4. Orphaned LiveChatConversations with dead bookingReference
  const validBookingRefSet = new Set(
    (await prisma.booking.findMany({ select: { bookingReference: true } })).map(b => b.bookingReference)
  );
  const convsWithDeadBookingRef = await prisma.liveChatConversation.findMany({
    where: {
      bookingReference: { not: null },
    },
    select: { id: true, bookingReference: true, _count: { select: { messages: true } } },
  });
  const deadRefConvs = convsWithDeadBookingRef.filter(c => c.bookingReference && !validBookingRefSet.has(c.bookingReference));
  console.log(`Found ${deadRefConvs.length} conversations referencing non-existent bookingReference.`);

  if (!APPLY) {
    console.log('\n--- DRY-RUN SUMMARY ---');
    console.log(`Records to be cleaned:`);
    console.log(` - Anonymous Leads: ${anonymousLeads.length}`);
    console.log(` - Empty Conversations: ${emptyConversations.length}`);
    console.log(` - Orphaned Notification Logs: ${orphanedLogs.length}`);
    console.log(` - Dead Reference Conversations: ${deadRefConvs.length}`);
    console.log(`\nTo execute, re-run with: node scripts/execute_safe_data_cleanup.js --apply`);
    return;
  }

  // EXECUTE APPLY
  console.log('\nExecuting safe cleanup in database...');

  // A. Delete anonymous leads
  if (anonymousLeads.length > 0) {
    const deletedLeads = await prisma.bookingLead.deleteMany({
      where: {
        id: { in: anonymousLeads.map(l => l.id) },
      },
    });
    console.log(`✅ Deleted ${deletedLeads.count} anonymous leads.`);
  }

  // B. Delete empty conversations
  if (emptyConversations.length > 0) {
    const deletedEmptyConvs = await prisma.liveChatConversation.deleteMany({
      where: {
        id: { in: emptyConversations.map(c => c.id) },
      },
    });
    console.log(`✅ Deleted ${deletedEmptyConvs.count} empty live chat conversations.`);
  }

  // C. Delete orphaned notification logs
  if (orphanedLogs.length > 0) {
    const deletedLogs = await prisma.notificationLog.deleteMany({
      where: {
        id: { in: orphanedLogs.map(l => l.id) },
      },
    });
    console.log(`✅ Deleted ${deletedLogs.count} orphaned notification logs.`);
  }

  // D. Delete messages and conversations for dead reference conversations
  if (deadRefConvs.length > 0) {
    const deadConvIds = deadRefConvs.map(c => c.id);
    const deletedMsgs = await prisma.liveChatMessage.deleteMany({
      where: {
        conversationId: { in: deadConvIds },
      },
    });
    const deletedDeadConvs = await prisma.liveChatConversation.deleteMany({
      where: {
        id: { in: deadConvIds },
      },
    });
    console.log(`✅ Cleaned ${deletedDeadConvs.count} dead reference conversations (${deletedMsgs.count} associated messages).`);
  }

  console.log('\n✅ Safe cleanup completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
